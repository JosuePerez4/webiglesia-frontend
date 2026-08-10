import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus, Users, UserMinus, UserCheck, PowerOff } from 'lucide-react';
import { api, AuthError } from '../../services/api';
import { qkRoot } from '../../services/queryKeys';
import { useToast } from '../../components/ui/useToast';
import { useAuth } from '../../context/useAuth';
import { useEstudiantes } from '../../hooks/useEstudiantes';
import { useGrupos } from '../../hooks/useGrupos';
import { SearchInput } from '../../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ActivoFilter } from '../../components/ui/ActivoFilter';
import { activoFilterToBoolean, type ActivoFilterValue } from '../../components/ui/activoFilterValue';
import { ActionsDropdown, type ActionsDropdownItem } from '../../components/ui/ActionsDropdown';
import { EstudianteFormModal, type EstudianteFormValues } from './EstudianteFormModal';
import type { Estudiante, Rol } from '../../types';
import dataTableStyles from '../../components/ui/DataTable.module.css';
import styles from './EstudiantesTab.module.css';

export function EstudiantesTab() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { logout } = useAuth();

  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<ActivoFilterValue>('all');
  const { estudiantes } = useEstudiantes(undefined, activoFilterToBoolean(activoFilter));
  const { grupos } = useGrupos();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEstudiante, setEditingEstudiante] = useState<Estudiante | null>(null);
  const [editingRoles, setEditingRoles] = useState<Rol[]>(['ESTUDIANTE']);
  const [modalKey, setModalKey] = useState(0);
  const [estudianteToConfirm, setEstudianteToConfirm] = useState<Estudiante | null>(null);
  const [confirmAction, setConfirmAction] = useState<'quitarRol' | 'asignarRol' | 'desactivar' | null>(null);

  const filtered = estudiantes.filter(
    (e) =>
      `${e.nombre} ${e.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      (e.nombreGrupo && e.nombreGrupo.toLowerCase().includes(search.toLowerCase()))
  );

  const openModal = async (estudiante?: Estudiante) => {
    setEditingEstudiante(estudiante ?? null);
    if (estudiante) {
      try {
        const usuario = await api.getUsuarioRoles(estudiante.id);
        setEditingRoles(usuario.roles);
      } catch (err) {
        if (err instanceof AuthError) { logout(); return; }
        setEditingRoles(['ESTUDIANTE']);
      }
    } else {
      setEditingRoles(['ESTUDIANTE']);
    }
    setModalKey((k) => k + 1);
    setIsModalOpen(true);
  };

  const guardar = useMutation({
    mutationFn: async (values: EstudianteFormValues) => {
      const { grupoId, roles, ...personData } = values;

      let estudianteId: string;
      if (editingEstudiante) {
        const updated = await api.editarEstudiante(editingEstudiante.id, personData);
        estudianteId = updated.id;
        await api.asignarRoles(editingEstudiante.id, roles);
      } else {
        const created = await api.crearEstudiante(personData);
        estudianteId = created.id;
      }

      const previousGrupoId = editingEstudiante?.grupoId || '';
      if (grupoId && grupoId !== previousGrupoId) {
        const grp = grupos.find((g) => g.id === grupoId);
        if (grp) {
          const currentIds = grp.estudianteIds || [];
          if (!currentIds.includes(estudianteId)) {
            await api.editarGrupo(grp.id, {
              nombre: grp.nombre,
              profesorIds: grp.profesorIds || [],
              estudianteIds: [...currentIds, estudianteId],
            });
          }
        }
      }
    },
    onSuccess: async () => {
      const wasEditing = Boolean(editingEstudiante);
      setIsModalOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qkRoot.estudiantes }),
        queryClient.invalidateQueries({ queryKey: qkRoot.grupos }),
      ]);
      showToast(wasEditing ? 'Estudiante actualizado correctamente' : 'Estudiante creado correctamente');
    },
    onError: (err) => {
      if (err instanceof AuthError) { logout(); return; }
      showToast(err instanceof Error ? err.message : 'Error al guardar el estudiante', 'error');
    },
  });

  const toggleRol = useMutation({
    mutationFn: async ({ id, quitar }: { id: string; quitar: boolean }) => {
      const usuario = await api.getUsuarioRoles(id);
      const nuevosRoles = quitar
        ? usuario.roles.filter((r) => r !== 'ESTUDIANTE')
        : [...new Set([...usuario.roles, 'ESTUDIANTE' as Rol])];
      await api.asignarRoles(id, nuevosRoles);
    },
    onSuccess: async (_data, { quitar }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qkRoot.estudiantes }),
        queryClient.invalidateQueries({ queryKey: qkRoot.grupos }),
      ]);
      showToast(quitar ? 'Rol de Estudiante removido correctamente' : 'Rol de Estudiante asignado correctamente');
    },
    onError: (err) => {
      if (err instanceof AuthError) { logout(); return; }
      showToast(err instanceof Error ? err.message : 'Error al cambiar el rol del estudiante', 'error');
    },
    onSettled: () => { setEstudianteToConfirm(null); setConfirmAction(null); },
  });

  const desactivarUsuario = useMutation({
    mutationFn: (id: string) => api.cambiarEstadoUsuario(id, false),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qkRoot.estudiantes }),
        queryClient.invalidateQueries({ queryKey: qkRoot.grupos }),
      ]);
      showToast('Estudiante desactivado correctamente');
    },
    onError: (err) => {
      if (err instanceof AuthError) { logout(); return; }
      showToast(err instanceof Error ? err.message : 'Error al desactivar el estudiante', 'error');
    },
    onSettled: () => { setEstudianteToConfirm(null); setConfirmAction(null); },
  });

  const columns: DataTableColumn<Estudiante>[] = [
    {
      header: 'Nombre Completo',
      primary: true,
      render: (e) => (
        <div className={dataTableStyles.rowMain}>
          <Avatar name={`${e.nombre} ${e.apellido}`} />
          <strong>
            {e.nombre} {e.apellido}
          </strong>
        </div>
      ),
    },
    {
      header: 'Estado',
      badge: true,
      render: (e) => (e.activo ? <Badge tone="success">Activo</Badge> : <Badge tone="red">Inactivo</Badge>),
    },
    {
      header: 'Grupo Asignado',
      subtitle: true,
      render: (e) =>
        e.nombreGrupo ? (
          <Badge tone="purple">{e.nombreGrupo}</Badge>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Sin Grupo</span>
        ),
    },
    { header: 'Teléfono', render: (e) => e.telefono || '—' },
    { header: 'Correo Electrónico', render: (e) => e.correo || '—' },
  ];

  return (
    <div className="animate-fade-in">
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar estudiantes..." />
          <ActivoFilter value={activoFilter} onChange={setActivoFilter} />
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Crear Estudiante
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(e) => e.id}
        emptyIcon={<Users size={40} />}
        emptyTitle="No se encontraron estudiantes"
        actions={(e) => {
          const items: ActionsDropdownItem[] = [
            { label: 'Quitar rol Estudiante', icon: <UserMinus size={14} />, danger: true, onClick: () => { setEstudianteToConfirm(e); setConfirmAction('quitarRol'); } },
            { label: 'Asignar rol Estudiante', icon: <UserCheck size={14} />, onClick: () => { setEstudianteToConfirm(e); setConfirmAction('asignarRol'); } },
            { label: 'Desactivar usuario', icon: <PowerOff size={14} />, danger: true, onClick: () => { setEstudianteToConfirm(e); setConfirmAction('desactivar'); } },
          ];
          return (
            <>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openModal(e)}>
                <Edit2 size={14} /> Asignar / Editar
              </button>
              <ActionsDropdown items={items} />
            </>
          );
        }}
      />

      <EstudianteFormModal
        key={modalKey}
        open={isModalOpen}
        editingEstudiante={editingEstudiante}
        grupos={grupos}
        initialRoles={editingRoles}
        submitting={guardar.isPending}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (values) => { await guardar.mutateAsync(values).catch(() => {}); }}
      />

      <ConfirmDialog
        open={estudianteToConfirm !== null && confirmAction !== null}
        title={
          confirmAction === 'quitarRol' ? 'Quitar rol de Estudiante'
          : confirmAction === 'asignarRol' ? 'Asignar rol de Estudiante'
          : 'Desactivar usuario'
        }
        description={
          confirmAction === 'quitarRol'
            ? `"${estudianteToConfirm?.nombre} ${estudianteToConfirm?.apellido}" dejará de tener acceso como Estudiante. Podrá seguir accediendo con sus otros roles.`
            : confirmAction === 'asignarRol'
            ? `Se restaurará el rol de Estudiante para "${estudianteToConfirm?.nombre} ${estudianteToConfirm?.apellido}".`
            : `"${estudianteToConfirm?.nombre} ${estudianteToConfirm?.apellido}" será desactivado y no podrá iniciar sesión hasta que sea reactivado.`
        }
        confirmLabel={
          confirmAction === 'quitarRol' ? 'Quitar rol'
          : confirmAction === 'asignarRol' ? 'Asignar rol'
          : 'Desactivar'
        }
        confirming={toggleRol.isPending || desactivarUsuario.isPending}
        danger
        onConfirm={() => {
          if (!estudianteToConfirm || !confirmAction) return;
          if (confirmAction === 'quitarRol') {
            toggleRol.mutate({ id: estudianteToConfirm.id, quitar: true });
          } else if (confirmAction === 'asignarRol') {
            toggleRol.mutate({ id: estudianteToConfirm.id, quitar: false });
          } else {
            desactivarUsuario.mutate(estudianteToConfirm.id);
          }
        }}
        onCancel={() => { setEstudianteToConfirm(null); setConfirmAction(null); }}
      />
    </div>
  );
}
