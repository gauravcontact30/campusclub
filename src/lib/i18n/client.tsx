'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from './config';
import type { Dictionary } from './dictionaries/en';

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
