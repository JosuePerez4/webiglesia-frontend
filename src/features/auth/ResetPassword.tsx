import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import styles from './PasswordRecovery.module.css';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setError(null);
    setSuccess(null);
    if (nuevaContrasena !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.restablecerContrasena(token, nuevaContrasena);
      setSuccess(response.message || 'Contraseña actualizada correctamente');
      setNuevaContrasena('');
      setConfirmacion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass animate-fade-in ${styles.card}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Restablecer contraseña</h1>
          <p className={styles.subtitle}>Crea una nueva contraseña para tu cuenta.</p>
        </header>

        {!token && <div className={styles.error} role="alert">El enlace de recuperación no es válido.</div>}
        {error && <div className={styles.error} role="alert">{error}</div>}
        {success && <div className={styles.success} role="status">{success}</div>}

        {token && !success && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <label htmlFor="new-password">Nueva contraseña</label>
              <input
                id="new-password"
                type="password"
                value={nuevaContrasena}
                onChange={(event) => setNuevaContrasena(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-password">Confirmar nueva contraseña</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmacion}
                onChange={(event) => setConfirmacion(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <button type="submit" className={`btn btn-primary ${styles.fullWidth}`} disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}

        <div className={styles.actions}>
          <Link to="/login" className={`btn btn-secondary ${styles.fullWidth}`}>Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
}
