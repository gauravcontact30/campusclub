'use client';

import { useEffect, useRef, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Runs `onSettle` once a value has stopped changing — used where the effect of
 * typing is a navigation rather than a piece of state, so debouncing to a value
 * and then reacting to it would fire on mount and on every re-render of the
 * callback.
 *
 * The callback is held in a ref so a fresh closure each render does not restart
 * the timer, and `sent` remembers what was last acted on so returning to the
 * previous value still counts as a change.
 */
export function useDebouncedChange<T>(value: T, delay: number, onSettle: (value: T) => void) {
  const settle = useRef(onSettle);
  const sent = useRef(value);

  useEffect(() => {
    settle.current = onSettle;
  });

  useEffect(() => {
    if (Object.is(value, sent.current)) return;
    const id = setTimeout(() => {
      sent.current = value;
      settle.current(value);
    }, delay);
    return () => clearTimeout(id);
  }, [value, delay]);
}
