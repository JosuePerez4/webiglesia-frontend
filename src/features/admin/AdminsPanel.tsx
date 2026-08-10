import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Shield, UserPlus, UserMinus, UserCheck, PowerOff } from 'lucide-react';
import { api, AuthError } from '../../services/api';
import { qkRoot } from '../../services/queryKeys';
import { useToast } from '../../components/ui/useToast';
import { useAuth } from '../../context/useAuth';
import { useAdministradores } from '../../hooks/useAdministradores';
import { SearchInput } from '../../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ActivoFilter } from '../../components/ui/ActivoFilter';
import { type ActivoFilterValue } from '../../components/ui/activoFilterValue';
import { ActionsDropdown, type ActionsDropdownItem } from '../../components/ui/ActionsDropdown';
import { AdminFormModal, type AdminFormValues } from './AdminFormModal';
import type { Administrador, Rol } from '../../types';
import dataTableStyles from '../../components/ui/DataTable.module.css';
import styles from './ProfesoresTab.module.css';

export function AdminsPanel() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { usuario, logout } = useAuth();
  const isAdmin = usuario?.rolActivo === 'ADMIN';

  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<ActivoFilterValue>('all');
  const { administradores } = useAdministradores();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Administrador | null>(null);
  const [editingRoles, setEditingRoles] = useState<Rol[]>(['ADMIN']);
  const [modalKey, setModalKey] = useState(0);
  const [adminToConfirm, setAdminToConfirm] = useState<Administrador | null>(null);
  const [confirmAction, setConfirmAction] = useState<'quitarRol' | 'asignarRol' | 'desactivar' | null>(null);

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

  const openModal = async (admin?: Administrador) => {
    setEditingAdmin(admin ?? null);
    if (admin) {
      try {
        const usuario = await api.getUsuarioRoles(admin.id);
        setEditingRoles(usuario.roles);
      } catch (err) {
        if (err instanceof AuthError) {
          logout();
          return;
        }
        setEditingRoles(['ADMIN']);
      }
    } else {
      setEditingRoles(['ADMIN']);
    }
    setModalKey((k) => k + 1);
    setIsModalOpen(true);
  };

  const guardar = useMutation({
    mutationFn: async (values: AdminFormValues): Promise<void> => {
      if (editingAdmin) {
        const data: { nombreusuario: string; contrasena?: string } = { nombreusuario: values.username };
        if (values.contrasena.trim()) {
          data.contrasena = values.contrasena;
        }
        await api.editarUsuario(editingAdmin.id, data);
        if (isAdmin) {
          await api.asignarRoles(editingAdmin.id, values.roles);
        }
      } else {
        await api.crearAdministrador(values);
      }
    },
    onSuccess: async () => {
      const wasEditing = Boolean(editingAdmin);
      setIsModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: qkRoot.administradores });
      showToast(wasEditing ? 'Administrador actualizado correctamente' : 'Administrador creado correctamente');
    },
    onError: (err) => {
      if (err instanceof AuthError) { logout(); return; }
      showToast(err instanceof Error ? err.message : 'Error al guardar el administrador', 'error');
    },
  });

  const toggleRol = useMutation({
    mutationFn: async ({ id, quitar }: { id: string; quitar: boolean }) => {
      const usuario = await api.getUsuarioRoles(id);
      const nuevosRoles = quitar
        ? usuario.roles.filter((r) => r !== 'ADMIN')
        : [...new Set([...usuario.roles, 'ADMIN' as Rol])];
      await api.asignarRoles(id, nuevosRoles);
    },
    onSuccess: async (_data, { quitar }) => {
      await queryClient.invalidateQueries({ queryKey: qkRoot.administradores });
      showToast(quitar ? 'Rol de Administrador removido correctamente' : 'Rol de Administrador asignado correctamente');
    },
    onError: (err) => {
      if (err instanceof AuthError) { logout(); return; }
      showToast(err instanceof Error ? err.message : 'Error al cambiar el rol del administrador', 'error');
    },
    onSettled: () => { setAdminToConfirm(null); setConfirmAction(null); },
  });

  const desactivarUsuario = useMutation({
    mutationFn: (id: string) => api.cambiarEstadoUsuario(id, false),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qkRoot.administradores });
      showToast('Administrador desactivado correctamente');
    },
    onError: (err) => {
      if (err instanceof AuthError) { logout(); return; }
      showToast(err instanceof Error ? err.message : 'Error al desactivar el administrador', 'error');
    },
    onSettled: () => { setAdminToConfirm(null); setConfirmAction(null); },
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
      badge: true,
      render: (a) => (a.activo ? <Badge tone="success">Activo</Badge> : <Badge tone="red">Inactivo</Badge>),
    },
    { header: 'Usuario', render: (a) => a.username },
    { header: 'Teléfono', render: (a) => a.telefono || '—' },
    { header: 'Correo Electrónico', render: (a) => a.correo || '—' },
  ];

  return (
    <div className="animate-fade-in">
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
        actions={(a) => {
          const items: ActionsDropdownItem[] = [
            { label: 'Quitar rol Admin', icon: <UserMinus size={14} />, danger: true, onClick: () => { setAdminToConfirm(a); setConfirmAction('quitarRol'); } },
            { label: 'Asignar rol Admin', icon: <UserCheck size={14} />, onClick: () => { setAdminToConfirm(a); setConfirmAction('asignarRol'); } },
            { label: 'Desactivar usuario', icon: <PowerOff size={14} />, danger: true, onClick: () => { setAdminToConfirm(a); setConfirmAction('desactivar'); } },
          ];
          return (
            <>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openModal(a)}>
                <Edit2 size={14} /> Editar
              </button>
              <ActionsDropdown items={items} />
            </>
          );
        }}
      />

      <AdminFormModal
        key={modalKey}
        open={isModalOpen}
        editingAdmin={editingAdmin}
        initialRoles={editingRoles}
        submitting={guardar.isPending}
        canEditRoles={isAdmin}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (values) => { await guardar.mutateAsync(values).catch(() => {}); }}
      />

      <ConfirmDialog
        open={adminToConfirm !== null && confirmAction !== null}
        title={
          confirmAction === 'quitarRol' ? 'Quitar rol de Administrador'
          : confirmAction === 'asignarRol' ? 'Asignar rol de Administrador'
          : 'Desactivar usuario'
        }
        description={
          confirmAction === 'quitarRol'
            ? `"${adminToConfirm?.nombre} ${adminToConfirm?.apellido}" dejará de tener acceso como Administrador. Podrá seguir accediendo con sus otros roles.`
            : confirmAction === 'asignarRol'
            ? `Se restaurará el rol de Administrador para "${adminToConfirm?.nombre} ${adminToConfirm?.apellido}".`
            : `"${adminToConfirm?.nombre} ${adminToConfirm?.apellido}" será desactivado y no podrá iniciar sesión hasta que sea reactivado.`
        }
        confirmLabel={
          confirmAction === 'quitarRol' ? 'Quitar rol'
          : confirmAction === 'asignarRol' ? 'Asignar rol'
          : 'Desactivar'
        }
        confirming={toggleRol.isPending || desactivarUsuario.isPending}
        danger
        onConfirm={() => {
          if (!adminToConfirm || !confirmAction) return;
          if (confirmAction === 'quitarRol') {
            toggleRol.mutate({ id: adminToConfirm.id, quitar: true });
          } else if (confirmAction === 'asignarRol') {
            toggleRol.mutate({ id: adminToConfirm.id, quitar: false });
          } else {
            desactivarUsuario.mutate(adminToConfirm.id);
          }
        }}
        onCancel={() => { setAdminToConfirm(null); setConfirmAction(null); }}
      />
    </div>
  );
}
