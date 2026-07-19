import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import modalStyles from './Modal.module.css';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  /** Deshabilita ambos botones mientras la acción está en vuelo. */
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  danger = true,
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={(o) => !o && onCancel()} title={title}>
      <div className={modalStyles.form}>
        <div className={styles.confirmContent}>
          <AlertTriangle size={22} color="var(--c-red)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <p className={styles.confirmText}>{description}</p>
        </div>
        <div className={modalStyles.footer}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={confirming}>
            Cancelar
          </button>
          <button
            type="button"
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
