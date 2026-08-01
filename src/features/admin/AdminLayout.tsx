import { Outlet } from 'react-router-dom';
import { useStaffDarkTheme } from '../../hooks/useStaffDarkTheme';
import { AdminSidebar } from './AdminSidebar';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  useStaffDarkTheme();

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
