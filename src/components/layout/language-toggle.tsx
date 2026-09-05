'use client';

import { Check, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/config';
import { useLocale, useSetLocale } from '@/lib/i18n/client';

/**
 * The drawer's language control. Two languages, so this is a direct toggle
 * rather than a menu — one tap gets you to the other one, and the button shows
 * the language you are *in*. The header's version is the segmented pair inside
 * the preferences panel, where both fit side by side.
 */
export function LanguageToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { locale, t } = useLocale();
  const { setLocale, pending } = useSetLocale();

  const next: Locale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={`${t.header.languageLabel} — ${LOCALE_LABELS[next].name}`}
      data-pending={pending ? '' : undefined}
      className={cn(
        className ??
          'inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-content/20 px-3 text-content transition-colors hover:border-content/50',
        pending && 'opacity-60',
      )}
    >
      <Languages size={16} aria-hidden />
      {showLabel ? (
        <span className="flex-1 text-left">
          {t.header.languageHeading} · {LOCALE_LABELS[locale].name}
        </span>
      ) : (
        <span className="text-xs font-semibold">{LOCALE_LABELS[locale].short}</span>
      )}
      {showLabel && <Check size={15} className="shrink-0 opacity-0" aria-hidden />}
    </button>
  );
}
