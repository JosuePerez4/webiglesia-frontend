import type { ActivoParam } from './api';

/**
 * Fábrica única de claves de caché. Las claves son jerárquicas a propósito:
 * invalidar `['grupos']` alcanza también `['grupos', id]` y `['grupos', id, 'clases']`,
 * y invalidar `['estudiantes']` alcanza todas las variantes de filtro cacheadas.
 */
export const qk = {
  estudiantes: (activo?: ActivoParam, query?: string) => ['estudiantes', { activo, query }] as const,
  profesores: (activo?: ActivoParam) => ['profesores', { activo }] as const,
  grupos: () => ['grupos'] as const,
  grupo: (id: string) => ['grupos', id] as const,
  clasesGrupo: (grupoId: string) => ['grupos', grupoId, 'clases'] as const,
  gruposPorProfesor: (profesorId: string) => ['profesores', profesorId, 'grupos'] as const,
};

/** Prefijos para invalidación por colección completa. */
export const qkRoot = {
  estudiantes: ['estudiantes'] as const,
  profesores: ['profesores'] as const,
  grupos: ['grupos'] as const,
};
