import type { ReactNode } from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  icon: ReactNode;
  colorClass?: string;
  value: number | string;
  label: string;
}

export function StatCard({ icon, colorClass = styles.iconBlue, value, label }: StatCardProps) {
  return (
    <div className={`glass card ${styles.statCard}`}>
      <div className={`${styles.icon} ${colorClass}`}>
        {icon}
      </div>
      <div>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
