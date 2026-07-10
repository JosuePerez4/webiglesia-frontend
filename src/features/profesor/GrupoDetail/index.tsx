import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CalendarCheck, Clock, Edit2, Save, Users, X } from 'lucide-react';
import { api } from '../../../services/api';
import { useGrupoDetail } from '../../../hooks/useGrupoDetail';
import { useToast } from '../../../components/ui/useToast';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { EstudiantesTab } from './EstudiantesTab';
import { AsistenciaTab } from './AsistenciaTab';
import { HistorialTab } from './HistorialTab';
import modalStyles from '../../../components/ui/Modal.module.css';

const TAB_ITEMS = [
  { value: 'estudiantes', label: (<><Users size={16} /> Estudiantes</>) },
  { value: 'asistencia', label: (<><CalendarCheck size={16} /> Tomar Asistencia</>) },
  { value: 'historial', label: (<><Clock size={16} /> Historial y Faltas</>) },
];

export function GrupoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { grupo, clases, loading, refetch } = useGrupoDetail(id);

  const [activeTab, setActiveTab] = useState('estudiantes');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameForm, setNameForm] = useState('');

  const startEditingName = () => {
    if (!grupo) return;
    setNameForm(grupo.nombre);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!grupo || !nameForm.trim()) return;
    try {
      await api.editarGrupo(grupo.id, {
        nombre: nameForm,
        profesorIds: grupo.profesorIds || [],
        estudianteIds: grupo.estudianteIds || [],
      });
      setIsEditingName(false);
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al actualizar el nombre de la clase', 'error');
    }
  };

  if (loading || !grupo) {
    return <p style={{ color: 'var(--text-muted)' }}>Cargando grupo...</p>;
  }

  return (
    <div>
      <button onClick={() => navigate('/profesor')} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        <span>Volver a Mis Clases</span>
      </button>

      <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {isEditingName ? (
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '500px' }}>
              <input type="text" value={nameForm} onChange={(e) => setNameForm(e.target.value)} style={{ fontSize: '1.5rem', fontWeight: 'bold' }} />
              <button onClick={handleSaveName} className="btn btn-success" style={{ padding: '0.5rem 1rem' }}>
                <Save size={18} />
              </button>
              <button onClick={() => setIsEditingName(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--c-blue)' }}>{grupo.nombre}</h1>
                <button onClick={startEditingName} className={modalStyles.closeBtn} title="Editar nombre del grupo">
                  <Edit2 size={16} />
                </button>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Profesor: {grupo.profesores?.map((p) => `${p.nombre} ${p.apellido}`).join(', ') || 'Sin asignar'}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Badge tone="blue" icon={<Users size={14} />}>
              {grupo.estudiantes?.length || 0} Inscritos
            </Badge>
            <Badge tone="purple" icon={<Calendar size={14} />}>
              {clases.length} Clases Dictadas
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} items={TAB_ITEMS} variant="underline" />
      </div>

      {activeTab === 'estudiantes' && <EstudiantesTab grupo={grupo} onChanged={refetch} />}
      {activeTab === 'asistencia' && <AsistenciaTab grupo={grupo} onSubmitted={() => { refetch(); setActiveTab('historial'); }} />}
      {activeTab === 'historial' && <HistorialTab grupo={grupo} clases={clases} />}
    </div>
  );
}
