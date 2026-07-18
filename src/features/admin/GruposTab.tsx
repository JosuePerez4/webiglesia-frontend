import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BookOpen, Edit2, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/useToast';
import { SearchInput } from '../../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Grupo } from '../../types';
import type { AdminOutletContext } from './AdminLayout';
import styles from './GruposTab.module.css';

export function GruposTab() {
  const { grupos, refetchGrupos } = useOutletContext<AdminOutletContext>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [grupoToDelete, setGrupoToDelete] = useState<Grupo | null>(null);

  const filtered = grupos.filter((g) => g.nombre.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async () => {
    if (!grupoToDelete) return;
    try {
      await api.eliminarGrupo(grupoToDelete.id);
      showToast('Grupo eliminado correctamente');
      refetchGrupos();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar el grupo', 'error');
    } finally {
      setGrupoToDelete(null);
    }
  };

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
        onConfirm={handleDelete}
        onCancel={() => setGrupoToDelete(null)}
      />
    </div>
  );
}
