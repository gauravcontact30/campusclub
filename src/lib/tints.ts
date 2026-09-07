import type { CSSProperties } from 'react';

/**
 * The five accent hues the page paints with, outside the brand ramp.
 *
 * Each name resolves to a theme-aware pair in globals.css: `--tint-<name>` is
 * the pale plate a card or an icon sits on, `--tint-<name>-ink` is the mark
 * drawn on it. Both flip with light and dark, and neither follows
 * `data-palette` — the accents are the one part of the page that stays put
 * when somebody changes the brand colour, because their whole job is telling
 * one thing from another.
 *
 * Five because there are five main categories (`CATEGORY_GROUPS`), and every
 * place these are used paints one main category at a time.
 */
export const TINTS = ['indigo', 'amber', 'emerald', 'rose', 'cyan'] as const;

export type Tint = (typeof TINTS)[number];
/**
 * Publishes a tint as two CSS variables on an element, so everything inside it
 * can be styled with ordinary static Tailwind classes —
 * `bg-[rgb(var(--plate))]`, `text-[rgb(var(--mark)/0.25)]`.
 *
 * The indirection is load-bearing: a class name built as `bg-tint-${tint}`
 * would never survive the JIT, because Tailwind only ever sees the literal
 * source. The same string as a *value* is invisible to it and works fine.
 */
export function tintVars(tint: Tint): CSSProperties {
  return {
    '--plate': `var(--tint-${tint})`,
    '--mark': `var(--tint-${tint}-ink)`,
  } as CSSProperties;
}
