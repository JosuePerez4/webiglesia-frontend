import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  // Radix Dialog/Toast portal outside this component's DOM subtree, so the
  // dark palette is applied via a body class (see AdminLayout.module.css)
  // instead of a wrapper class, and toggled here based on mount lifetime.
  useEffect(() => {
    document.body.classList.add('admin-theme');
    return () => {
      document.body.classList.remove('admin-theme');
    };
  }, []);

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
