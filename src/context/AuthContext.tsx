import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Usuario } from '../types';
import { api } from '../services/api';
import { AuthContext } from './authContextObject';

const SESSION_KEY = 'iglesia_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((user: Usuario) => {
    setUsuario(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    localStorage.removeItem(SESSION_KEY);
    // La caché sobrevive al cierre de sesión: sin esto, el siguiente usuario
    // vería los datos del anterior hasta que revalide.
    queryClient.clear();
  }, [queryClient]);

  // Revalida la sesión guardada contra el backend: si la cuenta fue desactivada
  // mientras la app seguía abierta, se cierra la sesión automáticamente.
  useEffect(() => {
    if (!usuario?.id) return;
    let cancelled = false;

    api
      .getUsuario(usuario.id)
      .then((fresh) => {
        if (!cancelled && !fresh.activo) logout();
      })
      .catch(() => {
        // Backend inalcanzable u otra falla de red: no forzamos el cierre de sesión.
      });

    return () => {
      cancelled = true;
    };
  }, [usuario?.id, logout]);

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
