import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, CalendarCheck, Clock, Edit2, Save, Users, X } from 'lucide-react';
import { api } from '../../../services/api';
import { qkRoot } from '../../../services/queryKeys';
import { useGrupoDetail } from '../../../hooks/useGrupoDetail';
import { useToast } from '../../../components/ui/useToast';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { EstudiantesTab } from './EstudiantesTab';
import { AsistenciaTab } from './AsistenciaTab';
import { HistorialTab } from './HistorialTab';
import styles from './GrupoDetail.module.css';

const TAB_ITEMS = [
  { value: 'estudiantes', label: (<><Users size={16} /> Estudiantes</>) },
  { value: 'asistencia', label: (<><CalendarCheck size={16} /> Tomar Asistencia</>) },
  { value: 'historial', label: (<><Clock size={16} /> Historial y Faltas</>) },
];

export function GrupoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { grupo, clases, loading } = useGrupoDetail(id);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('estudiantes');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameForm, setNameForm] = useState('');

  const startEditingName = () => {
    if (!grupo) return;
    setNameForm(grupo.nombre);
    setIsEditingName(true);
  };

  const guardarNombre = useMutation({
    mutationFn: () =>
      api.editarGrupo(grupo!.id, {
        nombre: nameForm,
        profesorIds: grupo!.profesorIds || [],
        estudianteIds: grupo!.estudianteIds || [],
      }),
    onSuccess: async () => {
      setIsEditingName(false);
      await queryClient.invalidateQueries({ queryKey: qkRoot.grupos });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Error al actualizar el nombre de la clase', 'error'),
  });

  const handleSaveName = () => {
    if (!grupo || !nameForm.trim()) return;
    guardarNombre.mutate();
  };

  if (loading || !grupo) {
    return <p className={styles.loadingText}>Cargando grupo...</p>;
  }

  return (
    <div>
      <button onClick={() => navigate('/profesor')} className={`btn btn-secondary ${styles.backButton}`}>
        <ArrowLeft size={16} />
        <span>Volver a Mis Clases</span>
      </button>

      <div className={`glass ${styles.groupCard}`}>
        <div className={styles.groupHeader}>
          {isEditingName ? (
            <div className={styles.nameForm}>
              <input type="text" value={nameForm} onChange={(e) => setNameForm(e.target.value)} className={styles.nameInput} />
              <button onClick={handleSaveName} className={`btn btn-success ${styles.nameFormBtn}`}>
                <Save size={18} />
              </button>
              <button onClick={() => setIsEditingName(false)} className={`btn btn-secondary ${styles.nameFormBtn}`}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <div>
              <div className={styles.nameRow}>
                <h1 className={styles.nameTitle}>{grupo.nombre}</h1>
                <button onClick={startEditingName} className={styles.nameEditBtn} title="Editar nombre del grupo">
                  <Edit2 size={16} />
                </button>
              </div>
              <p className={styles.professorName}>
                Profesor: {grupo.profesores?.map((p) => `${p.nombre} ${p.apellido}`).join(', ') || 'Sin asignar'}
              </p>
            </div>
          )}

          <div className={styles.badges}>
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

      {activeTab === 'estudiantes' && <EstudiantesTab grupo={grupo} />}
      {activeTab === 'asistencia' && <AsistenciaTab grupo={grupo} onSubmitted={() => setActiveTab('historial')} />}
      {activeTab === 'historial' && <HistorialTab grupo={grupo} clases={clases} />}
    </div>
  );
}
