import { Outlet } from 'react-router-dom';
import { useStaffDarkTheme } from '../../hooks/useStaffDarkTheme';
import { useSidebarDrawer } from '../../hooks/useSidebarDrawer';
import { MobileTopBar } from '../../components/ui/MobileTopBar';
import { ProfesorSidebar } from './ProfesorSidebar';
import styles from './ProfesorLayout.module.css';

export function ProfesorLayout() {
  useStaffDarkTheme();
  const { open, toggle, close } = useSidebarDrawer();

  return (
    <div className={styles.profesorShell}>
      <MobileTopBar subtitle="Portal Docente" onMenuClick={toggle} />
      <ProfesorSidebar open={open} onClose={close} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
