'use client';

import { Moon, Sun } from 'lucide-react';
import { applyTheme, currentTheme } from '@/lib/theme';

/**
 * Which icon and which label show is decided by CSS from `data-theme` on
 * <html> (see globals.css), not by React state. That is what keeps the server
 * and client markup identical: there is nothing here to hydrate, so no
 * mismatch is possible and the button is correct on the very first paint.
 */
export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => applyTheme(currentTheme() === 'light' ? 'dark' : 'light')}
      className={
        className ??
        'inline-flex h-10 w-10 items-center justify-center rounded-full border border-content/20 text-content transition-colors hover:border-content/50'
      }
    >
      <Sun size={16} aria-hidden className="when-dark" />
      <Moon size={16} aria-hidden className="when-light" />
      <span className="sr-only when-dark">Switch to light theme</span>
      <span className="sr-only when-light">Switch to dark theme</span>
    </button>
  );
}
