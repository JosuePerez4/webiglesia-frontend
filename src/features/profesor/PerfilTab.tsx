import { useState } from 'react';
import { BookOpen, Calendar, KeyRound, Mail, Phone, User } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { usePerfilProfesor } from '../../hooks/usePerfilProfesor';
import styles from './PerfilTab.module.css';

const FIELDS: { key: 'correo' | 'telefono' | 'fechaDeNacimiento' | 'username'; label: string; icon: typeof User }[] = [
  { key: 'username', label: 'Usuario', icon: User },
  { key: 'correo', label: 'Correo Electrónico', icon: Mail },
  { key: 'telefono', label: 'Teléfono', icon: Phone },
  { key: 'fechaDeNacimiento', label: 'Fecha de Nacimiento', icon: Calendar },
];

export function PerfilTab() {
  const { profesor, loading, error } = usePerfilProfesor();

  if (loading) {
    return <p className={styles.status}>Cargando perfil...</p>;
  }

  if (error || !profesor) {
    return <p className={styles.status}>{error || 'No se pudo cargar tu perfil.'}</p>;
  }

  return (
    <div className="animate-fade-in">
      <h1 className={styles.title}>Mi Perfil</h1>
      <p className={styles.subtitle}>Tus datos como profesor en el sistema</p>

      <div className={`glass ${styles.card}`}>
        <div className={styles.avatarBlock}>
          <span className={styles.avatarIcon}>
            <BookOpen size={22} />
          </span>
          <div>
            <div className={styles.name}>{profesor.nombre} {profesor.apellido}</div>
            <div className={styles.role}>Profesor</div>
          </div>
        </div>

        <div className={styles.fieldGrid}>
          {FIELDS.map(({ key, label, icon: Icon }) => (
            <div className={styles.field} key={key}>
              <span className={styles.fieldIcon}>
                <Icon size={16} />
              </span>
              <div>
                <div className={styles.fieldLabel}>{label}</div>
                <div className={styles.fieldValue}>{profesor[key] || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ChangePasswordForm />
    </div>
  );
}

function ChangePasswordForm() {
  const { usuario } = useAuth();
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await api.cambiarContrasena(usuario!.id, { contrasenaActual, contrasenaNueva });
      setSuccess('Contraseña actualizada correctamente.');
      setContrasenaActual('');
      setContrasenaNueva('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`glass ${styles.passwordCard}`} aria-labelledby="change-password-title">
      <div className={styles.passwordHeader}>
        <span className={styles.fieldIcon}><KeyRound size={16} /></span>
        <div>
          <h2 id="change-password-title" className={styles.passwordTitle}>Cambiar contraseña</h2>
          <p className={styles.passwordSubtitle}>Actualiza tu contraseña de acceso.</p>
        </div>
      </div>

      {error && <div className={styles.formError} role="alert">{error}</div>}
      {success && <div className={styles.formSuccess} role="status">{success}</div>}

      <form onSubmit={handleSubmit} className={styles.passwordForm}>
        <div>
          <label htmlFor="current-password">Contraseña actual</label>
          <input
            id="current-password"
            type="password"
            value={contrasenaActual}
            onChange={(event) => setContrasenaActual(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label htmlFor="new-account-password">Nueva contraseña</label>
          <input
            id="new-account-password"
            type="password"
            value={contrasenaNueva}
            onChange={(event) => setContrasenaNueva(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !usuario}>
          {loading ? 'Actualizando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </section>
  );
}
