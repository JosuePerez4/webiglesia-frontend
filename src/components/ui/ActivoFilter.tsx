import styles from './ActivoFilter.module.css';
import type { ActivoFilterValue } from './activoFilterValue';

interface ActivoFilterProps {
  value: ActivoFilterValue;
  onChange: (value: ActivoFilterValue) => void;
}

const OPTIONS: { value: ActivoFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

export function ActivoFilter({ value, onChange }: ActivoFilterProps) {
  return (
    <div className={styles.group}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`${styles.btn} ${value === opt.value ? styles.active : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
