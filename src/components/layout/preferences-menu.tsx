'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config';
import { useLocale, useSetLocale } from '@/lib/i18n/client';
import { PALETTES, applyPalette } from '@/lib/theme';
import { usePalette } from '@/hooks/use-palette';
import { useDismissable } from '@/hooks/use-dismissable';
import { ThemeToggle } from './theme-toggle';

/**
 * The three preferences the header used to spend three separate buttons on —
 * language, light/dark, and the colour palette — gathered into one panel.
 *
 * It is a panel rather than a menu of its own so the same markup can sit inside
 * the account menu for a signed-in visitor and inside this popover for everyone
 * else: one dropdown in the header either way, never four naked icon buttons.
 */
export function PreferencesPanel({ className }: { className?: string }) {
  const { locale, t } = useLocale();
  const { setLocale, pending } = useSetLocale();
  // Only the client knows the chosen palette, so this is `null` until
  // hydration: the row paints with nothing ringed and then resolves, rather
  // than guessing a selection and correcting itself a frame later.
  const selected = usePalette();

  return (
    <div className={cn('space-y-4 p-4', className)}>
      <section>
        <Heading>{t.header.languageHeading}</Heading>
        <div
          role="group"
          aria-label={t.header.languageLabel}
          className={cn(
            'mt-2 flex gap-1 rounded-full border border-content/10 bg-content/5 p-1 transition-opacity',
            pending && 'opacity-60',
          )}
        >
          {/* Each language named in itself, and both shown at once — with two
              of them a segmented control says which one you are in, where a
              toggle only says where it would take you. */}
          {LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={locale === option}
              onClick={() => setLocale(option)}
              className={cn(
                'flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                locale === option ? 'bg-canvas text-content shadow-card' : 'text-content/60 hover:text-content',
              )}
            >
              {LOCALE_LABELS[option].name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <Heading>{t.header.appearanceHeading}</Heading>
        <ThemeToggle
          showLabel
          className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-content/10 bg-content/5 px-3 py-2.5 text-sm font-medium text-content transition-colors hover:bg-content/10"
        />
      </section>

      <section>
        <Heading>{t.header.paletteHeading}</Heading>
        <div role="group" aria-label={t.header.paletteLabel} className="mt-2.5 flex flex-wrap gap-2">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="menuitemradio"
              aria-checked={selected === p.id}
              aria-label={p.name}
              title={`${p.name} — ${p.blurb}`}
              onClick={() => applyPalette(p.id)}
              className={cn(
                'h-8 w-8 rounded-full ring-offset-2 ring-offset-canvas-700 transition-transform hover:scale-110 active:scale-95',
                selected === p.id ? 'ring-2 ring-content' : 'ring-1 ring-content/20',
              )}
              /* Literal hexes on purpose: a swatch has to show its own palette,
                 not the active one. */
              style={{ background: `linear-gradient(135deg, ${p.swatch[0]} 0 50%, ${p.swatch[1]} 50% 100%)` }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-content/45">{children}</p>
  );
}

/** The header's preferences dropdown, for visitors with no account menu to hang it in. */
export function PreferencesMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  useDismissable(open, ref, useCallback(() => setOpen(false), []));

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t.header.preferencesLabel}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-content/15 text-content transition-colors hover:border-content/40 hover:bg-content/5"
      >
        <SlidersHorizontal size={16} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t.header.preferencesLabel}
          className="absolute right-0 z-50 mt-2 w-[17.5rem] animate-fade-up overflow-hidden rounded-2xl border border-content/10 bg-canvas-700 shadow-lift"
        >
          <PreferencesPanel />
        </div>
      )}
    </div>
  );
}
