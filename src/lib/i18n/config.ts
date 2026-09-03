export const LOCALES = ['en', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'vibeclub-locale';

/** Each language named in itself — never "Hindi" written in English. */
export const LOCALE_LABELS: Record<Locale, { name: string; short: string }> = {
  en: { name: 'English', short: 'EN' },
  hi: { name: 'हिन्दी', short: 'हि' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
