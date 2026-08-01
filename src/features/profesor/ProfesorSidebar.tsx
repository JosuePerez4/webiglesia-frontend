import { NavLink } from 'react-router-dom';
import { BookOpen, Church, LogOut, UserCircle, X } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import styles from './ProfesorSidebar.module.css';

const NAV_ITEMS = [
  { to: '/profesor/perfil', label: 'Perfil', icon: UserCircle },
  { to: '/profesor/grupos', label: 'Grupos', icon: BookOpen },
];

interface ProfesorSidebarProps {
  /** Only meaningful <=720px — the sidebar module CSS ignores this on desktop, where it's always visible. */
  open: boolean;
  onClose: () => void;
}

export function ProfesorSidebar({ open, onClose }: ProfesorSidebarProps) {
  const { logout } = useAuth();

  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.sidebar}${open ? ` ${styles.sidebarOpen}` : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>
            <Church size={16} />
          </span>
          <div>
            <div className={styles.brandName}>WebIglesia</div>
            <div className={styles.brandSub}>Portal Docente</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>

        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
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
    </>
  );
}
