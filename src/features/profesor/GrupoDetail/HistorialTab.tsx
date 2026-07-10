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
        <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', minHeight: 300 }}>
          <h3 style={{ color: 'var(--c-blue)', marginBottom: '1rem' }}>Fechas de Clase</h3>
          {clases.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {clases.map((c) => {
                const presentCount = c.asistencias.filter((a) => a.presente).length;
                const isSelected = selectedClase?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClase(c)}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'rgba(24, 78, 121, 0.1)' : 'var(--bg-secondary)',
                      border: isSelected ? '1px solid var(--c-blue)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontFamily: 'var(--font-sans)',
                      color: isSelected ? 'var(--c-blue)' : 'var(--text-primary)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Calendar size={16} />
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block' }}>{c.fecha}</strong>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                        Asistieron {presentCount} de {c.asistencias.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aún no se han registrado asistencias para este grupo.</p>
          )}
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', minHeight: 300 }}>
          {selectedClase ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: 'var(--c-blue)' }}>Reporte de Clase: {selectedClase.fecha}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Detalle de estudiantes presentes y ausentes</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedClase.asistencias.map((a) => {
                  const estObj = grupo.estudiantes?.find((e) => e.id === a.estudianteId);
                  const fullName = estObj ? `${estObj.nombre} ${estObj.apellido}` : `Estudiante #${a.estudianteId.substring(0, 4)}`;

                  return (
                    <div
                      key={a.estudianteId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: a.presente ? 'rgba(16, 185, 129, 0.08)' : 'rgba(158, 40, 60, 0.08)',
                        border: `1px solid ${a.presente ? 'rgba(16, 185, 129, 0.2)' : 'rgba(158, 40, 60, 0.2)'}`,
                      }}
                    >
                      <span>{fullName}</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          color: a.presente ? 'var(--success)' : 'var(--danger)',
                          backgroundColor: a.presente ? 'rgba(16, 185, 129, 0.15)' : 'rgba(158, 40, 60, 0.15)',
                        }}
                      >
                        {a.presente ? <Check size={14} /> : <X size={14} />}
                        {a.presente ? 'Asistió' : 'Faltó'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200, color: 'var(--text-muted)' }}>
              <CalendarCheck size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Selecciona una fecha de la izquierda para ver el reporte de asistencia.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
