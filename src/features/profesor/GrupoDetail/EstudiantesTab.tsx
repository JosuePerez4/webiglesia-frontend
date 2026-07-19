import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus, Users } from 'lucide-react';
import { api } from '../../../services/api';
import { qkRoot } from '../../../services/queryKeys';
import { useToast } from '../../../components/ui/useToast';
import { SearchInput } from '../../../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable';
import { Avatar } from '../../../components/ui/Avatar';
import { Modal } from '../../../components/ui/Modal';
import type { Estudiante, Grupo } from '../../../types';
import dataTableStyles from '../../../components/ui/DataTable.module.css';
import modalStyles from '../../../components/ui/Modal.module.css';

interface EstudiantesTabProps {
  grupo: Grupo;
}

const emptyForm = { nombre: '', apellido: '', telefono: '', fechaDeNacimiento: '', correo: '' };

function initialForm(editingStudent: Estudiante | null) {
  if (!editingStudent) return emptyForm;
  return {
    nombre: editingStudent.nombre,
    apellido: editingStudent.apellido,
    telefono: editingStudent.telefono || '',
    fechaDeNacimiento: editingStudent.fechaDeNacimiento || '',
    correo: editingStudent.correo || '',
  };
}

export function EstudiantesTab({ grupo }: EstudiantesTabProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Estudiante | null>(null);
  const [form, setForm] = useState(() => initialForm(editingStudent));

  const openModal = (student?: Estudiante) => {
    setEditingStudent(student ?? null);
    setForm(initialForm(student ?? null));
    setIsModalOpen(true);
  };

  const filteredStudents =
    grupo.estudiantes?.filter((e) => `${e.nombre} ${e.apellido}`.toLowerCase().includes(search.toLowerCase())) || [];

  const guardar = useMutation({
    mutationFn: async () => {
      if (editingStudent) {
        await api.editarEstudiante(editingStudent.id, form);
        return;
      }
      const created = await api.crearEstudiante(form);
      await api.editarGrupo(grupo.id, {
        nombre: grupo.nombre,
        profesorIds: grupo.profesorIds || [],
        estudianteIds: [...(grupo.estudianteIds || []), created.id],
      });
    },
    onSuccess: async () => {
      const wasEditing = Boolean(editingStudent);
      setIsModalOpen(false);
      // Invalidar ['grupos'] alcanza también el detalle de este grupo.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qkRoot.grupos }),
        queryClient.invalidateQueries({ queryKey: qkRoot.estudiantes }),
      ]);
      showToast(wasEditing ? 'Estudiante actualizado correctamente' : 'Estudiante agregado correctamente');
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Error al guardar el estudiante', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    guardar.mutate();
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
    { header: 'Teléfono', render: (e) => e.telefono || '—' },
    { header: 'Correo Electrónico', render: (e) => e.correo || '—' },
    { header: 'Fecha Nacimiento', render: (e) => e.fechaDeNacimiento || '—' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar estudiante..." />
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          <span>Nuevo Estudiante</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={filteredStudents}
        rowKey={(e) => e.id}
        emptyIcon={<Users size={40} />}
        emptyTitle="No se encontraron estudiantes"
        actions={(e) => (
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openModal(e)}>
            <Edit2 size={12} />
            <span>Editar</span>
          </button>
        )}
      />

      <Modal open={isModalOpen} onOpenChange={(o) => !o && setIsModalOpen(false)} title={editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}>
        <form onSubmit={handleSubmit} className={modalStyles.form}>
          <div className={modalStyles.formGrid2}>
            <div>
              <label htmlFor="stdName">Nombre</label>
              <input id="stdName" type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <label htmlFor="stdSurname">Apellido</label>
              <input id="stdSurname" type="text" required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
            </div>
          </div>

          <div>
            <label htmlFor="stdPhone">Teléfono</label>
            <input id="stdPhone" type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>

          <div>
            <label htmlFor="stdBirth">Fecha de Nacimiento</label>
            <input id="stdBirth" type="date" value={form.fechaDeNacimiento} onChange={(e) => setForm({ ...form, fechaDeNacimiento: e.target.value })} />
          </div>

          <div>
            <label htmlFor="stdEmail">Correo Electrónico</label>
            <input id="stdEmail" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
          </div>

          <div className={modalStyles.footer}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingStudent ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
