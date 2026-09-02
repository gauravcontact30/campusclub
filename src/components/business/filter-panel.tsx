'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES, CITIES, SORT_OPTIONS } from '@/lib/constants';
import type { BusinessQuery, PriceLevel } from '@/types';
import { cn, priceLabel } from '@/lib/utils';

export interface FilterPanelProps {
  query: BusinessQuery;
  total: number;
  onChange: <K extends keyof BusinessQuery>(key: K, value: BusinessQuery[K]) => void;
  onTogglePrice: (level: PriceLevel) => void;
  onReset: () => void;
}

export function FilterPanel({ query, total, onChange, onTogglePrice, onReset }: FilterPanelProps) {
  // Price tiers follow the currency of whichever city is being filtered.
  const activeCityName = CITIES.find((c) => c.slug === query.city)?.name;

  const activeCount =
    (query.category ? 1 : 0) +
    (query.city ? 1 : 0) +
    (query.price?.length ? 1 : 0) +
    (query.minRating ? 1 : 0) +
    (query.openNow ? 1 : 0);

  return (
    <aside className="surface-card h-fit p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <SlidersHorizontal size={18} className="text-flame" />
          Filters
        </h2>
        {activeCount > 0 && (
          <button onClick={onReset} className="inline-flex items-center gap-1 text-xs font-semibold text-flame-700">
            <X size={13} /> Clear ({activeCount})
          </button>
        )}
      </div>

      <p className="mt-1 text-xs text-ink/50">{total} places match</p>

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-ink/50">City</h3>
          <select
            value={query.city ?? ''}
            onChange={(e) => onChange('city', e.target.value)}
            className="mt-2 w-full rounded-2xl border border-ink/15 bg-cream px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
          >
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-ink/50">Category</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => onChange('category', query.category === c.slug ? '' : c.slug)}
                aria-pressed={query.category === c.slug}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  query.category === c.slug
                    ? 'border-ink bg-ink text-cream'
                    : 'border-ink/15 text-ink/70 hover:border-ink/40',
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-ink/50">Price</h3>
          <div className="mt-2 flex gap-1.5">
            {([1, 2, 3, 4] as PriceLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => onTogglePrice(level)}
                aria-pressed={query.price?.includes(level)}
                className={cn(
                  'flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors',
                  query.price?.includes(level)
                    ? 'border-flame bg-flame/10 text-flame-700'
                    : 'border-ink/15 text-ink/60 hover:border-ink/40',
                )}
              >
                {priceLabel(level, activeCityName)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-ink/50">Minimum rating</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[0, 3, 3.5, 4, 4.5].map((rating) => (
              <button
                key={rating}
                onClick={() => onChange('minRating', rating)}
                aria-pressed={query.minRating === rating}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  (query.minRating ?? 0) === rating
                    ? 'border-ink bg-ink text-cream'
                    : 'border-ink/15 text-ink/70 hover:border-ink/40',
                )}
              >
                {rating === 0 ? 'Any' : `${rating}+`}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-ink/15 px-4 py-3">
          <span className="text-sm font-medium">Open now</span>
          <input
            type="checkbox"
            checked={Boolean(query.openNow)}
            onChange={(e) => onChange('openNow', e.target.checked)}
            className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-ink/20 transition-colors checked:bg-flame relative after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-cream after:transition-transform checked:after:translate-x-4"
          />
        </label>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-ink/50">Sort by</h3>
          <select
            value={query.sort ?? 'recommended'}
            onChange={(e) => onChange('sort', e.target.value as BusinessQuery['sort'])}
            className="mt-2 w-full rounded-2xl border border-ink/15 bg-cream px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}
