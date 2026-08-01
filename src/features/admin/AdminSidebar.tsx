import { NavLink } from 'react-router-dom';
import { BookOpen, Church, House, LogOut, Users, X } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import styles from './AdminSidebar.module.css';

const NAV_ITEMS = [
  { to: '/admin/inicio', label: 'Inicio', icon: House },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/grupos', label: 'Grupos', icon: BookOpen },
];

interface AdminSidebarProps {
  /** Only meaningful <=720px — the sidebar module CSS ignores this on desktop, where it's always visible. */
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
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
            <div className={styles.brandSub}>Panel de Administración</div>
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
