import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { EmptyState } from './EmptyState';
import styles from './DataTable.module.css';

export interface DataTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  /** Rendered as the bold header of the mobile card instead of a labeled field. */
  primary?: boolean;
  /** Rendered directly under the primary field on the mobile card, always visible —
   * every other secondary column collapses behind the "Ver más" toggle instead. */
  subtitle?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
  emptyIcon?: ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  actions,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: DataTableProps<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (rows.length === 0) {
    return (
      <div className={`glass ${styles.wrapper}`}>
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  const primaryCol = columns.find((c) => c.primary) ?? columns[0];
  const subtitleCol = columns.find((c) => c.subtitle && c !== primaryCol);
  const secondaryCols = columns.filter((c) => c !== primaryCol && c !== subtitleCol);

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className={`glass ${styles.wrapper}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.header}>{col.header}</th>
            ))}
            {actions && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.header}>{col.render(row)}</td>
              ))}
              {actions && (
                <td>
                  <div className={styles.actions}>{actions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.cards}>
        {rows.map((row) => {
          const key = rowKey(row);
          const isOpen = expanded.has(key);
          return (
            <div className={styles.card} key={key}>
              <div className={styles.cardHeader}>{primaryCol.render(row)}</div>
              {subtitleCol && <div className={styles.cardSubtitle}>{subtitleCol.render(row)}</div>}

              {secondaryCols.length > 0 && (
                <>
                  <button
                    type="button"
                    className={styles.cardToggle}
                    onClick={() => toggleExpanded(key)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? 'Ver menos' : 'Ver más'}
                    <ChevronDown size={16} className={`${styles.chevron}${isOpen ? ` ${styles.chevronOpen}` : ''}`} />
                  </button>

                  <div className={`${styles.cardDetails}${isOpen ? ` ${styles.cardDetailsOpen}` : ''}`}>
                    <div className={styles.cardDetailsInner}>
                      {secondaryCols.map((col) => (
                        <div className={styles.cardField} key={col.header}>
                          <span className={styles.cardFieldLabel}>{col.header}</span>
                          <span>{col.render(row)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {actions && <div className={styles.actions}>{actions(row)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
