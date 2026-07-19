import { useState } from 'react';
import { Calendar, CalendarCheck, Check, X } from 'lucide-react';
import type { Clase, Grupo } from '../../../types';
import styles from './HistorialTab.module.css';

interface HistorialTabProps {
  grupo: Grupo;
  clases: Clase[];
}

export function HistorialTab({ grupo, clases }: HistorialTabProps) {
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null);

  return (
    <div className="animate-fade-in">
      <div className={styles.twoColLayout}>
        <div className={`glass ${styles.datesPanel}`}>
          <h3>Fechas de Clase</h3>
          {clases.length > 0 ? (
            <div className={styles.dateList}>
              {clases.map((c) => {
                const presentCount = c.asistencias.filter((a) => a.presente).length;
                const isSelected = selectedClase?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClase(c)}
                    className={`${styles.dateBtn} ${isSelected ? styles.dateBtnSelected : ''}`}
                  >
                    <Calendar size={16} />
                    <div className={styles.dateInfo}>
                      <strong>{c.fecha}</strong>
                      <span>Asistieron {presentCount} de {c.asistencias.length}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aún no se han registrado asistencias para este grupo.</p>
          )}
        </div>

        <div className={`glass ${styles.reportPanel}`}>
          {selectedClase ? (
            <div>
              <div className={styles.reportHeader}>
                <div>
                  <h3>Reporte de Clase: {selectedClase.fecha}</h3>
                  <p className={styles.reportSubtitle}>Detalle de estudiantes presentes y ausentes</p>
                </div>
              </div>

              <div className={styles.studentList}>
                {selectedClase.asistencias.map((a) => {
                  const estObj = grupo.estudiantes?.find((e) => e.id === a.estudianteId);
                  const fullName = estObj ? `${estObj.nombre} ${estObj.apellido}` : `Estudiante #${a.estudianteId.substring(0, 4)}`;

                  return (
                    <div
                      key={a.estudianteId}
                      className={`${styles.studentRow} ${a.presente ? styles.studentRowPresent : styles.studentRowAbsent}`}
                    >
                      <span>{fullName}</span>
                      <span className={`${styles.statusBadge} ${a.presente ? styles.statusPresent : styles.statusAbsent}`}>
                        {a.presente ? <Check size={14} /> : <X size={14} />}
                        {a.presente ? 'Asistió' : 'Faltó'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.emptyReport}>
              <CalendarCheck size={48} className={styles.emptyReportIcon} />
              <p>Selecciona una fecha de la izquierda para ver el reporte de asistencia.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
