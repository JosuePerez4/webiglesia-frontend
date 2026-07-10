import { useAuth } from '../../context/useAuth';

export function StudentPlaceholder() {
  const { usuario, logout } = useAuth();

  return (
    <div className="container animate-fade-in" style={{ textAlign: 'center', marginTop: '5rem' }}>
      <div className="glass" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ color: 'var(--c-blue)' }}>¡Hola, {usuario?.nombreusuario}!</h1>
        <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>
          El portal para estudiantes se encuentra actualmente en mantenimiento. Por favor, contacta al administrador de
          la iglesia para más información.
        </p>
        <button className="btn btn-secondary" onClick={logout}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
