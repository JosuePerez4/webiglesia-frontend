import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import modalStyles from './Modal.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={(o) => !o && onCancel()} title={title}>
      <div className={modalStyles.form}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={22} color="var(--c-red)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{description}</p>
        </div>
        <div className={modalStyles.footer}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
