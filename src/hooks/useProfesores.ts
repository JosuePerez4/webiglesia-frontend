import { useCallback, useEffect, useState } from 'react';
import { api, type ActivoParam } from '../services/api';
import type { Profesor } from '../types';

export function useProfesores(activo?: ActivoParam) {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    api
      .getProfesores(activo)
      .then((data) => {
        if (cancelled) return;
        setProfesores(data);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar profesores');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activo, reloadToken]);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return { profesores, loading, error, refetch };
}
