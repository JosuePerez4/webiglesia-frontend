import { useQuery } from '@tanstack/react-query';
import { api, type ActivoParam } from '../services/api';
import { qk } from '../services/queryKeys';

export function useProfesores(activo?: ActivoParam) {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: qk.profesores(activo),
    queryFn: () => api.getProfesores(activo),
    // Mantiene la tabla visible con los datos previos mientras llega el filtro nuevo.
    placeholderData: (prev) => prev,
  });

  return {
    profesores: data ?? [],
    loading: isPending,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar profesores') : null,
    refetch,
  };
}
