import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  return (
    <div className={styles.adminShell}>
      <AdminSidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
