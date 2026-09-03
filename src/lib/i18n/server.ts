import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config';
import { en, type Dictionary } from './dictionaries/en';
import { hi } from './dictionaries/hi';

const DICTIONARIES: Record<Locale, Dictionary> = { en, hi };

/**
 * The locale lives in a cookie rather than in the URL. That keeps every route
 * exactly where it is — no /en and /hi segments, no rewrite of every link —
 * at the cost of per-language URLs, which matters for search engines and would
 * be the reason to move to routed locales later.
 */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<Dictionary> {
  return DICTIONARIES[await getLocale()];
}
