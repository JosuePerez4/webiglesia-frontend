import { useState } from 'react';
import { Login } from './components/Login';
import { ProfesorDashboard } from './components/ProfesorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import type { Usuario } from './types';
import './App.css';

function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    // Optional check if there is an active session in local storage
    const saved = localStorage.getItem('iglesia_session');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (user: Usuario) => {
    setUsuario(user);
    localStorage.setItem('iglesia_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('iglesia_session');
  };

  return (
    <>
      {!usuario ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : usuario.rol === 'ADMIN' ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : usuario.rol === 'PROFESOR' ? (
        // Map user username to teacher seed profiles
        <ProfesorDashboard 
          profesorId={usuario.nombreusuario === 'profesor2' ? 'p2' : 'p1'} 
          onLogout={handleLogout} 
        />
      ) : (
        // Fallback or student view if they ever log in
        <div className="container animate-fade-in" style={{ textAlign: 'center', marginTop: '5rem' }}>
          <div className="glass" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)' }}>
            <h1 style={{ color: 'var(--c-blue)' }}>¡Hola, {usuario.nombreusuario}!</h1>
            <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>
              El portal para estudiantes se encuentra actualmente en mantenimiento. 
              Por favor, contacta al administrador de la iglesia para más información.
            </p>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
