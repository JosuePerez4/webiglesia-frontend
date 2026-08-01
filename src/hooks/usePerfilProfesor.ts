import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { qk } from '../services/queryKeys';
import { useAuth } from '../context/useAuth';

export function usePerfilProfesor() {
  const { usuario } = useAuth();
  const id = usuario?.id;

  const { data, isPending, error } = useQuery({
    queryKey: qk.profesor(id ?? ''),
    queryFn: () => api.getProfesor(id!),
    enabled: Boolean(id),
  });

  return {
    profesor: data ?? null,
    loading: isPending,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar tu perfil') : null,
  };
}
