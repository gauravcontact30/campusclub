'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * Reads a value that only exists on the client (anything depending on the
 * visitor's clock or locale) without a hydration mismatch and without a
 * setState-in-effect. Returns `null` during SSR and the first paint.
 *
 * `compute` must return a primitive: React compares snapshots with Object.is,
 * so a fresh object each call would loop.
 */
export function useClientValue<T extends string | number | boolean | null>(compute: () => T): T | null {
  return useSyncExternalStore(subscribe, compute, () => null);
}
