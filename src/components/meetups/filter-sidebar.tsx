'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import type { Level, MeetupQuery, MeetupSort, WhenFilter } from '@/types';
import { CATEGORIES, CITIES, FEE_PRESETS, LEVELS, SORT_OPTIONS, WHEN_OPTIONS, categoryBySlug, cityBySlug } from '@/lib/constants';
import { activeFilterCount, toSearchParams } from '@/lib/query-string';
import { cn, formatMoney } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/category-icon';
import { categoryAccent } from '@/lib/media/covers';
import { Button } from '@/components/ui/button';

/**
 * Filters as a persistent left rail on desktop and a collapsible panel below
 * `lg`. Every one of them is a URL change rather than component state, so a
 * filtered board is a link somebody can send and the back button behaves.
 *
 * They are radio-style throughout — one city, one activity, one time window.
 * Multi-select reads as more powerful and produces result sets nobody
 * predicted; a single choice per axis is what makes a dense list legible.
 *
 * Everything short enough to fit is a wrapping chip row rather than a column
 * of full-width rows. Six fee presets stacked ran taller than the four results
 * they were filtering, which is the wrong way round: the filters should never
 * be the tallest thing on the page. The two long axes — 24 activities and 44
 * cities — collapse behind a header carrying the current choice, so the rail
 * opens at a height somebody can take in at once.
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

  /* What is currently applied, as removable chips. Reading the filters back is
     otherwise a matter of scanning five groups for whichever row is tinted. */
  const applied: { key: string; label: string; clear: Partial<MeetupQuery> }[] = [];
  if (query.category) {
    applied.push({
      key: 'category',
      label: categoryBySlug(query.category)?.name ?? query.category,
      clear: { category: '' },
    });
  }
  if (query.city) {
    applied.push({ key: 'city', label: cityBySlug(query.city)?.name ?? query.city, clear: { city: '' } });
  }
  if (query.when && query.when !== 'any') {
    applied.push({
      key: 'when',
      label: WHEN_OPTIONS.find((o) => o.value === query.when)?.label ?? query.when,
      clear: { when: 'any' as WhenFilter },
    });
  }
  if (query.maxFeeCents) {
    applied.push({ key: 'fee', label: `Up to ${formatMoney(query.maxFeeCents)}`, clear: { maxFeeCents: undefined } });
  }
  if (query.level && query.level !== 'any') {
    applied.push({
      key: 'level',
      label: LEVELS.find((l) => l.value === query.level)?.label ?? query.level,
      clear: { level: 'any' as Level },
    });
  }
  if (query.hasSpots) {
    applied.push({ key: 'spots', label: 'Has spots', clear: { hasSpots: false } });
  }

  const activeCategory = query.category ? categoryBySlug(query.category) : undefined;

  const panel = (
    <div className="space-y-5">
      {applied.length > 0 && (
        <div className="rounded-2xl border border-content/10 bg-canvas-700/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-content/45">Applied</span>
            <button
              type="button"
              onClick={() => router.push('/meetups', { scroll: false })}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {applied.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => push(chip.clear)}
                className="group inline-flex items-center gap-1 rounded-full bg-brand/12 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand/20"
              >
                {chip.label}
                <X size={12} className="opacity-60 group-hover:opacity-100" />
                <span className="sr-only">— remove this filter</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Group label="When">
        <ChipRow>
          {WHEN_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              active={(query.when ?? 'any') === option.value}
              onClick={() => push({ when: option.value as WhenFilter })}
            >
              {option.label}
            </Chip>
          ))}
        </ChipRow>
      </Group>

      {/* 24 activities is the longest axis, and the rail above the results
          already offers all of them — so this opens closed, showing what is
          picked rather than the whole catalogue. */}
      <Collapsible
        label="Activity"
        summary={activeCategory?.name ?? 'Everything'}
        defaultOpen={false}
      >
        <ChipRow>
          <Chip active={!query.category} onClick={() => push({ category: '' })}>
            Everything
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.slug} active={query.category === c.slug} onClick={() => push({ category: c.slug })}>
              <CategoryIcon
                slug={c.slug}
                size={13}
                className="shrink-0"
                style={query.category === c.slug ? undefined : { color: categoryAccent(c.slug) }}
              />
              {c.name}
            </Chip>
          ))}
        </ChipRow>
      </Collapsible>

      <Group label="City">
        {/* 44 cities do not fit as a flat list, so a search narrows it and a
            capped, scrollable area carries the rest — the same "one choice per
            axis" shape as every other filter, just with a way in. */}
        <input
          type="text"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          placeholder="Search cities…"
          aria-label="Search cities"
          className="mb-2 w-full rounded-lg border border-content/15 bg-transparent px-2.5 py-1.5 text-sm text-content placeholder:text-content/45 focus:border-brand/50 focus:outline-none"
        />
        <div className="max-h-44 overflow-y-auto pr-1">
          {visibleCities.length ? (
            <ChipRow>
              <Chip active={!query.city} onClick={() => push({ city: '' })}>
                Any city
              </Chip>
              {visibleCities.map((c) => (
                <Chip key={c.slug} active={query.city === c.slug} onClick={() => push({ city: c.slug })}>
                  {c.name}
                </Chip>
              ))}
            </ChipRow>
          ) : (
            <p className="py-1 text-sm text-content/50">No city matches “{cityFilter}”.</p>
          )}
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          className={cn(
            'mt-2 w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
            hasLocation
              ? 'border-signal/50 bg-signal/10 text-signal-600'
              : 'border-content/20 text-content/75 hover:border-content/40 hover:text-content',
          )}
        >
          {locating ? 'Finding you…' : hasLocation ? 'Using your location ✓' : 'Use my location'}
        </button>
      </Group>

      <Group label="Join fee">
        <ChipRow>
          <Chip active={!query.maxFeeCents} onClick={() => push({ maxFeeCents: undefined })}>
            Any
          </Chip>
          {FEE_PRESETS.map((fee) => (
            <Chip key={fee} active={query.maxFeeCents === fee} onClick={() => push({ maxFeeCents: fee })}>
              ≤ {formatMoney(fee)}
            </Chip>
          ))}
        </ChipRow>
      </Group>

      <Group label="How demanding">
        <ChipRow>
          {LEVELS.map((l) => (
            <Chip
              key={l.value}
              active={(query.level ?? 'any') === l.value}
              onClick={() => push({ level: l.value as Level })}
            >
              {l.label}
            </Chip>
          ))}
        </ChipRow>
      </Group>

      <Group label="Availability">
        <Toggle on={Boolean(query.hasSpots)} onClick={() => push({ hasSpots: !query.hasSpots })}>
          Hide full meetups
        </Toggle>
      </Group>
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
      <legend className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-content/45">{label}</legend>
      {children}
    </fieldset>
  );
}

/**
 * A group whose contents are too long to sit open. The header states the
 * current choice, so collapsing hides the options without hiding the answer.
 */
function Collapsible({
  label,
  summary,
  defaultOpen,
  children,
}: {
  label: string;
  summary: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-content/45">{label}</span>
        <span className="ml-auto truncate text-xs font-semibold text-content/75">{summary}</span>
        <ChevronDown
          size={14}
          className={cn('shrink-0 text-content/45 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && <div className="mt-2.5">{children}</div>}
    </fieldset>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
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
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.8rem] transition-colors',
        active
          ? 'border-brand bg-brand text-on-brand font-semibold'
          : 'border-content/15 text-content/75 hover:border-content/35 hover:bg-content/5 hover:text-content',
      )}
    >
      {children}
    </button>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className="flex w-full items-center gap-2.5 text-left text-sm text-content/80"
    >
      <span
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
          on ? 'bg-brand' : 'bg-content/20',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-canvas shadow-sm transition-transform duration-200',
            on ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
          )}
        />
      </span>
      {children}
    </button>
  );
}
