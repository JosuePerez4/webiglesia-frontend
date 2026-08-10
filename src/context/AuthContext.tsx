import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Usuario } from '../types';
import { api, AuthError, setAuthToken, clearAuthToken } from '../services/api';
import { AuthContext } from './authContextObject';

const SESSION_KEY = 'iglesia_session';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(() => !!localStorage.getItem(SESSION_KEY));

  const login = useCallback((user: Usuario) => {
    setUsuario(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    if (user.token) {
      setAuthToken(user.token);
    }
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    localStorage.removeItem(SESSION_KEY);
    clearAuthToken();
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    if (!usuario?.id || !usuario.token) return;

    if (isTokenExpired(usuario.token)) {
      const t = setTimeout(logout, 0);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 3000);

    api.getUsuarioRoles(usuario.id)
      .then((fresh) => {
        if (cancelled) return;
        clearTimeout(timeout);
        if (!fresh.activo) {
          logout();
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        clearTimeout(timeout);
        if (err instanceof AuthError) {
          logout();
        } else {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [usuario?.id, usuario?.token, logout]);

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
