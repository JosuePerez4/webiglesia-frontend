import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Avatar } from './Avatar';
import { SearchInput } from './SearchInput';
import styles from './PersonPickerList.module.css';

export interface PickablePerson {
  id: string;
  nombre: string;
  apellido: string;
  meta?: string;
}

interface PersonPickerListProps {
  title: string;
  people: PickablePerson[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  searchPlaceholder?: string;
}

export function PersonPickerList({
  title,
  people,
  selectedIds,
  onChange,
  searchPlaceholder = 'Buscar...',
}: PersonPickerListProps) {
  const [search, setSearch] = useState('');

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedPeople = useMemo(
    () => people.filter((p) => selectedSet.has(p.id)),
    [people, selectedSet]
  );

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => `${p.nombre} ${p.apellido}`.toLowerCase().includes(q));
  }, [people, search]);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className={styles.picker}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {title} ({selectedPeople.length})
        </h3>
        <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} />
      </div>

      {selectedPeople.length > 0 && (
        <div className={styles.chips}>
          {selectedPeople.map((p) => (
            <span className={styles.chip} key={p.id}>
              {p.nombre} {p.apellido}
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => toggle(p.id)}
                aria-label={`Quitar a ${p.nombre} ${p.apellido}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className={styles.list}>
        {filteredPeople.length === 0 ? (
          <div className={styles.emptyResult}>No se encontraron resultados.</div>
        ) : (
          filteredPeople.map((p) => {
            const isSelected = selectedSet.has(p.id);
            return (
              <div className={styles.item} key={p.id} onClick={() => toggle(p.id)}>
                <Avatar name={`${p.nombre} ${p.apellido}`} size="sm" />
                <div>
                  <div className={styles.itemName}>
                    {p.nombre} {p.apellido}
                  </div>
                  {p.meta && <div className={styles.itemMeta}>{p.meta}</div>}
                </div>
                {isSelected && <Check size={18} className={styles.itemCheck} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
