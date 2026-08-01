import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Shield, Users } from 'lucide-react';
import { Tabs } from '../../components/ui/Tabs';
import styles from './UsuariosTab.module.css';

const TAB_ITEMS = [
  { value: 'admins', label: (<><Shield size={16} /> Admins</>) },
  { value: 'profesores', label: (<><GraduationCap size={16} /> Profesores</>) },
  { value: 'estudiantes', label: (<><Users size={16} /> Estudiantes</>) },
];

export function UsuariosTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/')[3] ?? 'admins';

  return (
    <div className="animate-fade-in">
      <h1 className={styles.title}>Usuarios</h1>
      <p className={styles.subtitle}>Administradores, profesores y estudiantes del sistema</p>

      <Tabs value={activeTab} onValueChange={(v) => navigate(`/admin/usuarios/${v}`)} items={TAB_ITEMS} />

      <div className={styles.panel}>
        <Outlet />
      </div>
    </div>
  );
}
