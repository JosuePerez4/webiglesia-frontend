import type { Usuario, Profesor, Estudiante, Grupo, Clase } from '../types';

const API_BASE_URL = 'http://localhost:8080';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!res.ok) {
    throw new Error(`Error en el servidor backend: Código de respuesta ${res.status}`);
  }
  
  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }
  
  return await res.json();
}

// API Functions connecting strictly to Backend
export const api = {
  login: (username: string, contrasena: string) => 
    request<Usuario>('/usuarios/login', {
      method: 'POST',
      body: JSON.stringify({ nombreusuario: username, contrasena })
    }),

  // Estudiantes
  getEstudiantes: (query?: string) => 
    request<Estudiante[]>(`/estudiantes${query ? `?query=${encodeURIComponent(query)}` : ''}`),

  getEstudiante: (id: string) => 
    request<Estudiante>(`/estudiantes/${id}`),

  crearEstudiante: (estudiante: Partial<Estudiante>) => 
    request<Estudiante>('/estudiantes', {
      method: 'POST',
      body: JSON.stringify(estudiante)
    }),

  editarEstudiante: (id: string, estudiante: Partial<Estudiante>) => 
    request<Estudiante>(`/estudiantes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(estudiante)
    }),

  // Profesores
  crearProfesor: (profesor: Partial<Profesor>) => 
    request<Profesor>('/profesores', {
      method: 'POST',
      body: JSON.stringify(profesor)
    }),

  editarProfesor: (id: string, profesor: Partial<Profesor>) => 
    request<Profesor>(`/profesores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profesor)
    }),

  getProfesores: () =>
    request<Profesor[]>('/profesores'),

  // Grupos
  getGrupos: () => 
    request<Grupo[]>('/grupos'),

  getGrupo: (id: string) => 
    request<Grupo>(`/grupos/${id}`),

  crearGrupo: (grupo: { nombre: string; profesorIds: string[]; estudianteIds: string[]; forzarCambioGrupo?: boolean }) => 
    request<Grupo>('/grupos', {
      method: 'POST',
      body: JSON.stringify(grupo)
    }),

  editarGrupo: (id: string, grupo: { nombre: string; profesorIds: string[]; estudianteIds: string[]; forzarCambioGrupo?: boolean }) => 
    request<Grupo>(`/grupos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(grupo)
    }),

  eliminarGrupo: (id: string) => 
    request<void>(`/grupos/${id}`, {
      method: 'DELETE'
    }),

  // Asistencia / Clases
  registrarAsistencia: (grupoId: string, fecha: string, asistencias: { estudianteId: string; presente: boolean }[]) => 
    request<Clase>(`/grupos/${grupoId}/clases`, {
      method: 'POST',
      body: JSON.stringify({ fecha, asistencias })
    }),

  getClasesGrupo: (grupoId: string) => 
    request<Clase[]>(`/grupos/${grupoId}/clases`),

  getClase: (id: string) => 
    request<Clase>(`/clases/${id}`)
};
