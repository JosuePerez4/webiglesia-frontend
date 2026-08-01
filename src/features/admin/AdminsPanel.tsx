import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, RotateCcw, Shield, Trash2, UserPlus } from 'lucide-react';
import { api } from '../../services/api';
import { qkRoot } from '../../services/queryKeys';
import { useToast } from '../../components/ui/useToast';
import { useAdministradores } from '../../hooks/useAdministradores';
import { SearchInput } from '../../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ActivoFilter } from '../../components/ui/ActivoFilter';
import { type ActivoFilterValue } from '../../components/ui/activoFilterValue';
import { AdminFormModal, type AdminFormValues } from './AdminFormModal';
import type { Administrador } from '../../types';
import dataTableStyles from '../../components/ui/DataTable.module.css';
import styles from './ProfesoresTab.module.css';

export function AdminsPanel() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<ActivoFilterValue>('all');
  const { administradores } = useAdministradores();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Administrador | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [adminToToggle, setAdminToToggle] = useState<Administrador | null>(null);

  // GET /administradores no soporta ?activo=/?query= como sí lo hacen
  // /profesores y /estudiantes, así que ambos filtros se aplican en cliente.
  const filtered = administradores.filter((a) => {
    if (activoFilter === 'active' && !a.activo) return false;
    if (activoFilter === 'inactive' && a.activo) return false;
    return (
      `${a.nombre} ${a.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      a.username.toLowerCase().includes(search.toLowerCase())
    );
  });

  const openModal = (admin?: Administrador) => {
    setEditingAdmin(admin ?? null);
    setModalKey((k) => k + 1);
    setIsModalOpen(true);
  };

  const guardar = useMutation({
    mutationFn: (values: AdminFormValues) =>
      editingAdmin
        ? api.editarUsuario(editingAdmin.id, { nombreusuario: values.username, contrasena: values.contrasena })
        : api.crearAdministrador(values),
    onSuccess: async () => {
      const wasEditing = Boolean(editingAdmin);
      setIsModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: qkRoot.administradores });
      showToast(wasEditing ? 'Administrador actualizado correctamente' : 'Administrador creado correctamente');
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Error al guardar el administrador', 'error'),
  });

  const toggleActivo = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => api.cambiarEstadoUsuario(id, activo),
    onSuccess: async (_data, { activo }) => {
      await queryClient.invalidateQueries({ queryKey: qkRoot.administradores });
      showToast(activo ? 'Administrador reactivado correctamente' : 'Administrador eliminado correctamente');
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Error al cambiar el estado del administrador', 'error'),
    onSettled: () => setAdminToToggle(null),
  });

  const columns: DataTableColumn<Administrador>[] = [
    {
      header: 'Nombre Completo',
      primary: true,
      render: (a) => (
        <div className={dataTableStyles.rowMain}>
          <Avatar name={`${a.nombre} ${a.apellido}`} />
          <strong>
            {a.nombre} {a.apellido}
          </strong>
        </div>
      ),
    },
    {
      header: 'Estado',
      render: (a) => (a.activo ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>),
    },
    { header: 'Usuario', render: (a) => a.username },
    { header: 'Teléfono', render: (a) => a.telefono || '—' },
    { header: 'Correo Electrónico', render: (a) => a.correo || '—' },
  ];

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar administradores..." />
          <ActivoFilter value={activoFilter} onChange={setActivoFilter} />
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <UserPlus size={18} /> Agregar Admin
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(a) => a.id}
        emptyIcon={<Shield size={40} />}
        emptyTitle="No se encontraron administradores"
        actions={(a) => (
          <>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openModal(a)}>
              <Edit2 size={14} /> Editar
            </button>
            {a.activo ? (
              <button className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setAdminToToggle(a)}>
                <Trash2 size={14} /> Eliminar
              </button>
            ) : (
              <button className="btn btn-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setAdminToToggle(a)}>
                <RotateCcw size={14} /> Reactivar
              </button>
            )}
          </>
        )}
      />

      <AdminFormModal
        key={modalKey}
        open={isModalOpen}
        editingAdmin={editingAdmin}
        submitting={guardar.isPending}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (values) => { await guardar.mutateAsync(values).catch(() => {}); }}
      />

      <ConfirmDialog
        open={adminToToggle !== null}
        title={adminToToggle?.activo ? 'Eliminar Administrador' : 'Reactivar Administrador'}
        description={
          adminToToggle?.activo
            ? `¿Estás seguro de que deseas eliminar a "${adminToToggle?.nombre} ${adminToToggle?.apellido}"? Esta acción desactiva su cuenta de acceso.`
            : `¿Deseas reactivar la cuenta de "${adminToToggle?.nombre} ${adminToToggle?.apellido}"? Podrá volver a iniciar sesión.`
        }
        confirmLabel={adminToToggle?.activo ? 'Eliminar' : 'Reactivar'}
        confirming={toggleActivo.isPending}
        danger={adminToToggle?.activo ?? true}
        onConfirm={() => {
          if (adminToToggle) toggleActivo.mutate({ id: adminToToggle.id, activo: !adminToToggle.activo });
        }}
        onCancel={() => setAdminToToggle(null)}
      />
    </div>
  );
}
