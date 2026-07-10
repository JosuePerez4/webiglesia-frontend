import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import styles from './DataTable.module.css';

export interface DataTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  /** Rendered as the bold header of the mobile card instead of a labeled field. */
  primary?: boolean;
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
  if (rows.length === 0) {
    return (
      <div className={`glass ${styles.wrapper}`}>
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  const primaryCol = columns.find((c) => c.primary) ?? columns[0];
  const secondaryCols = columns.filter((c) => c !== primaryCol);

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
        {rows.map((row) => (
          <div className={styles.card} key={rowKey(row)}>
            <div className={styles.cardHeader}>{primaryCol.render(row)}</div>
            {secondaryCols.map((col) => (
              <div className={styles.cardField} key={col.header}>
                <span className={styles.cardFieldLabel}>{col.header}</span>
                <span>{col.render(row)}</span>
              </div>
            ))}
            {actions && <div className={styles.actions}>{actions(row)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
