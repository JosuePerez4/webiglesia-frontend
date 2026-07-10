import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import modalStyles from '../../components/ui/Modal.module.css';
import type { Estudiante, Grupo } from '../../types';

export interface EstudianteFormValues {
  nombre: string;
  apellido: string;
  telefono: string;
  fechaDeNacimiento: string;
  correo: string;
  grupoId: string;
}

const emptyForm: EstudianteFormValues = {
  nombre: '',
  apellido: '',
  telefono: '',
  fechaDeNacimiento: '',
  correo: '',
  grupoId: '',
};

function initialForm(editingEstudiante: Estudiante | null): EstudianteFormValues {
  if (!editingEstudiante) return emptyForm;
  return {
    nombre: editingEstudiante.nombre,
    apellido: editingEstudiante.apellido,
    telefono: editingEstudiante.telefono || '',
    fechaDeNacimiento: editingEstudiante.fechaDeNacimiento || '',
    correo: editingEstudiante.correo || '',
    grupoId: editingEstudiante.grupoId || '',
  };
}

interface EstudianteFormModalProps {
  open: boolean;
  editingEstudiante: Estudiante | null;
  grupos: Grupo[];
  onClose: () => void;
  onSubmit: (values: EstudianteFormValues) => Promise<void>;
}

/** Render with a `key` that changes on every open so the form state resets fresh instead of syncing via effect. */
export function EstudianteFormModal({ open, editingEstudiante, grupos, onClose, onSubmit }: EstudianteFormModalProps) {
  const [form, setForm] = useState<EstudianteFormValues>(() => initialForm(editingEstudiante));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    await onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={editingEstudiante ? 'Asignar / Editar Estudiante' : 'Nuevo Estudiante'}
    >
      <form onSubmit={handleSubmit} className={modalStyles.form}>
        <div className={modalStyles.formGrid2}>
          <div>
            <label htmlFor="stdAdmName">Nombre</label>
            <input id="stdAdmName" type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <label htmlFor="stdAdmSurname">Apellido</label>
            <input id="stdAdmSurname" type="text" required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
          </div>
        </div>

        <div>
          <label htmlFor="stdAdmPhone">Teléfono</label>
          <input id="stdAdmPhone" type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        </div>

        <div>
          <label htmlFor="stdAdmGroup">Asignar a Grupo</label>
          <select id="stdAdmGroup" value={form.grupoId} onChange={(e) => setForm({ ...form, grupoId: e.target.value })}>
            <option value="">-- Sin Grupo (Disponible) --</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="stdAdmEmail">Correo Electrónico</label>
          <input id="stdAdmEmail" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
        </div>

        <div className={modalStyles.footer}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar Estudiante
          </button>
        </div>
      </form>
    </Modal>
  );
}
