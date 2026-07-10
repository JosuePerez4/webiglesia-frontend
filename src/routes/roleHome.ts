import type { Usuario } from '../types';

export function homeForRole(rol: Usuario['rol']): string {
  if (rol === 'ADMIN') return '/admin';
  if (rol === 'PROFESOR') return '/profesor';
  return '/estudiante';
}
