'use client';

import { cn } from '@/lib/utils';
import { PALETTES, applyPalette } from '@/lib/theme';
import { usePalette } from '@/hooks/use-palette';

/**
 * The drawer's palette control. A row of swatches rather than the header's
 * popover, because a menu inside a menu is a poor thing to operate with a
 * thumb — and because the header's popover would open behind the drawer.
 *
 * Selection comes from a subscription to <html>, so the row reflects a change
 * made anywhere — including from the header's picker — with no local state.
 */
export function PaletteRow() {
  const selected = usePalette();

  return (
    <div className="rounded-2xl border border-content/15 px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-content/50">Colour</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={selected === p.id}
            aria-label={p.name}
            onClick={() => applyPalette(p.id)}
            className={cn(
              'h-10 w-10 rounded-full border-2 transition-transform active:scale-95',
              selected === p.id ? 'border-content' : 'border-content/20',
            )}
            style={{ background: `linear-gradient(135deg, ${p.swatch[0]} 0 50%, ${p.swatch[1]} 50% 100%)` }}
          />
        ))}
      </div>
    </div>
  );
}
