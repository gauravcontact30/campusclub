'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PALETTES, applyPalette } from '@/lib/theme';
import { usePalette } from '@/hooks/use-palette';
import { useLocale } from '@/lib/i18n/client';

/**
 * The palette a visitor picked is only known on the client, so `usePalette`
 * hands back `null` until hydration: the list paints with nothing marked and
 * then resolves, rather than guessing and correcting itself.
 */
export function ThemePicker({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const selected = usePalette();
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t.header.paletteLabel}
        className={cn(
          'h-10 w-10 items-center justify-center rounded-full border border-content/20 text-content transition-colors hover:border-content/50',
          className ?? 'inline-flex',
        )}
      >
        <Palette size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 animate-fade-up overflow-hidden rounded-2xl border border-content/10 bg-canvas-700 shadow-lift"
        >
          <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-content/50">
            {t.header.paletteHeading}
          </p>
          {/* Nine palettes overrun a short viewport, so the list scrolls
              inside the menu rather than the menu running off the screen. */}
          <div className="max-h-[min(28rem,60vh)] overflow-y-auto p-2 pt-1">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected === p.id}
                onClick={() => applyPalette(p.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-content/10"
              >
                <Swatch colors={p.swatch} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-content">{p.name}</span>
                  <span className="block truncate text-xs text-content/55">{p.blurb}</span>
                </span>
                <Check size={15} className={cn('shrink-0 text-brand', selected === p.id ? 'opacity-100' : 'opacity-0')} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Literal hexes on purpose: a swatch has to show its own palette, not the active one. */
function Swatch({ colors }: { colors: [string, string] }) {
  return (
    <span
      aria-hidden
      className="h-7 w-7 shrink-0 rounded-full border border-content/20"
      style={{ background: `linear-gradient(135deg, ${colors[0]} 0 50%, ${colors[1]} 50% 100%)` }}
    />
  );
}
