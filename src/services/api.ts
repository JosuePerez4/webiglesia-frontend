import type { Usuario, Profesor, Estudiante, Grupo, Clase, Administrador, Rol } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TOKEN_KEY = 'iglesia_token';

interface BackendErrorBody {
  message?: string;
  errors?: Record<string, string>;
}

export class AuthError extends Error {
  constructor() {
    super('Sesión expirada');
    this.name = 'AuthError';
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    console.warn(`[API 401] ${options?.method ?? 'GET'} ${path} — token presente: ${!!token}`);
    localStorage.removeItem(TOKEN_KEY);
    throw new AuthError();
  }

  if (!res.ok) {
    let message = `Error en el servidor backend: código de respuesta ${res.status}`;
    try {
      const body: BackendErrorBody = await res.json();
      if (body.message) {
        message = body.message;
        const fieldErrors = body.errors ? Object.values(body.errors) : [];
        if (fieldErrors.length > 0) {
          message += `: ${fieldErrors.join(', ')}`;
        }
      }
    } catch {
      // El cuerpo no es JSON (p. ej. un 404 vacío) — se mantiene el mensaje genérico.
    }
    throw new Error(message);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return await res.json();
}

/** El backend acepta boolean para filtrar activos/inactivos, o 'all' para no filtrar. */
export type ActivoParam = boolean | 'all';

function activoQueryValue(activo?: ActivoParam): string | undefined {
  if (activo === undefined) return undefined;
  return String(activo);
}

// API Functions connecting strictly to Backend
interface BackendLoginResponse {
  id: string;
  username: string;
  rolesDisponibles: Rol[];
  rolActivo: Rol;
  activo: boolean;
  token: string;
}

export const api = {
  login: (username: string, contrasena: string, rol?: Rol) =>
    request<BackendLoginResponse>('/usuarios/login', {
      method: 'POST',
      body: JSON.stringify({ nombreusuario: username, contrasena, rol })
    }).then((res): Usuario => {
      try {
        const payload = JSON.parse(atob(res.token.split('.')[1]));
        console.log('[JWT] roles en token:', payload.roles, '| rolActivo:', res.rolActivo);
      } catch { /* ignore */ }
      return {
        id: res.id,
        nombreusuario: res.username,
        roles: res.rolesDisponibles,
        rolActivo: res.rolActivo,
        activo: res.activo,
        token: res.token,
      };
    }),

  // Usuarios
  getUsuario: (id: string) =>
    request<Usuario>(`/usuarios/${id}`),

  cambiarEstadoUsuario: (id: string, activo: boolean) =>
    request<Usuario>(`/usuarios/cambiar-estado/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo })
    }),

  editarUsuario: (id: string, data: { nombreusuario: string; contrasena?: string }) =>
    request<Usuario>(`/usuarios/editar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  asignarRoles: (usuarioId: string, roles: Rol[]) =>
    request<void>(`/usuarios/${usuarioId}/roles`, {
      method: 'PATCH',
      body: JSON.stringify({ roles })
    }),

  getUsuarioRoles: (id: string) =>
    request<Usuario>(`/usuarios/${id}`),

  // Administradores
  getAdministradores: () =>
    request<Administrador[]>('/administradores'),

  crearAdministrador: (admin: Omit<Administrador, 'id' | 'activo'> & { contrasena: string }) =>
    request<Administrador>('/administradores', {
      method: 'POST',
      body: JSON.stringify(admin)
    }),

  // Estudiantes
  getEstudiantes: (query?: string, activo?: ActivoParam) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    const activoValue = activoQueryValue(activo);
    if (activoValue !== undefined) params.set('activo', activoValue);
    const qs = params.toString();
    return request<Estudiante[]>(`/estudiantes${qs ? `?${qs}` : ''}`);
  },

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

  getProfesor: (id: string) =>
    request<Profesor>(`/profesores/${id}`),

  getProfesores: (activo?: ActivoParam) => {
    const activoValue = activoQueryValue(activo);
    return request<Profesor[]>(`/profesores${activoValue !== undefined ? `?activo=${activoValue}` : ''}`);
  },

  getGruposPorProfesor: (profesorId: string) =>
    request<Grupo[]>(`/profesores/${profesorId}/grupos`),

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
