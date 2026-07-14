import { useEffect } from 'react';

/** Calls `onEscape` when the user presses Escape while `active` — used to make
 * modals (which are plain fixed-position divs, not native <dialog>) closable
 * the way users expect. */
export function useEscapeKey(active: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onEscape]);
}
