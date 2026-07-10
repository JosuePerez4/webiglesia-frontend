import { createContext } from 'react';
import type { Usuario } from '../types';

export interface AuthContextValue {
  usuario: Usuario | null;
  login: (usuario: Usuario) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
