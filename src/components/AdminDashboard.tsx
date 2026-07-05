import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Grupo, Profesor, Estudiante } from '../types';
import { 
  Users, BookOpen, GraduationCap, Search, Plus, 
  Edit2, Trash2, X 
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'grupos' | 'profesores' | 'estudiantes'>('grupos');
  
  // Data lists
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);

  // Search queries
  const [searchQuery, setSearchQuery] = useState('');

  // Modals visibility
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isProfesorModalOpen, setIsProfesorModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Edit targets
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [editingProfesor, setEditingProfesor] = useState<Profesor | null>(null);
  const [editingEstudiante, setEditingEstudiante] = useState<Estudiante | null>(null);

  // Form states
  const [grupoForm, setGrupoForm] = useState({
    nombre: '',
    profesorIds: [] as string[],
    estudianteIds: [] as string[]
  });

  const [profesorForm, setProfesorForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    fechaDeNacimiento: '',
    correo: ''
  });

  const [studentForm, setStudentForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    fechaDeNacimiento: '',
    correo: '',
    grupoId: '' as string
  });

  // Loading all data
  const loadData = async () => {
    try {
      const g = await api.getGrupos();
      setGrupos(g);
      
      const p = await api.getProfesores();
      setProfesores(p);
      
      const e = await api.getEstudiantes();
      setEstudiantes(e);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // GROUP Form actions
  const handleOpenGroupModal = (grupo?: Grupo) => {
    if (grupo) {
      setEditingGrupo(grupo);
      setGrupoForm({
        nombre: grupo.nombre,
        profesorIds: grupo.profesorIds || [],
        estudianteIds: grupo.estudianteIds || []
      });
    } else {
      setEditingGrupo(null);
      setGrupoForm({
        nombre: '',
        profesorIds: [],
        estudianteIds: []
      });
    }
    setIsGroupModalOpen(true);
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grupoForm.nombre.trim()) return;

    try {
      if (editingGrupo) {
        await api.editarGrupo(editingGrupo.id, {
          nombre: grupoForm.nombre,
          profesorIds: grupoForm.profesorIds,
          estudianteIds: grupoForm.estudianteIds,
          forzarCambioGrupo: true
        });
      } else {
        await api.crearGrupo({
          nombre: grupoForm.nombre,
          profesorIds: grupoForm.profesorIds,
          estudianteIds: grupoForm.estudianteIds,
          forzarCambioGrupo: true
        });
      }
      setIsGroupModalOpen(false);
      loadData();
    } catch (err) {
      alert('Error al guardar grupo');
    }
  };

  const handleDeleteGrupo = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este grupo?')) {
      try {
        await api.eliminarGrupo(id);
        loadData();
      } catch (err) {
        alert('Error al eliminar grupo');
      }
    }
  };

  // PROFESOR Form actions
  const handleOpenProfesorModal = (profesor?: Profesor) => {
    if (profesor) {
      setEditingProfesor(profesor);
      setProfesorForm({
        nombre: profesor.nombre,
        apellido: profesor.apellido,
        telefono: profesor.telefono || '',
        fechaDeNacimiento: profesor.fechaDeNacimiento || '',
        correo: profesor.correo || ''
      });
    } else {
      setEditingProfesor(null);
      setProfesorForm({
        nombre: '',
        apellido: '',
        telefono: '',
        fechaDeNacimiento: '',
        correo: ''
      });
    }
    setIsProfesorModalOpen(true);
  };

  const handleProfesorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profesorForm.nombre.trim()) return;

    try {
      if (editingProfesor) {
        await api.editarProfesor(editingProfesor.id, profesorForm);
      } else {
        await api.crearProfesor(profesorForm);
      }
      setIsProfesorModalOpen(false);
      loadData();
    } catch (err) {
      alert('Error al guardar profesor');
    }
  };

  // STUDENT Form actions
  const handleOpenStudentModal = (student?: Estudiante) => {
    if (student) {
      setEditingEstudiante(student);
      setStudentForm({
        nombre: student.nombre,
        apellido: student.apellido,
        telefono: student.telefono || '',
        fechaDeNacimiento: student.fechaDeNacimiento || '',
        correo: student.correo || '',
        grupoId: student.grupoId || ''
      });
    } else {
      setEditingEstudiante(null);
      setStudentForm({
        nombre: '',
        apellido: '',
        telefono: '',
        fechaDeNacimiento: '',
        correo: '',
        grupoId: ''
      });
    }
    setIsStudentModalOpen(true);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.nombre.trim()) return;

    try {
      if (editingEstudiante) {
        const updated = await api.editarEstudiante(editingEstudiante.id, {
          nombre: studentForm.nombre,
          apellido: studentForm.apellido,
          telefono: studentForm.telefono,
          fechaDeNacimiento: studentForm.fechaDeNacimiento,
          correo: studentForm.correo
        });

        // Handle group assignment change if needed
        if (studentForm.grupoId !== (editingEstudiante.grupoId || '')) {
          // If assigned to a new group, we need to update that group's student list
          if (studentForm.grupoId) {
            const grp = grupos.find(g => g.id === studentForm.grupoId);
            if (grp) {
              const currentIds = grp.estudianteIds || [];
              if (!currentIds.includes(updated.id)) {
                await api.editarGrupo(grp.id, {
                  nombre: grp.nombre,
                  profesorIds: grp.profesorIds || [],
                  estudianteIds: [...currentIds, updated.id]
                });
              }
            }
          }
        }
      } else {
        const created = await api.crearEstudiante({
          nombre: studentForm.nombre,
          apellido: studentForm.apellido,
          telefono: studentForm.telefono,
          fechaDeNacimiento: studentForm.fechaDeNacimiento,
          correo: studentForm.correo
        });

        // Add to group list if group selected
        if (studentForm.grupoId) {
          const grp = grupos.find(g => g.id === studentForm.grupoId);
          if (grp) {
            await api.editarGrupo(grp.id, {
              nombre: grp.nombre,
              profesorIds: grp.profesorIds || [],
              estudianteIds: [...(grp.estudianteIds || []), created.id]
            });
          }
        }
      }
      setIsStudentModalOpen(false);
      loadData();
    } catch (err) {
      alert('Error al guardar estudiante');
    }
  };

  // Filters based on search
  const filteredGrupos = grupos.filter(g => 
    g.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProfesores = profesores.filter(p => 
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.correo && p.correo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredEstudiantes = estudiantes.filter(e => 
    `${e.nombre} ${e.apellido}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.nombreGrupo && e.nombreGrupo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* Top Header */}
      <header style={styles.topHeader}>
        <div>
          <h2 style={styles.brandTitle}>WebIglesia — Panel de Administración</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Control Global del Sistema</p>
        </div>
        <button className="btn btn-secondary" onClick={onLogout} style={styles.logoutBtn}>
          Cerrar Sesión
        </button>
      </header>

      {/* Main Admin Overview Cards */}
      <div style={styles.adminStatsRow}>
        <div className="glass card" style={styles.statCard}>
          <BookOpen size={24} color="var(--c-blue)" />
          <div>
            <span style={styles.statVal}>{grupos.length}</span>
            <span style={styles.statLbl}>Grupos/Cursos</span>
          </div>
        </div>
        <div className="glass card" style={styles.statCard}>
          <GraduationCap size={24} color="var(--c-purple)" />
          <div>
            <span style={styles.statVal}>{profesores.length}</span>
            <span style={styles.statLbl}>Profesores</span>
          </div>
        </div>
        <div className="glass card" style={styles.statCard}>
          <Users size={24} color="var(--c-gold)" />
          <div>
            <span style={styles.statVal}>{estudiantes.length}</span>
            <span style={styles.statLbl}>Estudiantes</span>
          </div>
        </div>
      </div>

      {/* Section controller & search bar */}
      <div className="glass" style={styles.controlPanel}>
        <div style={styles.tabNav}>
          <button 
            onClick={() => { setActiveTab('grupos'); setSearchQuery(''); }}
            style={activeTab === 'grupos' ? styles.activeTabBtn : styles.tabBtn}
          >
            <BookOpen size={16} /> Grupos
          </button>
          <button 
            onClick={() => { setActiveTab('profesores'); setSearchQuery(''); }}
            style={activeTab === 'profesores' ? styles.activeTabBtn : styles.tabBtn}
          >
            <GraduationCap size={16} /> Profesores
          </button>
          <button 
            onClick={() => { setActiveTab('estudiantes'); setSearchQuery(''); }}
            style={activeTab === 'estudiantes' ? styles.activeTabBtn : styles.tabBtn}
          >
            <Users size={16} /> Estudiantes
          </button>
        </div>

        <div style={styles.searchAndAction}>
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder={`Buscar en ${activeTab}...`} 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {activeTab === 'grupos' && (
            <button className="btn btn-primary" onClick={() => handleOpenGroupModal()}>
              <Plus size={18} /> Crear Grupo
            </button>
          )}
          {activeTab === 'profesores' && (
            <button className="btn btn-primary" onClick={() => handleOpenProfesorModal()}>
              <Plus size={18} /> Crear Profesor
            </button>
          )}
          {activeTab === 'estudiantes' && (
            <button className="btn btn-primary" onClick={() => handleOpenStudentModal()}>
              <Plus size={18} /> Crear Estudiante
            </button>
          )}
        </div>
      </div>

      {/* TAB TABLES */}
      <div className="glass" style={styles.tableWrapper}>
        
        {/* GRUPOS TABLE */}
        {activeTab === 'grupos' && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre del Grupo</th>
                <th style={styles.th}>Profesores Asignados</th>
                <th style={styles.th}>Estudiantes Inscritos</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrupos.length > 0 ? (
                filteredGrupos.map(g => (
                  <tr key={g.id} style={styles.tr}>
                    <td style={styles.td}><strong>{g.nombre}</strong></td>
                    <td style={styles.td}>
                      {g.profesores && g.profesores.length > 0 ? (
                        g.profesores.map(p => `${p.nombre} ${p.apellido}`).join(', ')
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span className="badge" style={styles.badgeCount}>{g.estudianteIds?.length || 0}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionCell}>
                        <button className="btn btn-secondary" style={styles.actionBtn} onClick={() => handleOpenGroupModal(g)}>
                          <Edit2 size={14} /> Editar
                        </button>
                        <button className="btn btn-danger" style={styles.actionBtn} onClick={() => handleDeleteGrupo(g.id)}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={styles.emptyTd}>No se encontraron grupos.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* PROFESORES TABLE */}
        {activeTab === 'profesores' && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre Completo</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Correo Electrónico</th>
                <th style={styles.th}>Fecha Nacimiento</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfesores.length > 0 ? (
                filteredProfesores.map(p => (
                  <tr key={p.id} style={styles.tr}>
                    <td style={styles.td}><strong>{p.nombre} {p.apellido}</strong></td>
                    <td style={styles.td}>{p.telefono || '—'}</td>
                    <td style={styles.td}>{p.correo || '—'}</td>
                    <td style={styles.td}>{p.fechaDeNacimiento || '—'}</td>
                    <td style={styles.td}>
                      <div style={styles.actionCell}>
                        <button className="btn btn-secondary" style={styles.actionBtn} onClick={() => handleOpenProfesorModal(p)}>
                          <Edit2 size={14} /> Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={styles.emptyTd}>No se encontraron profesores.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* ESTUDIANTES TABLE */}
        {activeTab === 'estudiantes' && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre Completo</th>
                <th style={styles.th}>Grupo Asignado</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Correo Electrónico</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEstudiantes.length > 0 ? (
                filteredEstudiantes.map(e => (
                  <tr key={e.id} style={styles.tr}>
                    <td style={styles.td}><strong>{e.nombre} {e.apellido}</strong></td>
                    <td style={styles.td}>
                      {e.nombreGrupo ? (
                        <span style={styles.badgeGroup}>{e.nombreGrupo}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Sin Grupo</span>
                      )}
                    </td>
                    <td style={styles.td}>{e.telefono || '—'}</td>
                    <td style={styles.td}>{e.correo || '—'}</td>
                    <td style={styles.td}>
                      <div style={styles.actionCell}>
                        <button className="btn btn-secondary" style={styles.actionBtn} onClick={() => handleOpenStudentModal(e)}>
                          <Edit2 size={14} /> Asignar / Editar
                        </button>
                      </div>
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
        )}
      </div>

      {/* GROUP MODAL */}
      {isGroupModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>{editingGrupo ? 'Editar Grupo' : 'Nuevo Grupo'}</h2>
              <button onClick={() => setIsGroupModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleGroupSubmit} style={styles.modalForm}>
              <div>
                <label htmlFor="grpName">Nombre del Grupo</label>
                <input 
                  id="grpName"
                  type="text" 
                  required 
                  value={grupoForm.nombre}
                  onChange={(e) => setGrupoForm({ ...grupoForm, nombre: e.target.value })}
                />
              </div>

              <div>
                <label>Seleccionar Profesor(es)</label>
                <div style={styles.checkboxSelectBox}>
                  {profesores.map(p => (
                    <label key={p.id} style={styles.checkboxItemLabel}>
                      <input 
                        type="checkbox"
                        checked={grupoForm.profesorIds.includes(p.id)}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setGrupoForm(prev => ({
                            ...prev,
                            profesorIds: val 
                              ? [...prev.profesorIds, p.id] 
                              : prev.profesorIds.filter(id => id !== p.id)
                          }));
                        }}
                      />
                      <span>{p.nombre} {p.apellido}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label>Seleccionar Estudiantes</label>
                <div style={styles.checkboxSelectBox}>
                  {estudiantes.map(est => (
                    <label key={est.id} style={styles.checkboxItemLabel}>
                      <input 
                        type="checkbox"
                        checked={grupoForm.estudianteIds.includes(est.id)}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setGrupoForm(prev => ({
                            ...prev,
                            estudianteIds: val 
                              ? [...prev.estudianteIds, est.id] 
                              : prev.estudianteIds.filter(id => id !== est.id)
                          }));
                        }}
                      />
                      <span>{est.nombre} {est.apellido} {est.nombreGrupo ? `(${est.nombreGrupo})` : ''}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsGroupModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROFESOR MODAL */}
      {isProfesorModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>{editingProfesor ? 'Editar Profesor' : 'Nuevo Profesor'}</h2>
              <button onClick={() => setIsProfesorModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleProfesorSubmit} style={styles.modalForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="pfName">Nombre</label>
                  <input 
                    id="pfName"
                    type="text" 
                    required 
                    value={profesorForm.nombre}
                    onChange={(e) => setProfesorForm({ ...profesorForm, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="pfSurname">Apellido</label>
                  <input 
                    id="pfSurname"
                    type="text" 
                    required 
                    value={profesorForm.apellido}
                    onChange={(e) => setProfesorForm({ ...profesorForm, apellido: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pfPhone">Teléfono</label>
                <input 
                  id="pfPhone"
                  type="tel" 
                  value={profesorForm.telefono}
                  onChange={(e) => setProfesorForm({ ...profesorForm, telefono: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="pfBirth">Fecha de Nacimiento</label>
                <input 
                  id="pfBirth"
                  type="date" 
                  value={profesorForm.fechaDeNacimiento}
                  onChange={(e) => setProfesorForm({ ...profesorForm, fechaDeNacimiento: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="pfEmail">Correo Electrónico</label>
                <input 
                  id="pfEmail"
                  type="email" 
                  value={profesorForm.correo}
                  onChange={(e) => setProfesorForm({ ...profesorForm, correo: e.target.value })}
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsProfesorModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Profesor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT MODAL */}
      {isStudentModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>{editingEstudiante ? 'Asignar / Editar Estudiante' : 'Nuevo Estudiante'}</h2>
              <button onClick={() => setIsStudentModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStudentSubmit} style={styles.modalForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="stdAdmName">Nombre</label>
                  <input 
                    id="stdAdmName"
                    type="text" 
                    required 
                    value={studentForm.nombre}
                    onChange={(e) => setStudentForm({ ...studentForm, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="stdAdmSurname">Apellido</label>
                  <input 
                    id="stdAdmSurname"
                    type="text" 
                    required 
                    value={studentForm.apellido}
                    onChange={(e) => setStudentForm({ ...studentForm, apellido: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="stdAdmPhone">Teléfono</label>
                <input 
                  id="stdAdmPhone"
                  type="tel" 
                  value={studentForm.telefono}
                  onChange={(e) => setStudentForm({ ...studentForm, telefono: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="stdAdmGroup">Asignar a Grupo</label>
                <select 
                  id="stdAdmGroup"
                  value={studentForm.grupoId} 
                  onChange={(e) => setStudentForm({ ...studentForm, grupoId: e.target.value })}
                >
                  <option value="">-- Sin Grupo (Disponible) --</option>
                  {grupos.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="stdAdmEmail">Correo Electrónico</label>
                <input 
                  id="stdAdmEmail"
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
                  Guardar Estudiante
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
  adminStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    padding: '1.5rem',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  statVal: {
    display: 'block',
    fontSize: '1.75rem',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    lineHeight: 1.1,
  },
  statLbl: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  controlPanel: {
    padding: '1.25rem 2rem',
    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
    borderBottom: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '1.5rem',
  },
  tabNav: {
    display: 'flex',
    gap: '0.75rem',
  },
  tabBtn: {
    padding: '0.6rem 1.25rem',
    background: 'none',
    border: 'none',
    borderRadius: 'var(--radius-md)',
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
    padding: '0.6rem 1.25rem',
    background: 'rgba(24, 78, 121, 0.1)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    color: 'var(--c-blue)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
  },
  searchAndAction: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  tableWrapper: {
    borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
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
  actionCell: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionBtn: {
    padding: '0.35rem 0.75rem',
    fontSize: '0.8rem',
  },
  badgeCount: {
    display: 'inline-block',
    padding: '0.15rem 0.6rem',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--border-color)',
    color: 'var(--text-primary)',
    fontWeight: 'bold',
    fontSize: '0.8rem',
  },
  badgeGroup: {
    display: 'inline-block',
    padding: '0.2rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(90, 65, 120, 0.1)',
    color: 'var(--c-purple)',
    fontWeight: 600,
    fontSize: '0.8rem',
  },
  checkboxSelectBox: {
    maxHeight: '150px',
    overflowY: 'auto' as const,
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '0.5rem',
    backgroundColor: 'var(--bg-secondary)',
  },
  checkboxItemLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.35rem 0.5rem',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.9rem',
    marginBottom: 0,
    '&:hover': {
      backgroundColor: 'var(--border-color)',
    }
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
