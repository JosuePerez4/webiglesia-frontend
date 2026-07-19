import { useQuery } from '@tanstack/react-query';
import { api, type ActivoParam } from '../services/api';
import { qk } from '../services/queryKeys';

export function useEstudiantes(query?: string, activo?: ActivoParam) {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: qk.estudiantes(activo, query),
    queryFn: () => api.getEstudiantes(query, activo),
    // Mantiene la tabla visible con los datos previos mientras llega el filtro nuevo.
    placeholderData: (prev) => prev,
  });

  return {
    estudiantes: data ?? [],
    loading: isPending,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar estudiantes') : null,
    refetch,
  };
}
