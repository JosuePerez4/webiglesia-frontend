import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import modalStyles from '../../components/ui/Modal.module.css';
import type { Profesor } from '../../types';

export interface ProfesorFormValues {
  nombre: string;
  apellido: string;
  telefono: string;
  fechaDeNacimiento: string;
  correo: string;
}

const emptyForm: ProfesorFormValues = {
  nombre: '',
  apellido: '',
  telefono: '',
  fechaDeNacimiento: '',
  correo: '',
};

function initialForm(editingProfesor: Profesor | null): ProfesorFormValues {
  if (!editingProfesor) return emptyForm;
  return {
    nombre: editingProfesor.nombre,
    apellido: editingProfesor.apellido,
    telefono: editingProfesor.telefono || '',
    fechaDeNacimiento: editingProfesor.fechaDeNacimiento || '',
    correo: editingProfesor.correo || '',
  };
}

interface ProfesorFormModalProps {
  open: boolean;
  editingProfesor: Profesor | null;
  onClose: () => void;
  onSubmit: (values: ProfesorFormValues) => Promise<void>;
}

/** Render with a `key` that changes on every open so the form state resets fresh instead of syncing via effect. */
export function ProfesorFormModal({ open, editingProfesor, onClose, onSubmit }: ProfesorFormModalProps) {
  const [form, setForm] = useState<ProfesorFormValues>(() => initialForm(editingProfesor));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    await onSubmit(form);
  };

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} title={editingProfesor ? 'Editar Profesor' : 'Nuevo Profesor'}>
      <form onSubmit={handleSubmit} className={modalStyles.form}>
        <div className={modalStyles.formGrid2}>
          <div>
            <label htmlFor="pfName">Nombre</label>
            <input id="pfName" type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pfSurname">Apellido</label>
            <input id="pfSurname" type="text" required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
          </div>
        </div>

        <div>
          <label htmlFor="pfPhone">Teléfono</label>
          <input id="pfPhone" type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        </div>

        <div>
          <label htmlFor="pfBirth">Fecha de Nacimiento</label>
          <input id="pfBirth" type="date" value={form.fechaDeNacimiento} onChange={(e) => setForm({ ...form, fechaDeNacimiento: e.target.value })} />
        </div>

        <div>
          <label htmlFor="pfEmail">Correo Electrónico</label>
          <input id="pfEmail" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
        </div>

        <div className={modalStyles.footer}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar Profesor
          </button>
        </div>
      </form>
    </Modal>
  );
}
