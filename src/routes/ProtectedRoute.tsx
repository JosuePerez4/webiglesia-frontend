import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import type { Usuario } from '../types';
import { homeForRole } from './roleHome';

interface ProtectedRouteProps {
  allowedRoles?: Usuario['rol'][];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(usuario.rol)) {
    return <Navigate to={homeForRole(usuario.rol)} replace />;
  }

  return <Outlet />;
}
