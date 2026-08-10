import type { Rol } from '../../types';
import styles from './RoleSelector.module.css';

const ROLE_META: Record<Rol, { label: string; color: string }> = {
  ADMIN: { label: 'Admin', color: 'var(--c-blue)' },
  PROFESOR: { label: 'Profesor', color: 'var(--c-purple)' },
  ESTUDIANTE: { label: 'Estudiante', color: 'var(--c-red)' },
};

const ALL_ROLES: Rol[] = ['ADMIN', 'PROFESOR', 'ESTUDIANTE'];

interface RoleSelectorProps {
  value: Rol[];
  onChange: (roles: Rol[]) => void;
  disabled?: boolean;
}

export function RoleSelector({ value, onChange, disabled = false }: RoleSelectorProps) {
  const toggle = (rol: Rol) => {
    if (disabled) return;
    if (value.includes(rol)) {
      if (value.length === 1) return;
      onChange(value.filter((r) => r !== rol));
    } else {
      onChange([...value, rol]);
    }
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Roles</span>
      <div className={styles.chips}>
        {ALL_ROLES.map((rol) => {
          const meta = ROLE_META[rol];
          const active = value.includes(rol);
          return (
            <button
              key={rol}
              type="button"
              className={`${styles.chip}${active ? ` ${styles.chipActive}` : ''}`}
              style={{
                '--chip-color': meta.color,
              } as React.CSSProperties}
              onClick={() => toggle(rol)}
              disabled={disabled || (active && value.length === 1)}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
