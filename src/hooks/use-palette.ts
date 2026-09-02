'use client';

import { useSyncExternalStore } from 'react';
import { currentPalette, subscribePalette, type PaletteId } from '@/lib/theme';

/**
 * The selected palette, or `null` until hydration.
 *
 * The choice only exists on the client, so there is no honest value to render
 * on the server. `useSyncExternalStore` is given a server snapshot of `null`,
 * which means the list paints with nothing marked and then resolves — never a
 * mismatch, and never a wrong item shown as selected.
 */
export function usePalette(): PaletteId | null {
  return useSyncExternalStore(subscribePalette, currentPalette, () => null);
}
