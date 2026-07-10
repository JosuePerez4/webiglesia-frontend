import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ open, onOpenChange, title, children, wide }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay}>
          <Dialog.Content className={`${styles.content}${wide ? ` ${styles.wide}` : ''}`}>
            <div className={styles.header}>
              <Dialog.Title asChild>
                <h2>{title}</h2>
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className={styles.closeBtn} aria-label="Cerrar">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
