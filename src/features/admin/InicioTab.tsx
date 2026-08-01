import { useNavigate } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import styles from './InicioTab.module.css';

const FORMATTER = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function InicioTab() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const today = FORMATTER.format(new Date());

  return (
    <div>
      <h1 className={styles.title}>Hola, {usuario?.nombreusuario} 👋</h1>
      <p className={styles.subtitle}>{today.charAt(0).toUpperCase() + today.slice(1)} · Panel de Administración</p>

      <div className={styles.quickGrid}>
        <button type="button" className={styles.quickCard} onClick={() => navigate('/admin/usuarios')}>
          <span className={styles.quickIcon} style={{ background: 'rgba(166, 139, 209, 0.16)', color: 'var(--accent)' }}>
            <Users size={20} />
          </span>
          <span>
            <strong>Gestionar Usuarios</strong>
            <span className={styles.quickDesc}>Admins, profesores y estudiantes</span>
          </span>
        </button>
        <button type="button" className={styles.quickCard} onClick={() => navigate('/admin/grupos')}>
          <span className={styles.quickIcon} style={{ background: 'rgba(110, 168, 224, 0.16)', color: 'var(--primary)' }}>
            <BookOpen size={20} />
          </span>
          <span>
            <strong>Gestionar Grupos</strong>
            <span className={styles.quickDesc}>Cursos y clases</span>
          </span>
        </button>
      </div>
    </div>
  );
}
