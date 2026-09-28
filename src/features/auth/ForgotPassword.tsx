import { useState } from 'react';
import { api } from '../../services/api';
import styles from './PasswordRecovery.module.css';

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [correo, setCorreo] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await api.solicitarRestablecimiento(correo.trim());
      setMessage(response.message || 'Si el correo está registrado, recibirás un enlace de recuperación');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Recuperar contraseña</h1>
        <p className={styles.subtitle}>Te enviaremos un enlace si el correo está registrado.</p>
      </header>

      {error && <div className={styles.error} role="alert">{error}</div>}
      {message && <div className={styles.success} role="status">{message}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div>
          <label htmlFor="recovery-email">Correo electrónico</label>
          <input
            id="recovery-email"
            type="email"
            value={correo}
            onChange={(event) => setCorreo(event.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className={styles.actions}>
          <button type="submit" className={`btn btn-primary ${styles.fullWidth}`} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
          <button type="button" className={styles.backLink} onClick={onBack}>Volver al inicio de sesión</button>
        </div>
      </form>
    </div>
  );
}
