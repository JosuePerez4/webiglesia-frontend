import { useContext } from 'react';
import { ToastContext } from './toastContextObject';

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de un ToastProvider');
  return ctx;
}
