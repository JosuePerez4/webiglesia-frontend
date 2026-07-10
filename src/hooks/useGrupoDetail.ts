import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Clase, Grupo } from '../types';

export function useGrupoDetail(grupoId: string | undefined) {
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!grupoId) return;
    let cancelled = false;

    Promise.all([api.getGrupo(grupoId), api.getClasesGrupo(grupoId)])
      .then(([detail, hist]) => {
        if (cancelled) return;
        setGrupo(detail);
        setClases(hist);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar el grupo');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [grupoId, reloadToken]);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return { grupo, clases, loading, error, refetch };
}
