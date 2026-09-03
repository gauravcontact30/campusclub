'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Level, MeetupQuery, MeetupSort, WhenFilter } from '@/types';
import { CATEGORIES, CITIES, FEE_PRESETS, LEVELS, SORT_OPTIONS, WHEN_OPTIONS } from '@/lib/constants';
import { activeFilterCount, toSearchParams } from '@/lib/query-string';
import { cn, formatMoney } from '@/lib/utils';
import { useDebouncedChange } from '@/hooks/use-debounce';
import { CategoryIcon } from '@/components/ui/category-icon';
import { Button } from '@/components/ui/button';

/**
 * Filters live in the URL, not in component state — so a filtered board is a
 * link somebody can send, the back button behaves, and the server renders the
 * same result the client asked for.
 */
export function FilterBar({ query, resultCount }: { query: MeetupQuery; resultCount: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [term, setTerm] = useState(query.term ?? '');
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const push = useMemo(
    () => (patch: Partial<MeetupQuery>) => {
      const next = { ...query, ...patch, page: 1 };
      router.push(`/meetups?${toSearchParams(next)}`, { scroll: false });
    },
    [query, router],
  );

  // Typing pushes a new URL, so it is debounced — one navigation per pause,
  // not one per keystroke.
  useDebouncedChange(term, 350, (value) => {
    if ((query.term ?? '') !== value) push({ term: value });
  });

  const count = activeFilterCount(query);
  const hasLocation = Boolean(query.near);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        push({
          near: { lat: position.coords.latitude, lng: position.coords.longitude },
          sort: 'nearest',
        });
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[15rem] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-content/45"
            aria-hidden
          />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            type="search"
            aria-label="Search meetups"
            placeholder="Search meetups, venues, areas…"
            className="w-full rounded-full border border-content/15 bg-canvas-700 py-3 pl-11 pr-4 text-sm text-content placeholder:text-content/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-full border border-content/20 px-4 py-3 text-sm font-semibold text-content transition-colors hover:border-content/45"
        >
          <SlidersHorizontal size={15} />
          Filters
          {count > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[0.68rem] font-bold text-on-brand">
              {count}
            </span>
          )}
        </button>

        <label className="sr-only" htmlFor="sort">
          Sort meetups
        </label>
        <select
          id="sort"
          value={query.sort ?? 'soonest'}
          onChange={(e) => push({ sort: e.target.value as MeetupSort })}
          className="rounded-full border border-content/20 bg-canvas-700 px-4 py-3 text-sm font-semibold text-content focus:border-brand focus:outline-none"
        >
          {SORT_OPTIONS.filter((o) => !('needsLocation' in o && o.needsLocation) || hasLocation).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* The when-chips are the filter people actually reach for, so they sit
          out in the open rather than behind the Filters panel. */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {WHEN_OPTIONS.map((option) => {
          const active = (query.when ?? 'any') === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => push({ when: option.value as WhenFilter })}
              aria-pressed={active}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-brand bg-brand text-on-brand'
                  : 'border-content/15 text-content/75 hover:border-content/40 hover:text-content',
              )}
            >
              {option.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={useMyLocation}
          className={cn(
            'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            hasLocation
              ? 'border-signal bg-signal/15 text-signal-600'
              : 'border-content/15 text-content/75 hover:border-content/40 hover:text-content',
          )}
        >
          {locating ? 'Finding you…' : hasLocation ? 'Near me ✓' : 'Near me'}
        </button>
      </div>

      {open && (
        <div className="surface-card animate-fade-up space-y-6 p-6">
          <FilterGroup label="What">
            <Chip active={!query.category} onClick={() => push({ category: '' })}>
              Everything
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.slug} active={query.category === c.slug} onClick={() => push({ category: c.slug })}>
                <CategoryIcon slug={c.slug} size={14} />
                {c.name}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="Where">
            <Chip active={!query.city} onClick={() => push({ city: '' })}>
              Any city
            </Chip>
            {CITIES.map((c) => (
              <Chip key={c.slug} active={query.city === c.slug} onClick={() => push({ city: c.slug })}>
                {c.name}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="How demanding">
            {LEVELS.map((l) => (
              <Chip
                key={l.value}
                active={(query.level ?? 'any') === l.value}
                onClick={() => push({ level: l.value as Level })}
              >
                {l.label}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="Join fee up to">
            <Chip active={!query.maxFeeCents} onClick={() => push({ maxFeeCents: undefined })}>
              Any
            </Chip>
            {FEE_PRESETS.map((fee) => (
              <Chip key={fee} active={query.maxFeeCents === fee} onClick={() => push({ maxFeeCents: fee })}>
                {formatMoney(fee)}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="Availability">
            <Chip active={Boolean(query.hasSpots)} onClick={() => push({ hasSpots: !query.hasSpots })}>
              Hide full meetups
            </Chip>
          </FilterGroup>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-content/10 pt-4">
            <p className="text-sm text-content/60">
              {resultCount} {resultCount === 1 ? 'meetup' : 'meetups'} match
            </p>
            <div className="flex gap-2">
              {count > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/meetups', { scroll: false })}
                  className="text-content"
                >
                  <X size={14} /> Clear all
                </Button>
              )}
              <Button size="sm" onClick={() => setOpen(false)}>
                Show results
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Params the panel does not expose still show as removable chips, so a
          shared link never leaves someone with a filter they cannot see. */}
      {params.get('term') && (
        <button
          type="button"
          onClick={() => {
            setTerm('');
            push({ term: '' });
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-content/20 px-3 py-1.5 text-xs font-medium text-content/70"
        >
          “{params.get('term')}” <X size={12} />
        </button>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-xs font-bold uppercase tracking-[0.16em] text-content/50">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-brand bg-brand/15 text-brand-700'
          : 'border-content/15 text-content/75 hover:border-content/40 hover:text-content',
      )}
    >
      {children}
    </button>
  );
}
