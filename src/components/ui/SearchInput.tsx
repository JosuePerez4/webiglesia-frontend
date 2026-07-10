import { Search } from 'lucide-react';
import styles from './SearchInput.module.css';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className={styles.container}>
      <Search size={18} className={styles.icon} />
      <input
        type="text"
        placeholder={placeholder}
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
