'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Closes a popover when a pointer lands outside it or Escape is pressed.
 *
 * The listeners are only attached while the popover is open — a menu that is
 * shut has no business paying for a document-wide `mousedown` handler, and the
 * header had three hand-rolled copies of this effect before it moved here.
 */
export function useDismissable(open: boolean, ref: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, ref, close]);
}
