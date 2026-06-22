import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input id={inputId} className={cn(styles.input, error && styles.error, className)} {...props} />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
