import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useProfesores } from '../../hooks/useProfesores';
import { useEstudiantes } from '../../hooks/useEstudiantes';
import { useToast } from '../../components/ui/useToast';
import { PersonPickerList } from '../../components/ui/PersonPickerList';
import { PageHeader } from '../../components/ui/PageHeader';
import styles from './GrupoEditScreen.module.css';

export function GrupoEditScreen() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useToast();

  // Solo se listan profesores/estudiantes activos para asignar a un grupo.
  const { profesores } = useProfesores(true);
  const { estudiantes } = useEstudiantes(undefined, true);

  const [nombre, setNombre] = useState('');
  const [profesorIds, setProfesorIds] = useState<string[]>([]);
  const [estudianteIds, setEstudianteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    api
      .getGrupo(id)
      .then((grupo) => {
        if (cancelled) return;
        setNombre(grupo.nombre);
        setProfesorIds(grupo.profesorIds || []);
        setEstudianteIds(grupo.estudianteIds || []);
      })
      .catch((err) => {
        if (!cancelled) showToast(err instanceof Error ? err.message : 'Error al cargar el grupo', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, showToast]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      showToast('El nombre del grupo es obligatorio', 'error');
      return;
    }
    setSaving(true);
    try {
      if (isEditing && id) {
        await api.editarGrupo(id, { nombre, profesorIds, estudianteIds, forzarCambioGrupo: true });
        showToast('Grupo actualizado correctamente');
      } else {
        await api.crearGrupo({ nombre, profesorIds, estudianteIds, forzarCambioGrupo: true });
        showToast('Grupo creado correctamente');
      }
      navigate('/admin/grupos');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar el grupo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const profesorPeople = profesores.map((p) => ({ id: p.id, nombre: p.nombre, apellido: p.apellido, meta: p.correo }));
  const estudiantePeople = estudiantes.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    apellido: e.apellido,
    meta: e.nombreGrupo ? `Grupo actual: ${e.nombreGrupo}` : undefined,
  }));

  return (
    <>
      <PageHeader
        section={isEditing ? 'Editar Grupo' : 'Nuevo Grupo'}
        actions={
          <button className="btn btn-secondary" onClick={logout} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Cerrar Sesión
          </button>
        }
      />

      <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
        <button onClick={() => navigate('/admin/grupos')} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} />
          <span>Volver a Grupos</span>
        </button>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando grupo...</p>
        ) : (
          <>
            <div className="glass card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <label htmlFor="grpName">Nombre del Grupo</label>
              <input
                id="grpName"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Jóvenes Adultos"
                style={{ maxWidth: '420px' }}
              />
            </div>

            <div className={styles.splitPanels}>
              <PersonPickerList
                title="Profesores"
                people={profesorPeople}
                selectedIds={profesorIds}
                onChange={setProfesorIds}
                searchPlaceholder="Buscar profesor..."
              />
              <PersonPickerList
                title="Estudiantes"
                people={estudiantePeople}
                selectedIds={estudianteIds}
                onChange={setEstudianteIds}
                searchPlaceholder="Buscar estudiante..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/admin/grupos')}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Grupo'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
