import type { Rol } from '../types';

export function homeForRole(rol: Rol): string {
  if (rol === 'ADMIN') return '/admin';
  if (rol === 'PROFESOR') return '/profesor';
  return '/estudiante';
}
