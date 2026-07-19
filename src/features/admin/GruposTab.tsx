import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Edit2, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { qkRoot } from '../../services/queryKeys';
import { useToast } from '../../components/ui/useToast';
import { useGrupos } from '../../hooks/useGrupos';
import { SearchInput } from '../../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Grupo } from '../../types';
import styles from './GruposTab.module.css';

export function GruposTab() {
  const { grupos } = useGrupos();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [grupoToDelete, setGrupoToDelete] = useState<Grupo | null>(null);

  const filtered = grupos.filter((g) => g.nombre.toLowerCase().includes(search.toLowerCase()));

  const eliminar = useMutation({
    mutationFn: (grupoId: string) => api.eliminarGrupo(grupoId),
    onSuccess: async () => {
      // Borrar un grupo deja a sus estudiantes sin grupoId/nombreGrupo.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qkRoot.grupos }),
        queryClient.invalidateQueries({ queryKey: qkRoot.estudiantes }),
      ]);
      showToast('Grupo eliminado correctamente');
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Error al eliminar el grupo', 'error'),
    onSettled: () => setGrupoToDelete(null),
  });

  const columns: DataTableColumn<Grupo>[] = [
    {
      header: 'Nombre del Grupo',
      primary: true,
      render: (g) => <strong>{g.nombre}</strong>,
    },
    {
      header: 'Profesores Asignados',
      render: (g) =>
        g.profesores && g.profesores.length > 0 ? (
          g.profesores.map((p) => `${p.nombre} ${p.apellido}`).join(', ')
        ) : (
          <span className={styles.mutedText}>Sin asignar</span>
        ),
    },
    {
      header: 'Estudiantes Inscritos',
      render: (g) => <Badge tone="neutral">{g.estudianteIds?.length || 0}</Badge>,
    },
  ];

  return (
    <div>
      <div className={styles.toolbar}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar grupos..." />
        <button className="btn btn-primary" onClick={() => navigate('/admin/grupos/nuevo')}>
          <Plus size={18} /> Crear Grupo
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(g) => g.id}
        emptyIcon={<BookOpen size={40} />}
        emptyTitle="No se encontraron grupos"
        emptyDescription="Crea un nuevo grupo para empezar a gestionar clases y asistencia."
        actions={(g) => (
          <>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => navigate(`/admin/grupos/${g.id}/editar`)}>
              <Edit2 size={14} /> Editar
            </button>
            <button className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setGrupoToDelete(g)}>
              <Trash2 size={14} /> Eliminar
            </button>
          </>
        )}
      />

      <ConfirmDialog
        open={grupoToDelete !== null}
        title="Eliminar Grupo"
        description={`¿Estás seguro de que deseas eliminar el grupo "${grupoToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (grupoToDelete) eliminar.mutate(grupoToDelete.id);
        }}
        onCancel={() => setGrupoToDelete(null)}
      />
    </div>
  );
}
