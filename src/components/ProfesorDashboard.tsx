import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Grupo, Estudiante, Clase } from '../types';
import { 
  BookOpen, Users, Calendar, Search, Plus, Edit2, 
  Check, X, ArrowLeft, Save, CalendarCheck, Clock 
} from 'lucide-react';

interface ProfesorDashboardProps {
  profesorId: string;
  onLogout: () => void;
}

export const ProfesorDashboard: React.FC<ProfesorDashboardProps> = ({ profesorId, onLogout }) => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [grupoDetail, setGrupoDetail] = useState<Grupo | null>(null);
  
  // Tab control inside a group
  const [activeTab, setActiveTab] = useState<'estudiantes' | 'asistencia' | 'historial'>('estudiantes');
  
  // Student search & management
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Estudiante | null>(null);
  
  // Student Form state
  const [studentForm, setStudentForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    fechaDeNacimiento: '',
    correo: ''
  });

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceChecklist, setAttendanceChecklist] = useState<{ [studentId: string]: boolean }>({});
  
  // Class history
  const [clases, setClases] = useState<Clase[]>([]);
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null);

  // Group editing state
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupNameForm, setGroupNameForm] = useState('');

  // Fetch groups
  const loadGrupos = async () => {
    try {
      const allGrupos = await api.getGrupos();
      // Filter groups where this teacher is assigned (in seed data/mock)
      // For testing, if no groups belong, show all so they don't see an empty page
      const teacherGroups = allGrupos.filter(g => g.profesorIds?.includes(profesorId));
      setGrupos(teacherGroups.length > 0 ? teacherGroups : allGrupos);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadGrupos();
  }, [profesorId]);

  // Load detailed group info when selected
  useEffect(() => {
    if (selectedGrupo) {
      loadGrupoDetails(selectedGrupo.id);
    }
  }, [selectedGrupo]);

  const loadGrupoDetails = async (id: string) => {
    try {
      const detail = await api.getGrupo(id);
      setGrupoDetail(detail);
      setGroupNameForm(detail.nombre);
      
      // Load classes
      const hist = await api.getClasesGrupo(id);
      setClases(hist);
      
      // Initialize checklist with all students marked present by default
      const initialList: { [studentId: string]: boolean } = {};
      detail.estudiantes?.forEach(e => {
        initialList[e.id] = true;
      });
      setAttendanceChecklist(initialList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectGrupo = (grupo: Grupo) => {
    setSelectedGrupo(grupo);
    setActiveTab('estudiantes');
    setSelectedClase(null);
    setIsEditingGroup(false);
  };

  const handleBackToDashboard = () => {
    setSelectedGrupo(null);
    setGrupoDetail(null);
    loadGrupos();
  };

  // Student Edit / Create
  const handleOpenStudentModal = (student?: Estudiante) => {
    if (student) {
      setEditingStudent(student);
      setStudentForm({
        nombre: student.nombre,
        apellido: student.apellido,
        telefono: student.telefono || '',
        fechaDeNacimiento: student.fechaDeNacimiento || '',
        correo: student.correo || ''
      });
    } else {
      setEditingStudent(null);
      setStudentForm({
        nombre: '',
        apellido: '',
        telefono: '',
        fechaDeNacimiento: '',
        correo: ''
      });
    }
    setIsStudentModalOpen(true);
  };

  const handleStudentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grupoDetail) return;

    try {
      if (editingStudent) {
        // Edit student
        await api.editarEstudiante(editingStudent.id, studentForm);
        // refresh
        loadGrupoDetails(grupoDetail.id);
      } else {
        // Create student
        const created = await api.crearEstudiante(studentForm);
        // Add to group list (update group student list)
        const currentEstudianteIds = grupoDetail.estudianteIds || [];
        await api.editarGrupo(grupoDetail.id, {
          nombre: grupoDetail.nombre,
          profesorIds: grupoDetail.profesorIds || [],
          estudianteIds: [...currentEstudianteIds, created.id]
        });
        loadGrupoDetails(grupoDetail.id);
      }
      setIsStudentModalOpen(false);
    } catch (err) {
      alert('Error al guardar estudiante');
    }
  };

  // Attendance submission
  const handleToggleAttendance = (studentId: string) => {
    setAttendanceChecklist(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!grupoDetail) return;
    const records = Object.keys(attendanceChecklist).map(eId => ({
      estudianteId: eId,
      presente: attendanceChecklist[eId]
    }));

    try {
      await api.registrarAsistencia(grupoDetail.id, attendanceDate, records);
      alert('¡Asistencia registrada correctamente!');
      loadGrupoDetails(grupoDetail.id);
      setActiveTab('historial');
    } catch (err) {
      alert('Error al registrar asistencia');
    }
  };

  // Edit Group Name
  const handleSaveGroupName = async () => {
    if (!grupoDetail || !groupNameForm.trim()) return;
    try {
      await api.editarGrupo(grupoDetail.id, {
        nombre: groupNameForm,
        profesorIds: grupoDetail.profesorIds || [],
        estudianteIds: grupoDetail.estudianteIds || []
      });
      setIsEditingGroup(false);
      loadGrupoDetails(grupoDetail.id);
    } catch (err) {
      alert('Error al actualizar el nombre de la clase');
    }
  };

  // Filter students based on search query
  const filteredStudents = grupoDetail?.estudiantes?.filter(e => 
    `${e.nombre} ${e.apellido}`.toLowerCase().includes(studentSearch.toLowerCase())
  ) || [];

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* Top Header */}
      <header style={styles.topHeader}>
        <div>
          <h2 style={styles.brandTitle}>WebIglesia — Portal Docente</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Profesor Activo</p>
        </div>
        <button className="btn btn-secondary" onClick={onLogout} style={styles.logoutBtn}>
          Cerrar Sesión
        </button>
      </header>

      {!selectedGrupo ? (
        // Dashboard View (List of groups)
        <div>
          <div style={styles.sectionHeader}>
            <div>
              <h1 style={{ fontSize: '2.25rem', color: 'var(--c-blue)' }}>Mis Clases</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Selecciona un curso para tomar asistencia o gestionar tus estudiantes.</p>
            </div>
          </div>

          <div className="card-grid">
            {grupos.map(g => (
              <div 
                key={g.id} 
                className="card glass" 
                onClick={() => handleSelectGrupo(g)}
                style={styles.groupCard}
              >
                <div style={styles.groupCardIcon}>
                  <BookOpen size={28} color="white" />
                </div>
                <h3 style={{ marginTop: '1rem', color: 'var(--c-blue)' }}>{g.nombre}</h3>
                <div style={styles.cardStats}>
                  <div style={styles.statItem}>
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
        </div>
      ) : (
        // Detailed Group View
        <div>
          <button onClick={handleBackToDashboard} style={styles.backBtn} className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Volver a Mis Clases</span>
          </button>

          {/* Group Header Info */}
          <div className="glass" style={styles.detailHeaderCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              {isEditingGroup ? (
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '500px' }}>
                  <input 
                    type="text" 
                    value={groupNameForm} 
                    onChange={(e) => setGroupNameForm(e.target.value)} 
                    style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                  />
                  <button onClick={handleSaveGroupName} className="btn btn-success" style={{ padding: '0.5rem 1rem' }}>
                    <Save size={18} />
                  </button>
                  <button onClick={() => setIsEditingGroup(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--c-blue)' }}>{grupoDetail?.nombre}</h1>
                    <button 
                      onClick={() => setIsEditingGroup(true)} 
                      style={styles.editIconBtn}
                      title="Editar nombre del grupo"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>Profesor: {grupoDetail?.profesores?.map(p => `${p.nombre} ${p.apellido}`).join(', ') || 'Sin asignar'}</p>
                </div>
              )}

              <div style={styles.quickInfoBadges}>
                <span style={styles.badgeBlue}>
                  <Users size={14} />
                  {grupoDetail?.estudiantes?.length || 0} Inscritos
                </span>
                <span style={styles.badgePurple}>
                  <Calendar size={14} />
                  {clases.length} Clases Dictadas
                </span>
              </div>
            </div>

            {/* Custom Tab Navigation */}
            <div style={styles.tabNav}>
              <button 
                onClick={() => { setActiveTab('estudiantes'); setSelectedClase(null); }}
                style={activeTab === 'estudiantes' ? styles.activeTabBtn : styles.tabBtn}
              >
                <Users size={16} /> Estudiantes
              </button>
              <button 
                onClick={() => { setActiveTab('asistencia'); setSelectedClase(null); }}
                style={activeTab === 'asistencia' ? styles.activeTabBtn : styles.tabBtn}
              >
                <CalendarCheck size={16} /> Tomar Asistencia
              </button>
              <button 
                onClick={() => { setActiveTab('historial'); setSelectedClase(null); }}
                style={activeTab === 'historial' ? styles.activeTabBtn : styles.tabBtn}
              >
                <Clock size={16} /> Historial y Faltas
              </button>
            </div>
          </div>

          {/* TAB 1: Students Management */}
          {activeTab === 'estudiantes' && (
            <div className="animate-fade-in">
              <div style={styles.actionRow}>
                <div className="search-container">
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Buscar estudiante..." 
                    className="search-input"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenStudentModal()}>
                  <Plus size={18} />
                  <span>Nuevo Estudiante</span>
                </button>
              </div>

              <div style={styles.tableCard} className="glass">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nombre Completo</th>
                      <th style={styles.th}>Teléfono</th>
                      <th style={styles.th}>Correo Electrónico</th>
                      <th style={styles.th}>Fecha Nacimiento</th>
                      <th style={styles.th}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(e => (
                        <tr key={e.id} style={styles.tr}>
                          <td style={styles.td}>
                            <strong>{e.nombre} {e.apellido}</strong>
                          </td>
                          <td style={styles.td}>{e.telefono || '—'}</td>
                          <td style={styles.td}>{e.correo || '—'}</td>
                          <td style={styles.td}>{e.fechaDeNacimiento || '—'}</td>
                          <td style={styles.td}>
                            <button 
                              onClick={() => handleOpenStudentModal(e)} 
                              className="btn btn-secondary" 
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                            >
                              <Edit2 size={12} />
                              <span>Editar</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={styles.emptyTd}>No se encontraron estudiantes.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Take Attendance Checklist */}
          {activeTab === 'asistencia' && (
            <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
              <div className="glass" style={styles.attendanceSettingsCard}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--c-blue)' }}>Registro de Nueva Asistencia</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="attDate">Fecha de la Clase</label>
                  <input 
                    id="attDate"
                    type="date" 
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ margin: '1.5rem 0' }}>
                {grupoDetail?.estudiantes && grupoDetail.estudiantes.length > 0 ? (
                  grupoDetail.estudiantes.map(e => (
                    <div key={e.id} className="attendance-item">
                      <div>
                        <span style={{ fontWeight: 600 }}>{e.nombre} {e.apellido}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 'bold',
                          color: attendanceChecklist[e.id] ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {attendanceChecklist[e.id] ? 'Presente' : 'Ausente'}
                        </span>
                        <label className="checkbox-wrapper">
                          <input 
                            type="checkbox" 
                            checked={attendanceChecklist[e.id] || false}
                            onChange={() => handleToggleAttendance(e.id)}
                          />
                          <span className="checkbox-slider"></span>
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

              {grupoDetail?.estudiantes && grupoDetail.estudiantes.length > 0 && (
                <button 
                  onClick={handleSubmitAttendance}
                  className="btn btn-success" 
                  style={{ width: '100%', padding: '1rem' }}
                >
                  <Save size={18} />
                  <span>Guardar Lista de Asistencia</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 3: Class History and Absences */}
          {activeTab === 'historial' && (
            <div className="animate-fade-in">
              <div style={styles.historyLayout}>
                {/* Left Side: Class Dates list */}
                <div style={styles.historySidebar} className="glass">
                  <h3 style={{ color: 'var(--c-blue)', marginBottom: '1rem' }}>Fechas de Clase</h3>
                  {clases.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {clases.map(c => {
                        const presentCount = c.asistencias.filter(a => a.presente).length;
                        return (
                          <button
                            key={c.id}
                            style={selectedClase?.id === c.id ? styles.selectedClassBtn : styles.classBtn}
                            onClick={() => setSelectedClase(c)}
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

                {/* Right Side: Detailed attendance lookup */}
                <div style={styles.historyDetail} className="glass">
                  {selectedClase ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <div>
                          <h3 style={{ color: 'var(--c-blue)' }}>Reporte de Clase: {selectedClase.fecha}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Detalle de estudiantes presentes y ausentes</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {selectedClase.asistencias.map(a => {
                          const estObj = grupoDetail?.estudiantes?.find(e => e.id === a.estudianteId);
                          const fullName = estObj ? `${estObj.nombre} ${estObj.apellido}` : `Estudiante #${a.estudianteId.substring(0,4)}`;
                          
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
                                border: `1px solid ${a.presente ? 'rgba(16, 185, 129, 0.2)' : 'rgba(158, 40, 60, 0.2)'}`
                              }}
                            >
                              <span>{fullName}</span>
                              <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                color: a.presente ? 'var(--success)' : 'var(--danger)',
                                backgroundColor: a.presente ? 'rgba(16, 185, 129, 0.15)' : 'rgba(158, 40, 60, 0.15)'
                              }}>
                                {a.presente ? <Check size={14} /> : <X size={14} />}
                                {a.presente ? 'Asistió' : 'Faltó'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px', color: 'var(--text-muted)' }}>
                      <CalendarCheck size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                      <p>Selecciona una fecha de la izquierda para ver el reporte de asistencia.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STUDENT CREATE/EDIT MODAL */}
      {isStudentModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>{editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}</h2>
              <button onClick={() => setIsStudentModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStudentFormSubmit} style={styles.modalForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="stdName">Nombre</label>
                  <input 
                    id="stdName"
                    type="text" 
                    required 
                    value={studentForm.nombre}
                    onChange={(e) => setStudentForm({ ...studentForm, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="stdSurname">Apellido</label>
                  <input 
                    id="stdSurname"
                    type="text" 
                    required 
                    value={studentForm.apellido}
                    onChange={(e) => setStudentForm({ ...studentForm, apellido: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="stdPhone">Teléfono</label>
                <input 
                  id="stdPhone"
                  type="tel" 
                  value={studentForm.telefono}
                  onChange={(e) => setStudentForm({ ...studentForm, telefono: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="stdBirth">Fecha de Nacimiento</label>
                <input 
                  id="stdBirth"
                  type="date" 
                  value={studentForm.fechaDeNacimiento}
                  onChange={(e) => setStudentForm({ ...studentForm, fechaDeNacimiento: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="stdEmail">Correo Electrónico</label>
                <input 
                  id="stdEmail"
                  type="email" 
                  value={studentForm.correo}
                  onChange={(e) => setStudentForm({ ...studentForm, correo: e.target.value })}
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsStudentModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1.25rem',
    marginBottom: '2rem',
  },
  brandTitle: {
    color: 'var(--c-blue)',
    fontSize: '1.25rem',
  },
  logoutBtn: {
    fontSize: '0.85rem',
    padding: '0.5rem 1rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  groupCard: {
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  groupCardIcon: {
    width: '56px',
    height: '56px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--c-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
  cardStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '0.75rem',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    padding: '0.5rem 1rem',
    marginBottom: '1.5rem',
    alignSelf: 'flex-start',
  },
  detailHeaderCard: {
    padding: '2rem',
    borderRadius: 'var(--radius-lg)',
    marginBottom: '2rem',
  },
  editIconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px',
    borderRadius: '4px',
    transition: 'background 0.2s',
    '&:hover': {
      background: 'var(--border-color)',
    }
  },
  quickInfoBadges: {
    display: 'flex',
    gap: '0.75rem',
  },
  badgeBlue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.35rem 0.75rem',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'rgba(24, 78, 121, 0.1)',
    color: 'var(--c-blue)',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  badgePurple: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.35rem 0.75rem',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'rgba(90, 65, 120, 0.1)',
    color: 'var(--c-purple)',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  tabNav: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
    marginTop: '2rem',
    gap: '1rem',
  },
  tabBtn: {
    padding: '0.75rem 1rem',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
  },
  activeTabBtn: {
    padding: '0.75rem 1rem',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid var(--c-blue)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    color: 'var(--c-blue)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  tableCard: {
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden' as const,
    boxShadow: 'var(--shadow-md)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
    fontSize: '0.95rem',
  },
  th: {
    padding: '1rem 1.5rem',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
    transition: 'background 0.2s',
  },
  td: {
    padding: '1rem 1.5rem',
  },
  emptyTd: {
    padding: '3rem',
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
  },
  attendanceSettingsCard: {
    padding: '1.5rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
  },
  historyLayout: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '1.5rem',
    alignItems: 'start',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    }
  },
  historySidebar: {
    padding: '1.25rem',
    borderRadius: 'var(--radius-lg)',
    minHeight: '300px',
  },
  classBtn: {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    transition: 'all 0.2s',
  },
  selectedClassBtn: {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(24, 78, 121, 0.1)',
    border: '1px solid var(--c-blue)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontFamily: 'var(--font-sans)',
    color: 'var(--c-blue)',
    transition: 'all 0.2s',
  },
  historyDetail: {
    padding: '1.5rem',
    borderRadius: 'var(--radius-lg)',
    minHeight: '300px',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalContent: {
    width: '100%',
    maxWidth: '500px',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    boxShadow: 'var(--shadow-xl)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
    textAlign: 'left' as const,
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '0.5rem',
  }
};
