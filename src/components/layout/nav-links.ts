import type { Dictionary } from '@/lib/i18n/dictionaries/en';

/**
 * The label is a dictionary key rather than a string, so adding a language
 * never means editing this file — and a key that stops existing is a type error.
 */
export const NAV_LINKS = [
  { href: '/businesses', key: 'businesses' },
  { href: '/dinners', key: 'dinners' },
  { href: '/how-it-works', key: 'howItWorks' },
  { href: '/pricing', key: 'pricing' },
] as const satisfies readonly { href: string; key: keyof Dictionary['nav'] }[];
