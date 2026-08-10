import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { RoleSelector } from '../../components/ui/RoleSelector';
import modalStyles from '../../components/ui/Modal.module.css';
import type { Administrador, Rol } from '../../types';

export interface AdminFormValues {
  nombre: string;
  apellido: string;
  telefono: string;
  fechaDeNacimiento: string;
  correo: string;
  username: string;
  contrasena: string;
  roles: Rol[];
}

const emptyForm: AdminFormValues = {
  nombre: '',
  apellido: '',
  telefono: '',
  fechaDeNacimiento: '',
  correo: '',
  username: '',
  contrasena: '',
  roles: ['ADMIN'],
};

function initialForm(editingAdmin: Administrador | null, initialRoles: Rol[]): AdminFormValues {
  if (!editingAdmin) return emptyForm;
  return {
    nombre: editingAdmin.nombre,
    apellido: editingAdmin.apellido,
    telefono: editingAdmin.telefono || '',
    fechaDeNacimiento: editingAdmin.fechaDeNacimiento || '',
    correo: editingAdmin.correo || '',
    username: editingAdmin.username,
    contrasena: '',
    roles: initialRoles,
  };
}

interface AdminFormModalProps {
  open: boolean;
  editingAdmin: Administrador | null;
  initialRoles: Rol[];
  submitting?: boolean;
  canEditRoles?: boolean;
  onClose: () => void;
  onSubmit: (values: AdminFormValues) => Promise<void>;
}

export function AdminFormModal({ open, editingAdmin, initialRoles, submitting = false, canEditRoles = true, onClose, onSubmit }: AdminFormModalProps) {
  const [form, setForm] = useState<AdminFormValues>(() => initialForm(editingAdmin, initialRoles));
  const isEditing = Boolean(editingAdmin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) return;
    if (!isEditing && (!form.contrasena.trim() || !form.nombre.trim() || !form.apellido.trim())) return;
    await onSubmit(form);
  };

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} title={isEditing ? 'Editar Administrador' : 'Nuevo Administrador'}>
      <form onSubmit={handleSubmit} className={modalStyles.form}>
        {isEditing ? (
          <div className={modalStyles.formGrid2}>
            <div>
              <label htmlFor="afName">Nombre</label>
              <input id="afName" type="text" value={form.nombre} disabled />
            </div>
            <div>
              <label htmlFor="afSurname">Apellido</label>
              <input id="afSurname" type="text" value={form.apellido} disabled />
            </div>
          </div>
        ) : (
          <>
            <div className={modalStyles.formGrid2}>
              <div>
                <label htmlFor="afName">Nombre</label>
                <input id="afName" type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <label htmlFor="afSurname">Apellido</label>
                <input id="afSurname" type="text" required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
              </div>
            </div>

            <div>
              <label htmlFor="afPhone">Teléfono</label>
              <input id="afPhone" type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>

            <div>
              <label htmlFor="afBirth">Fecha de Nacimiento</label>
              <input id="afBirth" type="date" value={form.fechaDeNacimiento} onChange={(e) => setForm({ ...form, fechaDeNacimiento: e.target.value })} />
            </div>

            <div>
              <label htmlFor="afEmail">Correo Electrónico</label>
              <input id="afEmail" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
            </div>
          </>
        )}

        <div>
          <label htmlFor="afUsername">Usuario</label>
          <input id="afUsername" type="text" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>

        <div>
          <label htmlFor="afPassword">Contraseña</label>
          <input
            id="afPassword"
            type="password"
            required={!isEditing}
            value={form.contrasena}
            onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
            placeholder={isEditing ? 'Dejar vacío para conservar la actual' : undefined}
          />
        </div>

        {isEditing && canEditRoles && (
          <RoleSelector value={form.roles} onChange={(roles) => setForm({ ...form, roles })} />
        )}

        <div className={modalStyles.footer}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar Administrador'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
