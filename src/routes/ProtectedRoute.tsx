import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import type { Rol } from '../types';
import { homeForRole } from './roleHome';

interface ProtectedRouteProps {
  allowedRoles?: Rol[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(usuario.rolActivo)) {
    return <Navigate to={homeForRole(usuario.rolActivo)} replace />;
  }

  return <Outlet />;
}
