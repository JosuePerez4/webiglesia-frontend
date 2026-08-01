import { useEffect } from 'react';

/**
 * Toggles the shared dark palette (src/styles/staffDarkTheme.css) on
 * document.body for as long as the calling layout is mounted. Body-level,
 * not a wrapper class, because Radix Dialog/Toast portal to document.body.
 */
export function useStaffDarkTheme() {
  useEffect(() => {
    document.body.classList.add('staff-dark-theme');
    return () => {
      document.body.classList.remove('staff-dark-theme');
    };
  }, []);
}
