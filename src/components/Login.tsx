import React, { useState } from 'react';
import { api } from '../services/api';
import type { Usuario } from '../types';
import { Lock, User, Church, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (usuario: Usuario) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
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
      // In a real app we might pass a password.
      const res = await api.login(username.trim().toLowerCase(), password);
      onLoginSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user: string) => {
    setUsername(user);
    setPassword('123456'); // dummy password for mock
  };

  return (
    <div style={styles.container}>
      <div className="glass animate-fade-in" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <img 
              src="/Foursquare_Church_logo.svg.webp" 
              alt="Escudo Iglesia" 
              style={styles.logo}
              onError={(e) => {
                // fallback if not copied yet or failed
                e.currentTarget.style.display = 'none';
              }}
            />
            <Church size={40} color="var(--c-blue)" style={styles.fallbackLogoIcon} />
          </div>
          <h1 style={styles.title}>WebIglesia</h1>
          <p style={styles.subtitle}>Gestión de Cursos y Asistencia</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={18} color="var(--c-red)" />
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="username">Nombre de Usuario</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: admin o profesor1"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password">Contraseña</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={styles.submitBtn}
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>Acceso Rápido de Prueba</span>
        </div>

        <div style={styles.quickAccessGrid}>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => handleQuickLogin('admin')}
            style={styles.quickBtn}
          >
            Administrador (admin)
          </button>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => handleQuickLogin('profesor1')}
            style={styles.quickBtn}
          >
            Profesor Carlos (profesor1)
          </button>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => handleQuickLogin('profesor2')}
            style={styles.quickBtn}
          >
            Profesor María (profesor2)
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '85vh',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    padding: '2.5rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-xl)',
    textAlign: 'center' as const,
  },
  header: {
    marginBottom: '2rem',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  logo: {
    height: '80px',
    objectFit: 'contain' as const,
  },
  fallbackLogoIcon: {
    display: 'none', // hidden if image loads, handled via onerror helper if needed
  },
  title: {
    fontSize: '2rem',
    fontFamily: 'var(--font-display)',
    color: 'var(--c-blue)',
    marginBottom: '0.25rem',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
    textAlign: 'left' as const,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  inputWrapper: {
    position: 'relative' as const,
  },
  inputIcon: {
    position: 'absolute' as const,
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  },
  input: {
    paddingLeft: '2.75rem',
  },
  submitBtn: {
    marginTop: '0.5rem',
    width: '100%',
    backgroundColor: 'var(--c-blue)',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(158, 40, 60, 0.1)',
    border: '1px solid rgba(158, 40, 60, 0.3)',
    borderRadius: 'var(--radius-md)',
    padding: '0.75rem 1rem',
    marginBottom: '1.25rem',
    textAlign: 'left' as const,
  },
  errorText: {
    fontSize: '0.875rem',
    color: 'var(--c-red)',
    fontWeight: 500,
  },
  divider: {
    margin: '1.5rem 0',
    position: 'relative' as const,
    textAlign: 'center' as const,
  },
  dividerText: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '0 0.75rem',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    position: 'relative' as const,
    zIndex: 1,
  },
  quickAccessGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  quickBtn: {
    fontSize: '0.85rem',
    padding: '0.5rem 1rem',
  }
};
