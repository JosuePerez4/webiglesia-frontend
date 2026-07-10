import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { homeForRole } from './roleHome';
import { Login } from '../features/auth/Login';
import { AdminLayout } from '../features/admin/AdminLayout';
import { GruposTab } from '../features/admin/GruposTab';
import { ProfesoresTab } from '../features/admin/ProfesoresTab';
import { EstudiantesTab } from '../features/admin/EstudiantesTab';
import { GrupoEditScreen } from '../features/admin/GrupoEditScreen';
import { ProfesorLayout } from '../features/profesor/ProfesorLayout';
import { GruposList } from '../features/profesor/GruposList';
import { GrupoDetail } from '../features/profesor/GrupoDetail';
import { StudentPlaceholder } from '../features/estudiante/StudentPlaceholder';

function LoginRoute() {
  const { usuario } = useAuth();
  if (usuario) return <Navigate to={homeForRole(usuario.rol)} replace />;
  return <Login />;
}

function RootRedirect() {
  const { usuario } = useAuth();
  return <Navigate to={usuario ? homeForRole(usuario.rol) : '/login'} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="grupos" replace />} />
          <Route path="grupos" element={<GruposTab />} />
          <Route path="profesores" element={<ProfesoresTab />} />
          <Route path="estudiantes" element={<EstudiantesTab />} />
        </Route>
        <Route path="grupos/nuevo" element={<GrupoEditScreen />} />
        <Route path="grupos/:id/editar" element={<GrupoEditScreen />} />
      </Route>

      <Route path="/profesor" element={<ProtectedRoute allowedRoles={['PROFESOR']} />}>
        <Route element={<ProfesorLayout />}>
          <Route index element={<GruposList />} />
          <Route path="grupos/:id" element={<GrupoDetail />} />
        </Route>
      </Route>

      <Route path="/estudiante" element={<ProtectedRoute allowedRoles={['ESTUDIANTE']} />}>
        <Route index element={<StudentPlaceholder />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
