import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { qk } from '../services/queryKeys';

export function useGrupoDetail(grupoId: string | undefined) {
  const enabled = Boolean(grupoId);

  // Dos queries independientes en vez de un Promise.all: registrar asistencia
  // invalida solo las clases y no vuelve a pedir el grupo entero.
  const grupoQuery = useQuery({
    queryKey: qk.grupo(grupoId ?? ''),
    queryFn: () => api.getGrupo(grupoId!),
    enabled,
  });

  const clasesQuery = useQuery({
    queryKey: qk.clasesGrupo(grupoId ?? ''),
    queryFn: () => api.getClasesGrupo(grupoId!),
    enabled,
  });

  const refetch = useCallback(() => {
    return Promise.all([grupoQuery.refetch(), clasesQuery.refetch()]);
  }, [grupoQuery, clasesQuery]);

  const error = grupoQuery.error ?? clasesQuery.error;

  return {
    grupo: grupoQuery.data ?? null,
    clases: clasesQuery.data ?? [],
    loading: grupoQuery.isLoading || clasesQuery.isLoading,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar el grupo') : null,
    refetch,
  };
}
