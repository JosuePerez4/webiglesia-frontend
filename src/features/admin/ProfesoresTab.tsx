import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, GraduationCap, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { qkRoot } from '../../services/queryKeys';
import { useToast } from '../../components/ui/useToast';
import { useProfesores } from '../../hooks/useProfesores';
import { SearchInput } from '../../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ActivoFilter } from '../../components/ui/ActivoFilter';
import { activoFilterToBoolean, type ActivoFilterValue } from '../../components/ui/activoFilterValue';
import { ProfesorFormModal, type ProfesorFormValues } from './ProfesorFormModal';
import type { Profesor } from '../../types';
import dataTableStyles from '../../components/ui/DataTable.module.css';
import styles from './ProfesoresTab.module.css';

export function ProfesoresTab() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<ActivoFilterValue>('all');
  const { profesores } = useProfesores(activoFilterToBoolean(activoFilter));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfesor, setEditingProfesor] = useState<Profesor | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [profesorToToggle, setProfesorToToggle] = useState<Profesor | null>(null);

  const filtered = profesores.filter(
    (p) =>
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      (p.correo && p.correo.toLowerCase().includes(search.toLowerCase()))
  );

  const openModal = (profesor?: Profesor) => {
    setEditingProfesor(profesor ?? null);
    setModalKey((k) => k + 1);
    setIsModalOpen(true);
  };

  const guardar = useMutation({
    mutationFn: (values: ProfesorFormValues) =>
      editingProfesor ? api.editarProfesor(editingProfesor.id, values) : api.crearProfesor(values),
    onSuccess: async () => {
      const wasEditing = Boolean(editingProfesor);
      setIsModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: qkRoot.profesores });
      showToast(wasEditing ? 'Profesor actualizado correctamente' : 'Profesor creado correctamente');
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Error al guardar el profesor', 'error'),
  });

  const toggleActivo = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => api.cambiarEstadoUsuario(id, activo),
    onSuccess: async (_data, { activo }) => {
      await queryClient.invalidateQueries({ queryKey: qkRoot.profesores });
      showToast(activo ? 'Profesor reactivado correctamente' : 'Profesor eliminado correctamente');
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Error al cambiar el estado del profesor', 'error'),
    onSettled: () => setProfesorToToggle(null),
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
      render: (p) => (p.activo ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>),
    },
    { header: 'Teléfono', render: (p) => p.telefono || '—' },
    { header: 'Correo Electrónico', render: (p) => p.correo || '—' },
    { header: 'Fecha Nacimiento', render: (p) => p.fechaDeNacimiento || '—' },
  ];

  return (
    <div>
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
        actions={(p) => (
          <>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openModal(p)}>
              <Edit2 size={14} /> Editar
            </button>
            {p.activo ? (
              <button className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setProfesorToToggle(p)}>
                <Trash2 size={14} /> Eliminar
              </button>
            ) : (
              <button className="btn btn-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setProfesorToToggle(p)}>
                <RotateCcw size={14} /> Reactivar
              </button>
            )}
          </>
        )}
      />

      <ProfesorFormModal
        key={modalKey}
        open={isModalOpen}
        editingProfesor={editingProfesor}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (values) => { await guardar.mutateAsync(values).catch(() => {}); }}
      />

      <ConfirmDialog
        open={profesorToToggle !== null}
        title={profesorToToggle?.activo ? 'Eliminar Profesor' : 'Reactivar Profesor'}
        description={
          profesorToToggle?.activo
            ? `¿Estás seguro de que deseas eliminar a "${profesorToToggle?.nombre} ${profesorToToggle?.apellido}"? Esta acción desactiva su cuenta de acceso.`
            : `¿Deseas reactivar la cuenta de "${profesorToToggle?.nombre} ${profesorToToggle?.apellido}"? Podrá volver a iniciar sesión.`
        }
        confirmLabel={profesorToToggle?.activo ? 'Eliminar' : 'Reactivar'}
        danger={profesorToToggle?.activo ?? true}
        onConfirm={() => {
          if (profesorToToggle) toggleActivo.mutate({ id: profesorToToggle.id, activo: !profesorToToggle.activo });
        }}
        onCancel={() => setProfesorToToggle(null)}
      />
    </div>
  );
}
