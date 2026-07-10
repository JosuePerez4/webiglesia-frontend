import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Grupo } from '../types';

export function useGruposPorProfesor(profesorId: string | undefined) {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!profesorId) return;
    let cancelled = false;

    api
      .getGruposPorProfesor(profesorId)
      .then((data) => {
        if (cancelled) return;
        setGrupos(data);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar tus grupos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profesorId, reloadToken]);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return { grupos, loading, error, refetch };
}
