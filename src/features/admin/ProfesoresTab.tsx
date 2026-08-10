import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, GraduationCap, Plus, UserMinus, UserCheck, PowerOff } from 'lucide-react';
import { api, AuthError } from '../../services/api';
import { qkRoot } from '../../services/queryKeys';
import { useToast } from '../../components/ui/useToast';
import { useAuth } from '../../context/useAuth';
import { useProfesores } from '../../hooks/useProfesores';
import { SearchInput } from '../../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ActivoFilter } from '../../components/ui/ActivoFilter';
import { activoFilterToBoolean, type ActivoFilterValue } from '../../components/ui/activoFilterValue';
import { ActionsDropdown, type ActionsDropdownItem } from '../../components/ui/ActionsDropdown';
import { ProfesorFormModal, type ProfesorFormValues } from './ProfesorFormModal';
import type { Profesor, Rol } from '../../types';
import dataTableStyles from '../../components/ui/DataTable.module.css';
import styles from './ProfesoresTab.module.css';

export function ProfesoresTab() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { logout } = useAuth();

  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<ActivoFilterValue>('all');
  const { profesores } = useProfesores(activoFilterToBoolean(activoFilter));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfesor, setEditingProfesor] = useState<Profesor | null>(null);
  const [editingRoles, setEditingRoles] = useState<Rol[]>(['PROFESOR']);
  const [modalKey, setModalKey] = useState(0);
  const [profesorToConfirm, setProfesorToConfirm] = useState<Profesor | null>(null);
  const [confirmAction, setConfirmAction] = useState<'quitarRol' | 'asignarRol' | 'desactivar' | null>(null);

  const filtered = profesores.filter(
    (p) =>
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      (p.correo && p.correo.toLowerCase().includes(search.toLowerCase()))
  );

  const openModal = async (profesor?: Profesor) => {
    setEditingProfesor(profesor ?? null);
    if (profesor) {
      try {
        const usuario = await api.getUsuarioRoles(profesor.id);
        setEditingRoles(usuario.roles);
      } catch (err) {
        if (err instanceof AuthError) { logout(); return; }
        setEditingRoles(['PROFESOR']);
      }
    } else {
      setEditingRoles(['PROFESOR']);
    }
    setModalKey((k) => k + 1);
    setIsModalOpen(true);
  };

  const guardar = useMutation({
    mutationFn: async (values: ProfesorFormValues) => {
      if (editingProfesor) {
        await api.editarProfesor(editingProfesor.id, values);
        await api.asignarRoles(editingProfesor.id, values.roles);
      } else {
        await api.crearProfesor(values);
      }
    },
    onSuccess: async () => {
      const wasEditing = Boolean(editingProfesor);
      setIsModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: qkRoot.profesores });
      showToast(wasEditing ? 'Profesor actualizado correctamente' : 'Profesor creado correctamente');
    },
    onError: (err) => {
      if (err instanceof AuthError) { logout(); return; }
      showToast(err instanceof Error ? err.message : 'Error al guardar el profesor', 'error');
    },
  });

  const toggleRol = useMutation({
    mutationFn: async ({ id, quitar }: { id: string; quitar: boolean }) => {
      const usuario = await api.getUsuarioRoles(id);
      const nuevosRoles = quitar
        ? usuario.roles.filter((r) => r !== 'PROFESOR')
        : [...new Set([...usuario.roles, 'PROFESOR' as Rol])];
      await api.asignarRoles(id, nuevosRoles);
    },
    onSuccess: async (_data, { quitar }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qkRoot.profesores }),
        queryClient.invalidateQueries({ queryKey: qkRoot.grupos }),
      ]);
      showToast(quitar ? 'Rol de Profesor removido correctamente' : 'Rol de Profesor asignado correctamente');
    },
    onError: (err) => {
      if (err instanceof AuthError) { logout(); return; }
      showToast(err instanceof Error ? err.message : 'Error al cambiar el rol del profesor', 'error');
    },
    onSettled: () => { setProfesorToConfirm(null); setConfirmAction(null); },
  });

  const desactivarUsuario = useMutation({
    mutationFn: (id: string) => api.cambiarEstadoUsuario(id, false),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qkRoot.profesores }),
        queryClient.invalidateQueries({ queryKey: qkRoot.grupos }),
      ]);
      showToast('Profesor desactivado correctamente');
    },
    onError: (err) => {
      if (err instanceof AuthError) { logout(); return; }
      showToast(err instanceof Error ? err.message : 'Error al desactivar el profesor', 'error');
    },
    onSettled: () => { setProfesorToConfirm(null); setConfirmAction(null); },
  });

  const columns: DataTableColumn<Profesor>[] = [
    {
      header: 'Nombre Completo',
      primary: true,
      render: (p) => (
        <div className={dataTableStyles.rowMain}>
          <Avatar name={`${p.nombre} ${p.apellido}`} />
          <strong>
            {p.nombre} {p.apellido}
          </strong>
        </div>
      ),
    },
    {
      header: 'Estado',
      badge: true,
      render: (p) => (p.activo ? <Badge tone="success">Activo</Badge> : <Badge tone="red">Inactivo</Badge>),
    },
    { header: 'Teléfono', render: (p) => p.telefono || '—' },
    { header: 'Correo Electrónico', render: (p) => p.correo || '—' },
    { header: 'Fecha Nacimiento', render: (p) => p.fechaDeNacimiento || '—' },
  ];

  return (
    <div className="animate-fade-in">
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar profesores..." />
          <ActivoFilter value={activoFilter} onChange={setActivoFilter} />
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Crear Profesor
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(p) => p.id}
        emptyIcon={<GraduationCap size={40} />}
        emptyTitle="No se encontraron profesores"
        actions={(p) => {
          const items: ActionsDropdownItem[] = [
            { label: 'Quitar rol Profesor', icon: <UserMinus size={14} />, danger: true, onClick: () => { setProfesorToConfirm(p); setConfirmAction('quitarRol'); } },
            { label: 'Asignar rol Profesor', icon: <UserCheck size={14} />, onClick: () => { setProfesorToConfirm(p); setConfirmAction('asignarRol'); } },
            { label: 'Desactivar usuario', icon: <PowerOff size={14} />, danger: true, onClick: () => { setProfesorToConfirm(p); setConfirmAction('desactivar'); } },
          ];
          return (
            <>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openModal(p)}>
                <Edit2 size={14} /> Editar
              </button>
              <ActionsDropdown items={items} />
            </>
          );
        }}
      />

      <ProfesorFormModal
        key={modalKey}
        open={isModalOpen}
        editingProfesor={editingProfesor}
        initialRoles={editingRoles}
        submitting={guardar.isPending}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (values) => { await guardar.mutateAsync(values).catch(() => {}); }}
      />

      <ConfirmDialog
        open={profesorToConfirm !== null && confirmAction !== null}
        title={
          confirmAction === 'quitarRol' ? 'Quitar rol de Profesor'
          : confirmAction === 'asignarRol' ? 'Asignar rol de Profesor'
          : 'Desactivar usuario'
        }
        description={
          confirmAction === 'quitarRol'
            ? `"${profesorToConfirm?.nombre} ${profesorToConfirm?.apellido}" dejará de tener acceso como Profesor. Podrá seguir accediendo con sus otros roles.`
            : confirmAction === 'asignarRol'
            ? `Se restaurará el rol de Profesor para "${profesorToConfirm?.nombre} ${profesorToConfirm?.apellido}".`
            : `"${profesorToConfirm?.nombre} ${profesorToConfirm?.apellido}" será desactivado y no podrá iniciar sesión hasta que sea reactivado.`
        }
        confirmLabel={
          confirmAction === 'quitarRol' ? 'Quitar rol'
          : confirmAction === 'asignarRol' ? 'Asignar rol'
          : 'Desactivar'
        }
        confirming={toggleRol.isPending || desactivarUsuario.isPending}
        danger
        onConfirm={() => {
          if (!profesorToConfirm || !confirmAction) return;
          if (confirmAction === 'quitarRol') {
            toggleRol.mutate({ id: profesorToConfirm.id, quitar: true });
          } else if (confirmAction === 'asignarRol') {
            toggleRol.mutate({ id: profesorToConfirm.id, quitar: false });
          } else {
            desactivarUsuario.mutate(profesorToConfirm.id);
          }
        }}
        onCancel={() => { setProfesorToConfirm(null); setConfirmAction(null); }}
      />
    </div>
  );
}
