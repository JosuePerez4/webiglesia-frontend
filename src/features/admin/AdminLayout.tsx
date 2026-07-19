import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { api } from '../../services/api';
import { qk } from '../../services/queryKeys';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Tabs } from '../../components/ui/Tabs';
import styles from './AdminLayout.module.css';
import statStyles from '../../components/ui/StatCard.module.css';

const TAB_ITEMS = [
  { value: 'grupos', label: (<><BookOpen size={16} /> Grupos</>) },
  { value: 'profesores', label: (<><GraduationCap size={16} /> Profesores</>) },
  { value: 'estudiantes', label: (<><Users size={16} /> Estudiantes</>) },
];

/**
 * Las tarjetas solo necesitan el conteo: `select` deriva la longitud sobre la
 * misma entrada de caché que consumen las pestañas, y el layout se vuelve a
 * renderizar solo cuando cambia el número.
 */
function useCount<T>(queryKey: readonly unknown[], queryFn: () => Promise<T[]>) {
  const { data } = useQuery({ queryKey, queryFn, select: (rows: T[]) => rows.length });
  return data ?? 0;
}

export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const totalGrupos = useCount(qk.grupos(), () => api.getGrupos());
  const totalProfesores = useCount(qk.profesores('all'), () => api.getProfesores('all'));
  const totalEstudiantes = useCount(qk.estudiantes('all'), () => api.getEstudiantes(undefined, 'all'));

  const activeTab = location.pathname.split('/')[2] ?? 'grupos';

  return (
    <>
      <PageHeader
        section="Panel de Administración"
        actions={
          <button className="btn btn-secondary" onClick={logout} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Cerrar Sesión
          </button>
        }
      />

      <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
        <div className={styles.statCards}>
          <StatCard icon={<BookOpen size={22} color="white" />} colorClass={statStyles.iconBlue} value={totalGrupos} label="Grupos/Cursos" />
          <StatCard icon={<GraduationCap size={22} color="white" />} colorClass={statStyles.iconPurple} value={totalProfesores} label="Profesores" />
          <StatCard icon={<Users size={22} color="white" />} colorClass={statStyles.iconGold} value={totalEstudiantes} label="Estudiantes" />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => navigate(`/admin/${v}`)} items={TAB_ITEMS} />

        <div style={{ marginTop: '1.5rem' }}>
          <Outlet />
        </div>
      </div>
    </>
  );
}
