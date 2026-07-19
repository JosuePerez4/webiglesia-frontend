import { useNavigate } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useGruposPorProfesor } from '../../hooks/useGruposPorProfesor';
import { EmptyState } from '../../components/ui/EmptyState';
import styles from './GruposList.module.css';

export function GruposList() {
  const { usuario } = useAuth();
  const { grupos, loading } = useGruposPorProfesor(usuario?.id);
  const navigate = useNavigate();

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Mis Clases</h1>
        <p className={styles.subtitle}>Selecciona un curso para tomar asistencia o gestionar tus estudiantes.</p>
      </div>

      {!loading && grupos.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} />}
          title="Aún no tienes grupos asignados"
          description="Cuando el administrador te asigne a un grupo, aparecerá aquí."
        />
      ) : (
        <div className="card-grid">
          {grupos.map((g) => (
            <div key={g.id} className="card glass" onClick={() => navigate(`/profesor/grupos/${g.id}`)} style={{ cursor: 'pointer', textAlign: 'center' }}>
              <div className={styles.cardIcon}>
                <BookOpen size={28} color="white" />
              </div>
              <h3 className={styles.cardTitle}>{g.nombre}</h3>
              <div className={styles.cardMeta}>
                <Users size={16} />
                <span>{g.estudianteIds?.length || 0} Estudiantes</span>
              </div>
              <div className={styles.cardAction}>
                <button className="btn btn-primary">
                  Entrar a la Clase
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
