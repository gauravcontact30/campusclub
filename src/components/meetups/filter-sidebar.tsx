'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { Level, MeetupQuery, MeetupSort, WhenFilter } from '@/types';
import { CATEGORIES, CITIES, FEE_PRESETS, LEVELS, SORT_OPTIONS, WHEN_OPTIONS } from '@/lib/constants';
import { activeFilterCount, toSearchParams } from '@/lib/query-string';
import { cn, formatMoney } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/category-icon';
import { Button } from '@/components/ui/button';

/**
 * Filters as a persistent left rail on desktop and a collapsible panel below
 * `lg`. Every one of them is a URL change rather than component state, so a
 * filtered board is a link somebody can send and the back button behaves.
 *
 * They are radio-style throughout — one city, one activity, one time window.
 * Multi-select reads as more powerful and produces result sets nobody
 * predicted; a single choice per axis is what makes a dense list legible.
 */
export function FilterSidebar({ query, resultCount }: { query: MeetupQuery; resultCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [cityFilter, setCityFilter] = useState('');

  const visibleCities = useMemo(() => {
    const q = cityFilter.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter((c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q));
  }, [cityFilter]);

  const push = useMemo(
    () => (patch: Partial<MeetupQuery>) => {
      router.push(`/meetups?${toSearchParams({ ...query, ...patch, page: 1 })}`, { scroll: false });
    },
    [query, router],
  );

  const count = activeFilterCount(query);
  const hasLocation = Boolean(query.near);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        push({ near: { lat: position.coords.latitude, lng: position.coords.longitude }, sort: 'nearest' });
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }

  const panel = (
    <div className="space-y-7">
      <Group label="When">
        {WHEN_OPTIONS.map((option) => (
          <Row
            key={option.value}
            active={(query.when ?? 'any') === option.value}
            onClick={() => push({ when: option.value as WhenFilter })}
          >
            {option.label}
          </Row>
        ))}
      </Group>

      <Group label="Activity">
        <Row active={!query.category} onClick={() => push({ category: '' })}>
          Everything
        </Row>
        {CATEGORIES.map((c) => (
          <Row key={c.slug} active={query.category === c.slug} onClick={() => push({ category: c.slug })}>
            <CategoryIcon slug={c.slug} size={14} className="shrink-0 text-content/50" />
            {c.name}
          </Row>
        ))}
      </Group>

      <Group label="City">
        <Row active={!query.city} onClick={() => push({ city: '' })}>
          Any city
        </Row>
        {/* 44 cities do not fit as a flat list, so a search narrows it and a
            capped, scrollable list carries the rest — the same "one choice
            per axis" shape as every other filter, just with a way in. */}
        <input
          type="text"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          placeholder="Search cities…"
          className="mb-1 w-full rounded-lg border border-content/15 bg-transparent px-2.5 py-1.5 text-sm text-content placeholder:text-content/45 focus:border-brand/50 focus:outline-none"
        />
        <div className="max-h-52 overflow-y-auto pr-1">
          {visibleCities.length ? (
            visibleCities.map((c) => (
              <Row key={c.slug} active={query.city === c.slug} onClick={() => push({ city: c.slug })}>
                {c.name}
              </Row>
            ))
          ) : (
            <p className="px-2.5 py-1.5 text-sm text-content/50">No city matches “{cityFilter}”.</p>
          )}
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          className={cn(
            'mt-1 w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors',
            hasLocation
              ? 'border-signal/50 bg-signal/10 text-signal-600'
              : 'border-content/20 text-content/75 hover:border-content/40 hover:text-content',
          )}
        >
          {locating ? 'Finding you…' : hasLocation ? 'Using your location ✓' : 'Use my location'}
        </button>
      </Group>

      <Group label="Join fee">
        <Row active={!query.maxFeeCents} onClick={() => push({ maxFeeCents: undefined })}>
          Any fee
        </Row>
        {FEE_PRESETS.map((fee) => (
          <Row key={fee} active={query.maxFeeCents === fee} onClick={() => push({ maxFeeCents: fee })}>
            Up to {formatMoney(fee)}
          </Row>
        ))}
      </Group>

      <Group label="How demanding">
        {LEVELS.map((l) => (
          <Row
            key={l.value}
            active={(query.level ?? 'any') === l.value}
            onClick={() => push({ level: l.value as Level })}
          >
            {l.label}
          </Row>
        ))}
      </Group>

      <Group label="Availability">
        <Row active={Boolean(query.hasSpots)} onClick={() => push({ hasSpots: !query.hasSpots })}>
          Hide full meetups
        </Row>
      </Group>

      {count > 0 && (
        <Button
          variant="outline"
          size="sm"
          full
          onClick={() => router.push('/meetups', { scroll: false })}
        >
          <X size={14} /> Clear {count} {count === 1 ? 'filter' : 'filters'}
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Below lg the rail collapses to a button, and the sort control moves
          out of the panel so it stays reachable without opening anything. */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-full border border-content/20 px-4 py-2.5 text-sm font-semibold text-content transition-colors hover:border-content/45"
        >
          <SlidersHorizontal size={15} />
          Filters
          {count > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[0.68rem] font-bold text-on-brand">
              {count}
            </span>
          )}
        </button>
        <SortSelect query={query} onChange={push} hasLocation={hasLocation} />
      </div>

      {open && (
        <div className="mt-5 rounded-2xl border border-content/12 bg-canvas-700 p-5 lg:hidden">
          {panel}
          <Button full className="mt-6" onClick={() => setOpen(false)}>
            Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
          </Button>
        </div>
      )}

      <aside aria-label="Filters" className="hidden lg:block">
        {panel}
      </aside>
    </>
  );
}

export function SortSelect({
  query,
  onChange,
  hasLocation,
}: {
  query: MeetupQuery;
  onChange: (patch: Partial<MeetupQuery>) => void;
  hasLocation: boolean;
}) {
  return (
    <>
      <label className="sr-only" htmlFor="sort">
        Sort meetups
      </label>
      <select
        id="sort"
        value={query.sort ?? 'soonest'}
        onChange={(e) => onChange({ sort: e.target.value as MeetupSort })}
        className="cursor-pointer rounded-full border border-content/20 bg-canvas-700 px-4 py-2.5 text-sm font-semibold text-content focus:border-brand focus:outline-none"
      >
        {SORT_OPTIONS.filter((o) => !('needsLocation' in o && o.needsLocation) || hasLocation).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-content/45">{label}</legend>
      <div className="space-y-0.5">{children}</div>
    </fieldset>
  );
}

function Row({
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
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
        active ? 'bg-brand/12 font-semibold text-brand-700' : 'text-content/75 hover:bg-content/6 hover:text-content',
      )}
    >
      {children}
    </button>
  );
}
