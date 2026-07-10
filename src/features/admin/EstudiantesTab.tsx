import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Edit2, Plus, RotateCcw, Trash2, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/useToast';
import { useEstudiantes } from '../../hooks/useEstudiantes';
import { SearchInput } from '../../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ActivoFilter } from '../../components/ui/ActivoFilter';
import { activoFilterToBoolean, type ActivoFilterValue } from '../../components/ui/activoFilterValue';
import { EstudianteFormModal, type EstudianteFormValues } from './EstudianteFormModal';
import type { Estudiante } from '../../types';
import type { AdminOutletContext } from './AdminLayout';
import dataTableStyles from '../../components/ui/DataTable.module.css';

export function EstudiantesTab() {
  const { refetchEstudiantes: refetchEstudianteCount, grupos, refetchGrupos } = useOutletContext<AdminOutletContext>();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<ActivoFilterValue>('all');
  const { estudiantes, refetch: refetchEstudiantes } = useEstudiantes(undefined, activoFilterToBoolean(activoFilter));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEstudiante, setEditingEstudiante] = useState<Estudiante | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [estudianteToToggle, setEstudianteToToggle] = useState<Estudiante | null>(null);

  const filtered = estudiantes.filter(
    (e) =>
      `${e.nombre} ${e.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      (e.nombreGrupo && e.nombreGrupo.toLowerCase().includes(search.toLowerCase()))
  );

  const openModal = (estudiante?: Estudiante) => {
    setEditingEstudiante(estudiante ?? null);
    setModalKey((k) => k + 1);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: EstudianteFormValues) => {
    try {
      const { grupoId, ...personData } = values;

      let estudianteId: string;
      if (editingEstudiante) {
        const updated = await api.editarEstudiante(editingEstudiante.id, personData);
        estudianteId = updated.id;
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

      showToast(editingEstudiante ? 'Estudiante actualizado correctamente' : 'Estudiante creado correctamente');
      setIsModalOpen(false);
      refetchEstudiantes();
      refetchEstudianteCount();
      refetchGrupos();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar el estudiante', 'error');
    }
  };

  const handleToggleActivo = async () => {
    if (!estudianteToToggle) return;
    const nuevoEstado = !estudianteToToggle.activo;
    try {
      await api.cambiarEstadoUsuario(estudianteToToggle.id, nuevoEstado);
      showToast(nuevoEstado ? 'Estudiante reactivado correctamente' : 'Estudiante eliminado correctamente');
      refetchEstudiantes();
      refetchEstudianteCount();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cambiar el estado del estudiante', 'error');
    } finally {
      setEstudianteToToggle(null);
    }
  };

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
      render: (e) => (e.activo ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>),
    },
    {
      header: 'Grupo Asignado',
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
        actions={(e) => (
          <>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openModal(e)}>
              <Edit2 size={14} /> Asignar / Editar
            </button>
            {e.activo ? (
              <button className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setEstudianteToToggle(e)}>
                <Trash2 size={14} /> Eliminar
              </button>
            ) : (
              <button className="btn btn-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setEstudianteToToggle(e)}>
                <RotateCcw size={14} /> Reactivar
              </button>
            )}
          </>
        )}
      />

      <EstudianteFormModal
        key={modalKey}
        open={isModalOpen}
        editingEstudiante={editingEstudiante}
        grupos={grupos}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={estudianteToToggle !== null}
        title={estudianteToToggle?.activo ? 'Eliminar Estudiante' : 'Reactivar Estudiante'}
        description={
          estudianteToToggle?.activo
            ? `¿Estás seguro de que deseas eliminar a "${estudianteToToggle?.nombre} ${estudianteToToggle?.apellido}"? Esta acción desactiva su cuenta de acceso.`
            : `¿Deseas reactivar la cuenta de "${estudianteToToggle?.nombre} ${estudianteToToggle?.apellido}"? Podrá volver a iniciar sesión.`
        }
        confirmLabel={estudianteToToggle?.activo ? 'Eliminar' : 'Reactivar'}
        danger={estudianteToToggle?.activo ?? true}
        onConfirm={handleToggleActivo}
        onCancel={() => setEstudianteToToggle(null)}
      />
    </div>
  );
}
