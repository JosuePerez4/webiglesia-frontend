import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { homeForRole } from '../../routes/roleHome';
import { Lock, User, Church, AlertCircle } from 'lucide-react';
import styles from './Login.module.css';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Por favor, ingresa un nombre de usuario');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const usuario = await api.login(username.trim().toLowerCase(), password);
      login(usuario);
      navigate(homeForRole(usuario.rol), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass animate-fade-in ${styles.card}`}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img
              src="/Foursquare_Church_logo.svg.webp"
              alt="Escudo Iglesia"
              className={styles.logo}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <Church size={40} color="var(--c-blue)" className={styles.fallbackLogoIcon} />
          </div>
          <h1 className={styles.title}>WebIglesia</h1>
          <p className={styles.subtitle}>Gestión de Cursos y Asistencia</p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} color="var(--c-red)" />
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Nombre de Usuario</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: admin o profesor1"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Contraseña</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
              />
            </div>
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
