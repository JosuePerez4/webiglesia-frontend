import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useStaffDarkTheme } from '../../hooks/useStaffDarkTheme';
import { homeForRole } from '../../routes/roleHome';
import { Lock, User, Church, AlertCircle, ChevronDown, Shield, GraduationCap } from 'lucide-react';
import type { Rol } from '../../types';
import styles from './Login.module.css';

const ROLES: { value: Rol; label: string; icon: typeof Shield }[] = [
  { value: 'ADMIN', label: 'Administrador', icon: Shield },
  { value: 'PROFESOR', label: 'Profesor', icon: GraduationCap },
];

export function Login() {
  useStaffDarkTheme();
  const { login } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>('ADMIN');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const selected = ROLES.find((r) => r.value === rol)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Por favor, ingresa un nombre de usuario');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const usuario = await api.login(username.trim().toLowerCase(), password, rol);
      login(usuario);
      navigate(homeForRole(usuario.rolActivo), { replace: true });
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

          <div className={styles.inputGroup}>
            <label>Ingresar como</label>
            <div className={styles.customSelect} ref={dropdownRef}>
              <button
                type="button"
                className={`${styles.selectTrigger}${dropdownOpen ? ` ${styles.selectTriggerOpen}` : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <selected.icon size={16} />
                <span>{selected.label}</span>
                <ChevronDown size={16} className={`${styles.selectArrow}${dropdownOpen ? ` ${styles.selectArrowOpen}` : ''}`} />
              </button>
              {dropdownOpen && (
                <div className={styles.selectDropdown}>
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      className={`${styles.selectOption}${rol === r.value ? ` ${styles.selectOptionActive}` : ''}`}
                      onClick={() => { setRol(r.value); setDropdownOpen(false); }}
                    >
                      <r.icon size={15} />
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
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
