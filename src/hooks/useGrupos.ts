import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { qk } from '../services/queryKeys';

export function useGrupos() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: qk.grupos(),
    queryFn: () => api.getGrupos(),
  });

  return {
    grupos: data ?? [],
    loading: isPending,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar grupos') : null,
    refetch,
  };
}
