import type { ReactNode } from 'react';
import { Church } from 'lucide-react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  section?: string;
  actions?: ReactNode;
}

export function PageHeader({ section, actions }: PageHeaderProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>
            <Church size={20} color="white" />
          </span>
          <div className={styles.brandText}>
            <span className={styles.brandName}>WebIglesia</span>
            {section && <span className={styles.section}>{section}</span>}
          </div>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
