import { Church, Menu } from 'lucide-react';
import styles from './MobileTopBar.module.css';

interface MobileTopBarProps {
  subtitle: string;
  onMenuClick: () => void;
}

/** Sticky top bar shown only <=720px (see MobileTopBar.module.css) — the
 * entry point for opening the off-canvas sidebar drawer on mobile. */
export function MobileTopBar({ subtitle, onMenuClick }: MobileTopBarProps) {
  return (
    <div className={styles.bar}>
      <button type="button" className={styles.menuBtn} onClick={onMenuClick} aria-label="Abrir menú">
        <Menu size={22} />
      </button>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>
          <Church size={14} />
        </span>
        <div>
          <div className={styles.brandName}>WebIglesia</div>
          <div className={styles.brandSub}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}
