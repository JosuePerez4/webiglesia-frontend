import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { api } from '../../../services/api';
import { qk } from '../../../services/queryKeys';
import { useToast } from '../../../components/ui/useToast';
import type { Grupo } from '../../../types';
import styles from './AsistenciaTab.module.css';

interface AsistenciaTabProps {
  grupo: Grupo;
  onSubmitted: () => void;
}

function initialChecklist(grupo: Grupo) {
  const initial: { [studentId: string]: boolean } = {};
  grupo.estudiantes?.forEach((e) => {
    initial[e.id] = true;
  });
  return initial;
}

export function AsistenciaTab({ grupo, onSubmitted }: AsistenciaTabProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [checklist, setChecklist] = useState<{ [studentId: string]: boolean }>(() => initialChecklist(grupo));

  const toggle = (studentId: string) => {
    setChecklist((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const registrar = useMutation({
    mutationFn: () => {
      const records = Object.keys(checklist).map((estudianteId) => ({
        estudianteId,
        presente: checklist[estudianteId],
      }));
      return api.registrarAsistencia(grupo.id, attendanceDate, records);
    },
    onSuccess: async () => {
      // Solo cambian las clases del grupo; el grupo en sí no hace falta recargarlo.
      await queryClient.invalidateQueries({ queryKey: qk.clasesGrupo(grupo.id) });
      showToast('¡Asistencia registrada correctamente!');
      onSubmitted();
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Error al registrar asistencia', 'error'),
  });

  const handleSubmit = () => registrar.mutate();

  const hasStudents = grupo.estudiantes && grupo.estudiantes.length > 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--c-blue)' }}>Registro de Nueva Asistencia</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="attDate">Fecha de la Clase</label>
          <input id="attDate" type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
        </div>
      </div>

      <div style={{ margin: '1.5rem 0' }}>
        {hasStudents ? (
          grupo.estudiantes!.map((e) => (
            <div key={e.id} className={styles.attendanceItem}>
              <span style={{ fontWeight: 600 }}>
                {e.nombre} {e.apellido}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: checklist[e.id] ? 'var(--success)' : 'var(--danger)' }}>
                  {checklist[e.id] ? 'Presente' : 'Ausente'}
                </span>
                <label className={styles.checkboxWrapper}>
                  <input type="checkbox" checked={checklist[e.id] || false} onChange={() => toggle(e.id)} />
                  <span className={styles.checkboxSlider}></span>
                </label>
              </div>
            </div>
          ))
        ) : (
          <div className="glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay estudiantes inscritos en este grupo para tomar asistencia.
          </div>
        )}
      </div>

      {hasStudents && (
        <button onClick={handleSubmit} className="btn btn-success" style={{ width: '100%', padding: '1rem' }} disabled={registrar.isPending}>
          <Save size={18} />
          <span>{registrar.isPending ? 'Guardando...' : 'Guardar Lista de Asistencia'}</span>
        </button>
      )}
    </div>
  );
}
