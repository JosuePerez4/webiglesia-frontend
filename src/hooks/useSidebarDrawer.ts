import { useCallback, useEffect, useState } from 'react';

/**
 * Open/close state for the mobile off-canvas sidebar drawer (AdminSidebar/
 * ProfesorSidebar). Locks body scroll and closes on Escape while open —
 * both no-ops on desktop, where the sidebar ignores `open` and stays
 * always-visible via CSS (see the sidebar module's mobile media query).
 */
export function useSidebarDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return {
    open,
    toggle: useCallback(() => setOpen((o) => !o), []),
    close: useCallback(() => setOpen(false), []),
  };
}
