import { NavLink } from 'react-router-dom';
import { BookOpen, Church, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import styles from './ProfesorSidebar.module.css';

const NAV_ITEMS = [
  { to: '/profesor/perfil', label: 'Perfil', icon: UserCircle },
  { to: '/profesor/grupos', label: 'Grupos', icon: BookOpen },
];

export function ProfesorSidebar() {
  const { logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>
          <Church size={16} />
        </span>
        <div>
          <div className={styles.brandName}>WebIglesia</div>
          <div className={styles.brandSub}>Portal Docente</div>
        </div>
      </div>

      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `${styles.navItem}${isActive ? ` ${styles.navItemActive}` : ''}`}
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}

      <div className={styles.spacer} />

      <button type="button" className={styles.logoutBtn} onClick={logout}>
        <LogOut size={17} />
        Cerrar Sesión
      </button>
    </aside>
  );
}
