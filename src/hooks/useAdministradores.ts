import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { qk } from '../services/queryKeys';

export function useAdministradores() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: qk.administradores(),
    queryFn: () => api.getAdministradores(),
  });

  return {
    administradores: data ?? [],
    loading: isPending,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar administradores') : null,
    refetch,
  };
}
