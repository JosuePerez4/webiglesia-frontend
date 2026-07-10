import styles from './Avatar.module.css';

const PALETTE = ['var(--c-blue)', 'var(--c-purple)', 'var(--c-gold)', 'var(--c-red)', '#0d9488', '#7c3aed'];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${styles[size]}`}
      style={{ backgroundColor: colorForName(name) }}
      aria-hidden="true"
    >
      {initialsForName(name)}
    </span>
  );
}
