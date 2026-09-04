'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Search, X } from 'lucide-react';
import type { City } from '@/types';
import { cn, pluralize } from '@/lib/utils';

const PER_PAGE = 6;

type Sort = 'name' | 'meetups';

/**
 * The city index: search, narrow, paginate.
 *
 * Filtering runs in the browser rather than through the URL, unlike the meetup
 * board. The board paginates a database query, so its filters have to be a
 * request; this list is a static catalogue already in the bundle, and making
 * somebody wait for a round-trip per keystroke to filter an array we already
 * hold would be slower for no gain. The trade is that a filtered view here is
 * not a shareable link — a city's own page is the thing worth sharing, and
 * that has a URL.
 */
export function CityExplorer({ cities, counts }: { cities: City[]; counts: Record<string, number> }) {
  const [term, setTerm] = useState('');
  const [state, setState] = useState('');
  const [withMeetupsOnly, setWithMeetupsOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('meetups');
  const [page, setPage] = useState(1);

  const states = useMemo(
    () => [...new Set(cities.map((c) => c.state))].sort((a, b) => a.localeCompare(b)),
    [cities],
  );

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    const matches = cities.filter((city) => {
      if (state && city.state !== state) return false;
      if (withMeetupsOnly && !(counts[city.name] ?? 0)) return false;
      if (!q) return true;
      // Blurb included so "wrestling" or "coaching" finds the right towns —
      // that is the search somebody actually runs on a list of 119 places.
      return (
        city.name.toLowerCase().includes(q) ||
        city.state.toLowerCase().includes(q) ||
        city.blurb.toLowerCase().includes(q)
      );
    });

    return matches.sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : (counts[b.name] ?? 0) - (counts[a.name] ?? 0) || a.name.localeCompare(b.name),
    );
  }, [cities, counts, term, state, withMeetupsOnly, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  // Clamp rather than store: a filter that shrinks the list below the current
  // page would otherwise leave the grid empty with no way back but paging.
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const dirty = Boolean(term || state || withMeetupsOnly || sort !== 'meetups');

  function reset() {
    setTerm('');
    setState('');
    setWithMeetupsOnly(false);
    setSort('meetups');
    setPage(1);
  }

  /** Any change to what is being filtered starts again from page one. */
  function change<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div>
      <div className="surface-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content/45"
              aria-hidden
            />
            <input
              type="search"
              value={term}
              onChange={(e) => change(setTerm)(e.target.value)}
              placeholder="Search a city, a state, or what happens there…"
              aria-label="Search cities"
              className="search-field w-full rounded-full border border-content/15 bg-canvas py-2.5 pl-10 pr-10 text-sm text-content placeholder:text-content/45 focus:border-brand/60 focus:outline-none"
            />
            {term && (
              <button
                type="button"
                onClick={() => change(setTerm)('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-content/50 transition-colors hover:bg-content/10 hover:text-content"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="city-state">
              Filter by state
            </label>
            <select
              id="city-state"
              value={state}
              onChange={(e) => change(setState)(e.target.value)}
              className="cursor-pointer rounded-full border border-content/15 bg-canvas px-3.5 py-2.5 text-sm font-medium text-content focus:border-brand focus:outline-none"
            >
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="city-sort">
              Sort cities
            </label>
            <select
              id="city-sort"
              value={sort}
              onChange={(e) => change(setSort)(e.target.value as Sort)}
              className="cursor-pointer rounded-full border border-content/15 bg-canvas px-3.5 py-2.5 text-sm font-medium text-content focus:border-brand focus:outline-none"
            >
              <option value="meetups">Most on the board</option>
              <option value="name">A–Z</option>
            </select>

            <button
              type="button"
              onClick={() => change(setWithMeetupsOnly)(!withMeetupsOnly)}
              aria-pressed={withMeetupsOnly}
              className={cn(
                'rounded-full border px-3.5 py-2.5 text-sm font-medium transition-colors',
                withMeetupsOnly
                  ? 'border-brand bg-brand text-on-brand'
                  : 'border-content/15 text-content/75 hover:border-content/35 hover:text-content',
              )}
            >
              Live boards only
            </button>
          </div>
        </div>

        {dirty && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-content/10 pt-3">
            <p className="text-sm text-content/60">
              {filtered.length
                ? `${pluralize(filtered.length, 'city', 'cities')} ${filtered.length === 1 ? 'matches' : 'match'}`
                : 'No city matches that'}
              {state ? ` in ${state}` : ''}
              {term ? ` for “${term}”` : ''}.
            </p>
            {/* Named for what it actually does. The × in the field clears the
                text; this also drops the state, the sort and the toggle, and
                two controls called "Clear search" would be indistinguishable
                to anyone navigating by accessible name. */}
            <button type="button" onClick={reset} className="shrink-0 text-sm font-semibold text-brand hover:underline">
              Clear all
            </button>
          </div>
        )}
      </div>

      {shown.length ? (
        <>
          <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((city) => {
              const on = counts[city.name] ?? 0;
              return (
                <li key={city.slug}>
                  <Link
                    href={`/cities/${city.slug}`}
                    className="group surface-card flex h-full min-w-0 flex-col gap-3 p-6 transition-colors hover:border-brand/45"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-2xl font-semibold text-content group-hover:text-brand">
                        {city.name}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-3 py-1 text-xs font-bold',
                          on ? 'bg-brand/10 text-brand-700' : 'bg-content/8 text-content/55',
                        )}
                      >
                        {on}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-content/55">
                      <MapPin size={13} aria-hidden />
                      {city.state}
                    </span>
                    <span className="text-[0.95rem] leading-relaxed text-content/70">{city.blurb}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-3" aria-label="City pagination">
              <button
                type="button"
                onClick={() => setPage(current - 1)}
                disabled={current === 1}
                className="inline-flex items-center gap-1.5 rounded-full border border-content/18 px-4 py-2 text-sm font-semibold text-content transition-colors hover:border-content/40 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <span className="text-sm tabular-nums text-content/60" aria-live="polite">
                Page {current} of {pages}
              </span>
              <button
                type="button"
                onClick={() => setPage(current + 1)}
                disabled={current === pages}
                className="inline-flex items-center gap-1.5 rounded-full border border-content/18 px-4 py-2 text-sm font-semibold text-content transition-colors hover:border-content/40 disabled:pointer-events-none disabled:opacity-40"
              >
                Next <ChevronRight size={15} />
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="surface-card mt-6 p-10 text-center">
          <p className="font-display text-lg font-semibold text-content">Nothing matches that search.</p>
          <p className="lede mx-auto mt-2 max-w-md">
            We run in {cities.length} cities and open new ones when about forty people there ask. Try a state, or
            clear the search to see them all.
          </p>
          <button
            type="button"
            onClick={reset}
            className="link-underline mt-5 inline-block font-semibold text-content"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
