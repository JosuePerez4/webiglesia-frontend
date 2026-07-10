import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { PageHeader } from '../../components/ui/PageHeader';

export function ProfesorLayout() {
  const { logout } = useAuth();

  return (
    <>
      <PageHeader
        section="Portal Docente"
        actions={
          <button className="btn btn-secondary" onClick={logout} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Cerrar Sesión
          </button>
        }
      />
      <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
        <Outlet />
      </div>
    </>
  );
}
