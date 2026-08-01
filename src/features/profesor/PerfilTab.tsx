import { BookOpen, Calendar, Mail, Phone, User } from 'lucide-react';
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
    <div>
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
    </div>
  );
}
