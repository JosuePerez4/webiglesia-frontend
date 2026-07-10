import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import styles from './Tabs.module.css';

interface TabItem {
  value: string;
  label: ReactNode;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  items: TabItem[];
  variant?: 'pill' | 'underline';
  children?: ReactNode;
}

export function Tabs({ value, onValueChange, items, variant = 'pill', children }: TabsProps) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange}>
      <RadixTabs.List className={`${styles.list}${variant === 'underline' ? ` ${styles.underline}` : ''}`}>
        {items.map((item) => (
          <RadixTabs.Trigger key={item.value} value={item.value} className={styles.trigger}>
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
}
