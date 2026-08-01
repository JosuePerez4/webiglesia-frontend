import { Outlet } from 'react-router-dom';
import { useStaffDarkTheme } from '../../hooks/useStaffDarkTheme';
import { ProfesorSidebar } from './ProfesorSidebar';
import styles from './ProfesorLayout.module.css';

export function ProfesorLayout() {
  useStaffDarkTheme();

  return (
    <div className={styles.profesorShell}>
      <ProfesorSidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
