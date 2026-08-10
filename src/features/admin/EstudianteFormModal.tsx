import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { RoleSelector } from '../../components/ui/RoleSelector';
import { CustomSelect } from '../../components/ui/CustomSelect';
import modalStyles from '../../components/ui/Modal.module.css';
import type { Estudiante, Grupo, Rol } from '../../types';

export interface EstudianteFormValues {
  nombre: string;
  apellido: string;
  telefono: string;
  fechaDeNacimiento: string;
  correo: string;
  grupoId: string;
  roles: Rol[];
}

const emptyForm: EstudianteFormValues = {
  nombre: '',
  apellido: '',
  telefono: '',
  fechaDeNacimiento: '',
  correo: '',
  grupoId: '',
  roles: ['ESTUDIANTE'],
};

function initialForm(editingEstudiante: Estudiante | null, initialRoles: Rol[]): EstudianteFormValues {
  if (!editingEstudiante) return emptyForm;
  return {
    nombre: editingEstudiante.nombre,
    apellido: editingEstudiante.apellido,
    telefono: editingEstudiante.telefono || '',
    fechaDeNacimiento: editingEstudiante.fechaDeNacimiento || '',
    correo: editingEstudiante.correo || '',
    grupoId: editingEstudiante.grupoId || '',
    roles: initialRoles,
  };
}

interface EstudianteFormModalProps {
  open: boolean;
  editingEstudiante: Estudiante | null;
  grupos: Grupo[];
  initialRoles: Rol[];
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: EstudianteFormValues) => Promise<void>;
}

export function EstudianteFormModal({ open, editingEstudiante, grupos, initialRoles, submitting = false, onClose, onSubmit }: EstudianteFormModalProps) {
  const [form, setForm] = useState<EstudianteFormValues>(() => initialForm(editingEstudiante, initialRoles));

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
          <label htmlFor="stdAdmBirth">Fecha de Nacimiento</label>
          <input id="stdAdmBirth" type="date" value={form.fechaDeNacimiento} onChange={(e) => setForm({ ...form, fechaDeNacimiento: e.target.value })} />
        </div>

        <div>
          <label>Asignar a Grupo</label>
          <CustomSelect
            value={form.grupoId}
            placeholder="-- Sin Grupo (Disponible) --"
            options={grupos.map((g) => ({ value: g.id, label: g.nombre }))}
            onChange={(grupoId) => setForm({ ...form, grupoId })}
          />
        </div>

        <div>
          <label htmlFor="stdAdmEmail">Correo Electrónico</label>
          <input id="stdAdmEmail" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
        </div>

        {editingEstudiante && (
          <RoleSelector value={form.roles} onChange={(roles) => setForm({ ...form, roles })} />
        )}

        <div className={modalStyles.footer}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar Estudiante'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
