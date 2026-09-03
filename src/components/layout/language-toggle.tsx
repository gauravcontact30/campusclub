'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Check, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, type Locale } from '@/lib/i18n/config';
import { useLocale } from '@/lib/i18n/client';

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Two languages, so this is a direct toggle rather than a menu — one tap gets
 * you to the other one, and the button shows the language you are *in*.
 *
 * The locale is read by server components, so switching it means writing the
 * cookie and asking the router to re-render the tree. `useTransition` keeps the
 * current page interactive while that round trip happens instead of blanking it.
 */
export function LanguageToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const next: Locale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];

  const switchTo = (target: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={() => switchTo(next)}
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
