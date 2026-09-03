'use client';

import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { applyTheme, currentTheme } from '@/lib/theme';
import { useLocale } from '@/lib/i18n/client';

/**
 * Which icon and which label show is decided by CSS from `data-theme` on
 * <html> (see globals.css), not by React state. That is what keeps the server
 * and client markup identical: there is nothing here to hydrate, so no
 * mismatch is possible and the button is correct on the very first paint.
 *
 * `showLabel` promotes the same text from screen-reader-only to visible, for
 * the mobile drawer where a bare icon would be the only unlabelled row.
 */
export function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={() => applyTheme(currentTheme() === 'light' ? 'dark' : 'light')}
      className={
        className ??
        'inline-flex h-10 w-10 items-center justify-center rounded-full border border-content/20 text-content transition-colors hover:border-content/50'
      }
    >
      <Sun size={showLabel ? 18 : 16} aria-hidden className="when-dark" />
      <Moon size={showLabel ? 18 : 16} aria-hidden className="when-light" />
      <span className={cn('when-dark', !showLabel && 'sr-only')}>{t.header.themeToLight}</span>
      <span className={cn('when-light', !showLabel && 'sr-only')}>{t.header.themeToDark}</span>
    </button>
  );
}
