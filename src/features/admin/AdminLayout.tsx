import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useGrupos } from '../../hooks/useGrupos';
import { useProfesores } from '../../hooks/useProfesores';
import { useEstudiantes } from '../../hooks/useEstudiantes';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Tabs } from '../../components/ui/Tabs';
import type { Estudiante, Grupo, Profesor } from '../../types';
import styles from './AdminLayout.module.css';
import statStyles from '../../components/ui/StatCard.module.css';

export interface AdminOutletContext {
  grupos: Grupo[];
  loadingGrupos: boolean;
  refetchGrupos: () => void;
  profesores: Profesor[];
  loadingProfesores: boolean;
  refetchProfesores: () => void;
  estudiantes: Estudiante[];
  loadingEstudiantes: boolean;
  refetchEstudiantes: () => void;
}

const TAB_ITEMS = [
  { value: 'grupos', label: (<><BookOpen size={16} /> Grupos</>) },
  { value: 'profesores', label: (<><GraduationCap size={16} /> Profesores</>) },
  { value: 'estudiantes', label: (<><Users size={16} /> Estudiantes</>) },
];

export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { grupos, loading: loadingGrupos, refetch: refetchGrupos } = useGrupos();
  const { profesores, loading: loadingProfesores, refetch: refetchProfesores } = useProfesores('all');
  const { estudiantes, loading: loadingEstudiantes, refetch: refetchEstudiantes } = useEstudiantes(undefined, 'all');

  const activeTab = location.pathname.split('/')[2] ?? 'grupos';

  const context: AdminOutletContext = {
    grupos,
    loadingGrupos,
    refetchGrupos,
    profesores,
    loadingProfesores,
    refetchProfesores,
    estudiantes,
    loadingEstudiantes,
    refetchEstudiantes,
  };

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
          <StatCard icon={<BookOpen size={22} color="white" />} colorClass={statStyles.iconBlue} value={grupos.length} label="Grupos/Cursos" />
          <StatCard icon={<GraduationCap size={22} color="white" />} colorClass={statStyles.iconPurple} value={profesores.length} label="Profesores" />
          <StatCard icon={<Users size={22} color="white" />} colorClass={statStyles.iconGold} value={estudiantes.length} label="Estudiantes" />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => navigate(`/admin/${v}`)} items={TAB_ITEMS} />

        <div style={{ marginTop: '1.5rem' }}>
          <Outlet context={context} />
        </div>
      </div>
    </>
  );
}
