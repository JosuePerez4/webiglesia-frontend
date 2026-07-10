import { useNavigate } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useGruposPorProfesor } from '../../hooks/useGruposPorProfesor';
import { EmptyState } from '../../components/ui/EmptyState';

export function GruposList() {
  const { usuario } = useAuth();
  const { grupos, loading } = useGruposPorProfesor(usuario?.id);
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', color: 'var(--c-blue)' }}>Mis Clases</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Selecciona un curso para tomar asistencia o gestionar tus estudiantes.</p>
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
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--c-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <BookOpen size={28} color="white" />
              </div>
              <h3 style={{ marginTop: '1rem', color: 'var(--c-blue)' }}>{g.nombre}</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Users size={16} />
                  <span>{g.estudianteIds?.length || 0} Estudiantes</span>
                </div>
              </div>
              <div style={{ marginTop: '1.25rem' }}>
                <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>
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
