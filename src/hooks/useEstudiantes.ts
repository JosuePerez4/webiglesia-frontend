import { useCallback, useEffect, useState } from 'react';
import { api, type ActivoParam } from '../services/api';
import type { Estudiante } from '../types';

export function useEstudiantes(query?: string, activo?: ActivoParam) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    api
      .getEstudiantes(query, activo)
      .then((data) => {
        if (cancelled) return;
        setEstudiantes(data);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar estudiantes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, activo, reloadToken]);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return { estudiantes, loading, error, refetch };
}
