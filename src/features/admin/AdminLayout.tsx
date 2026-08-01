import { Outlet } from 'react-router-dom';
import { useStaffDarkTheme } from '../../hooks/useStaffDarkTheme';
import { useSidebarDrawer } from '../../hooks/useSidebarDrawer';
import { MobileTopBar } from '../../components/ui/MobileTopBar';
import { AdminSidebar } from './AdminSidebar';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  useStaffDarkTheme();
  const { open, toggle, close } = useSidebarDrawer();

  return (
    <div className={styles.adminShell}>
      <MobileTopBar subtitle="Panel de Administración" onMenuClick={toggle} />
      <AdminSidebar open={open} onClose={close} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
