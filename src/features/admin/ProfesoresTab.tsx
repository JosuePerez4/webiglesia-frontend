import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Edit2, GraduationCap, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
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
import type { AdminOutletContext } from './AdminLayout';
import dataTableStyles from '../../components/ui/DataTable.module.css';

export function ProfesoresTab() {
  const { refetchProfesores: refetchProfesorCount } = useOutletContext<AdminOutletContext>();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<ActivoFilterValue>('all');
  const { profesores, refetch: refetchProfesores } = useProfesores(activoFilterToBoolean(activoFilter));

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

  const handleSubmit = async (values: ProfesorFormValues) => {
    try {
      if (editingProfesor) {
        await api.editarProfesor(editingProfesor.id, values);
        showToast('Profesor actualizado correctamente');
      } else {
        await api.crearProfesor(values);
        showToast('Profesor creado correctamente');
      }
      setIsModalOpen(false);
      refetchProfesores();
      refetchProfesorCount();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar el profesor', 'error');
    }
  };

  const handleToggleActivo = async () => {
    if (!profesorToToggle) return;
    const nuevoEstado = !profesorToToggle.activo;
    try {
      await api.cambiarEstadoUsuario(profesorToToggle.id, nuevoEstado);
      showToast(nuevoEstado ? 'Profesor reactivado correctamente' : 'Profesor eliminado correctamente');
      refetchProfesores();
      refetchProfesorCount();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cambiar el estado del profesor', 'error');
    } finally {
      setProfesorToToggle(null);
    }
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
        onSubmit={handleSubmit}
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
        onConfirm={handleToggleActivo}
        onCancel={() => setProfesorToToggle(null)}
      />
    </div>
  );
}
