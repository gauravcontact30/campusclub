'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useTransition, type ReactNode } from 'react';
import { LOCALE_COOKIE, type Locale } from './config';
import type { Dictionary } from './dictionaries/en';

const ONE_YEAR = 60 * 60 * 24 * 365;

const LocaleContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

/**
 * Server components read the cookie directly; client components read it from
 * here. The dictionary is passed down from the root layout rather than fetched,
 * so a client component never renders in the wrong language on first paint.
 */
export function LocaleProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={{ locale, t: dictionary }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside <LocaleProvider>');
  return value;
}

/**
 * Switching language is a cookie write plus a re-render of the server tree —
 * the dictionary is resolved on the server, so nothing short of `router.refresh`
 * changes the words already on the page. `useTransition` keeps the current view
 * interactive across that round trip instead of blanking it, and `pending` lets
 * the control that triggered it say so.
 */
export function useSetLocale() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setLocale = useCallback(
    (target: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
      startTransition(() => router.refresh());
    },
    [router],
  );

  return { setLocale, pending };
}
