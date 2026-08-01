import { useCallback, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { ToastContext, type ToastContextValue } from './toastContextObject';
import styles from './Toast.module.css';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
  leaving?: boolean;
}

let nextId = 1;

/** Matches the .leaving exit animation duration in Toast.module.css — the
 * unmount is delayed by this long so the exit animation gets to finish. */
const EXIT_MS = 200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_MS);
  }, []);

  const showToast = useCallback<ToastContextValue['showToast']>((message, type = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.viewport}>
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}${t.leaving ? ` ${styles.leaving}` : ''}`}>
            {t.type === 'success' ? (
              <CheckCircle2 size={20} color="var(--success)" />
            ) : (
              <XCircle size={20} color="var(--danger)" />
            )}
            <span className={styles.message}>{t.message}</span>
            <button className={styles.close} onClick={() => dismiss(t.id)} aria-label="Cerrar notificación">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
