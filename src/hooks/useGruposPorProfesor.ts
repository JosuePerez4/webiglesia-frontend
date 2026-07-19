import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { qk } from '../services/queryKeys';

export function useGruposPorProfesor(profesorId: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: qk.gruposPorProfesor(profesorId ?? ''),
    queryFn: () => api.getGruposPorProfesor(profesorId!),
    enabled: Boolean(profesorId),
  });

  return {
    grupos: data ?? [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar tus grupos') : null,
    refetch,
  };
}
