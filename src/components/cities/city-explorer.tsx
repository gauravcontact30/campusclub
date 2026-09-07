'use client';

import { useMemo, useRef, useState } from 'react';
// Aliased: a bare `Map` import shadows the global Map constructor used below.
import { ChevronLeft, ChevronRight, Map as MapIcon, Search, X } from 'lucide-react';
import { ComboSelect, type ComboOption } from '@/components/ui/combo-select';
import { CityCard } from '@/components/cities/city-card';
import { CITY_TIERS } from '@/lib/constants';
import type { City, CityTier } from '@/types';
import { cn, pluralize } from '@/lib/utils';

/** Six cities to a page. */
const PER_PAGE = 6;

/**
 * The city directory: ask it something, then read about the cities that answer.
 *
 * Nothing is listed until you have asked. That gate was built when the
 * catalogue was a hundred and nineteen towns, kept when it was ten, and is
 * load-bearing again now that it is thirty-eight: an arrival wall answers no
 * question anybody came with, whatever its height. So this is settled, not
 * pending — if you are here to remove it because the list is short enough to
 * show outright, that argument has already been had twice.
 *
 * There are three ways to ask, and they are three genuinely different
 * questions:
 *
 *  • a state, for "is my own town on here";
 *  • a tier, for "do you only do metros" — which is the question the coverage
 *    claim actually gets asked, and the reason `tier` is a field rather than a
 *    sentence on the landing page;
 *  • the text field, which cuts across both, because "is Mainpuri on here"
 *    should not require knowing that Mainpuri is in Uttar Pradesh.
 *
 * Six at a time is what buys the card its size: room for a photograph, what a
 * place is known for, where to eat, where to stay and where anyone plays — the
 * things that make a city legible to somebody who has never been.
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
  const resultsRef = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState('');
  const [state, setState] = useState('');
  const [tier, setTier] = useState<CityTier | null>(null);
  const [withMeetupsOnly, setWithMeetupsOnly] = useState(false);
  const [page, setPage] = useState(1);

  const states = useMemo(
    () => [...new Set(cities.map((c) => c.state))].sort((a, b) => a.localeCompare(b)),
    [cities],
  );

  /** How many cities sit in each state, so the list says something a bare name does not. */
  const stateOptions = useMemo<ComboOption[]>(
    () =>
      states.map((s) => {
        const count = cities.filter((c) => c.state === s).length;
        return { value: s, label: s, sublabel: pluralize(count, 'city', 'cities') };
      }),
    [states, cities],
  );

  /** How many cities sit on each tier, so a chip is a fact and not a promise. */
  const tierCounts = useMemo(() => {
    const counted = new Map<CityTier, number>();
    for (const city of cities) counted.set(city.tier, (counted.get(city.tier) ?? 0) + 1);
    return counted;
  }, [cities]);

  const searching = Boolean(term.trim());

  /**
   * Nothing is listed until a state or a tier is chosen, or something is typed.
   * This is the one line that makes the page open on a question rather than a
   * wall.
   */
  const listing = Boolean(state) || tier !== null || searching;

  const filtered = useMemo(() => {
    if (!listing) return [];
    const q = term.trim().toLowerCase();
    return cities.filter((city) => {
      if (state && city.state !== state) return false;
      if (tier !== null && city.tier !== tier) return false;
      if (withMeetupsOnly && !(counts[city.name] ?? 0)) return false;
      if (!q) return true;
      // Blurb included so "wrestling" or "coaching" finds the right city —
      // that is the search somebody actually runs on a list of places.
      return (
        city.name.toLowerCase().includes(q) ||
        city.state.toLowerCase().includes(q) ||
        city.blurb.toLowerCase().includes(q)
      );
    });
  }, [listing, cities, counts, term, state, tier, withMeetupsOnly]);

  /**
   * Within a state, alphabetical — you are looking for your own town and you
   * know its name. Across a search, the ones with something on come first,
   * because there the question is "where can I actually go".
   */
  const ordered = useMemo(() => {
    const list = [...filtered];
    if (state && !searching) return list.sort((a, b) => a.name.localeCompare(b.name));
    return list.sort(
      (a, b) => (counts[b.name] ?? 0) - (counts[a.name] ?? 0) || a.name.localeCompare(b.name),
    );
  }, [filtered, state, searching, counts]);

  const pageCount = Math.max(1, Math.ceil(ordered.length / PER_PAGE));
  // Clamped rather than stored: narrowing the filter can strand you on page 4
  // of a two-page result, and an empty page reads as a broken directory.
  const current = Math.min(page, pageCount);
  const shown = ordered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const dirty = Boolean(term || state || tier !== null || withMeetupsOnly);

  /*
   * Every control that changes what is being asked for also returns to the
   * first page — in the handler rather than in an effect watching the query,
   * which would render the stale page once before correcting itself.
   */
  function changeTerm(value: string) {
    setTerm(value);
    setPage(1);
  }

  function changeState(value: string) {
    setState(value);
    setPage(1);
  }

  /** Clicking the chip you are already on clears it, which is what a pressed
   *  toggle is expected to do. */
  function changeTier(next: CityTier) {
    setTier((current) => (current === next ? null : next));
    setPage(1);
  }

  function toggleLiveOnly() {
    setWithMeetupsOnly((on) => !on);
    setPage(1);
  }

  function reset() {
    setTerm('');
    setState('');
    setTier(null);
    setWithMeetupsOnly(false);
    setPage(1);
  }

  function goTo(next: number) {
    setPage(next);
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  return (
    <div>
      <div className="border-b border-content/10 bg-canvas-700/50">
        <div className="container-page py-7 sm:py-9">
          <div className="mx-auto max-w-2xl">
            <form
              role="search"
              aria-label="Find a city"
              className="searchbar shadow-lift"
              onSubmit={(event) => {
                event.preventDefault();
                resultsRef.current?.focus({ preventScroll: true });
                resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
              }}
            >
              <label className="sr-only" htmlFor="city-term">
                Search cities
              </label>
              <input
                id="city-term"
                type="search"
                value={term}
                onChange={(e) => changeTerm(e.target.value)}
                placeholder="Search a city, a state, or what happens there…"
                aria-label="Search cities"
                className="search-field searchbar-field py-4 text-base"
              />
              {term && (
                <button
                  type="button"
                  onClick={() => changeTerm('')}
                  aria-label="Clear search"
                  className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full text-content/50 transition-colors hover:bg-content/10 hover:text-content"
                >
                  <X size={14} />
                </button>
              )}

              <span className="searchbar-divide" aria-hidden />

              {/* The same control as the city field on the board and the
                  landing page, rather than a native `<select>`: inside a
                  `.searchbar` the field is transparent, and the popup the OS
                  draws for a transparent select has no background of its own —
                  light type on a light list, unreadable in the dark theme.
                  Sharing it also brings the type-to-filter, which a
                  twenty-eight state list wanted anyway. */}
              <ComboSelect
                id="city-state"
                value={state}
                onChange={changeState}
                options={stateOptions}
                clearOption={{ value: '', label: 'All states', sublabel: 'Everywhere we run' }}
                icon={MapIcon}
                placeholder="Pick a state"
                srLabel="Which state? "
                listLabel="State"
                searchLabel="Search states"
                searchPlaceholder="Search states…"
                noun="state"
                size="lg"
                className="max-w-[7rem] sm:max-w-[11rem]"
              />
              <button type="submit" aria-label="Show matching cities" className="m-1.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand transition-colors hover:bg-brand-600">
                <Search size={19} aria-hidden />
              </button>
            </form>

            {/* Always shown, unlike the live-boards toggle: these are a way in,
                not a way to narrow something already on screen. Somebody who
                arrived to find out whether this is a metro-only product can
                answer that in one click without knowing a state name. */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {CITY_TIERS.map((info) => {
                const on = tier === info.tier;
                return (
                  <button
                    key={info.tier}
                    type="button"
                    onClick={() => changeTier(info.tier)}
                    aria-pressed={on}
                    title={info.blurb}
                    className={cn(
                      'rounded-full border px-3.5 py-2.5 text-sm font-medium transition-colors',
                      on
                        ? 'border-brand bg-brand text-on-brand'
                        : 'border-content/15 text-content/75 hover:border-content/35 hover:text-content',
                    )}
                  >
                    {info.label}
                    <span className={cn('ml-1.5 tabular-nums', on ? 'text-on-brand/70' : 'text-content/45')}>
                      {tierCounts.get(info.tier) ?? 0}
                    </span>
                  </button>
                );
              })}

              {listing && (
                <button
                  type="button"
                  onClick={toggleLiveOnly}
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
              )}
            </div>

            {tier !== null && (
              <p className="mt-3 text-center text-sm leading-relaxed text-content/55">
                {CITY_TIERS.find((t) => t.tier === tier)?.blurb}
              </p>
            )}
          </div>

          {dirty && (
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-content/10 pt-3">
              <p className="text-sm text-content/60" aria-live="polite">
                {ordered.length
                  ? `${pluralize(ordered.length, 'city', 'cities')} ${ordered.length === 1 ? 'matches' : 'match'}`
                  : 'No city matches that'}
                {tier !== null ? ` on ${CITY_TIERS.find((t) => t.tier === tier)?.label.toLowerCase()}` : ''}
                {state ? ` in ${state}` : ''}
                {term ? ` for “${term}”` : ''}.
                {ordered.length > PER_PAGE && (
                  <span className="text-content/45">
                    {' '}
                    Showing {(current - 1) * PER_PAGE + 1}–{Math.min(current * PER_PAGE, ordered.length)}.
                  </span>
                )}
              </p>
              {/* Named for what it actually does. The × in the field clears the
                  text; this also drops the state and the toggle, and two
                  controls called "Clear search" would be indistinguishable to
                  anyone navigating by accessible name. */}
              <button
                type="button"
                onClick={reset}
                className="shrink-0 text-sm font-semibold text-brand hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div ref={resultsRef} tabIndex={-1} aria-label="City results" className="container-page scroll-mt-24 py-10 focus:outline-none">
        {!listing && <ChooseState states={states.length} cities={cities.length} />}

        {listing && !ordered.length && <Empty total={cities.length} onReset={reset} />}

        {Boolean(shown.length) && (
          <>
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((city) => (
                <li key={city.slug}>
                  <CityCard city={city} count={counts[city.name] ?? 0} />
                </li>
              ))}
            </ul>

            {pageCount > 1 && <Pagination page={current} pageCount={pageCount} onGo={goTo} />}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The page's opening move, and it lists nothing.
 *
 * Not even the states. A grid of twenty-three state buttons sitting under the
 * search bar is still a wall of names to read, and it duplicates the control
 * directly above it — the same choice offered twice, one of which searches as
 * you type and one of which does not. So the field is the only way in, and
 * this says so and gets out of the way.
 *
 * It is deliberately the shortest thing on the page. An empty state that
 * explains itself at length is an empty state that has decided it is a feature.
 */
function ChooseState({ states, cities }: { states: number; cities: number }) {
  return (
    <div className="mx-auto max-w-lg py-6 text-center">
      <span
        aria-hidden
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand-700"
      >
        <MapIcon size={20} />
      </span>
      <h2 className="mt-5 font-display text-xl font-semibold text-content">Pick a state to see its cities</h2>
      <p className="mt-2 text-sm leading-relaxed text-content/60">
        {cities} cities across {states} states and union territories. Choose a state or a tier above and they arrive
        six at a time, with a photograph and what each place is known for — or search if you already know the name.
      </p>
    </div>
  );
}

/**
 * Six to a page, so this exists.
 *
 * Numbered rather than an endless "load more": a state is four or five pages
 * at the outside, and with that few, page 4 is a place you can go back to. The
 * window keeps a broad search from drawing twenty numbers.
 */
function Pagination({
  page,
  pageCount,
  onGo,
}: {
  page: number;
  pageCount: number;
  onGo: (page: number) => void;
}) {
  const window = 5;
  let first = Math.max(1, page - Math.floor(window / 2));
  const last = Math.min(pageCount, first + window - 1);
  first = Math.max(1, last - window + 1);
  const numbers = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  return (
    <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-1.5">
      <PageButton label="Previous page" onClick={() => onGo(page - 1)} disabled={page <= 1}>
        <ChevronLeft size={16} aria-hidden />
      </PageButton>

      {first > 1 && (
        <>
          <PageNumber n={1} current={page} onGo={onGo} />
          {first > 2 && <span className="px-1 text-content/35">…</span>}
        </>
      )}

      {numbers.map((n) => (
        <PageNumber key={n} n={n} current={page} onGo={onGo} />
      ))}

      {last < pageCount && (
        <>
          {last < pageCount - 1 && <span className="px-1 text-content/35">…</span>}
          <PageNumber n={pageCount} current={page} onGo={onGo} />
        </>
      )}

      <PageButton label="Next page" onClick={() => onGo(page + 1)} disabled={page >= pageCount}>
        <ChevronRight size={16} aria-hidden />
      </PageButton>
    </nav>
  );
}

function PageNumber({ n, current, onGo }: { n: number; current: number; onGo: (page: number) => void }) {
  const active = n === current;
  return (
    <button
      type="button"
      onClick={() => onGo(n)}
      aria-label={`Page ${n}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'h-9 min-w-9 rounded-full px-3 text-sm font-semibold tabular-nums transition-colors',
        active ? 'bg-content text-canvas' : 'text-content/65 hover:bg-content/8 hover:text-content',
      )}
    >
      {n}
    </button>
  );
}

function PageButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-content/15 text-content transition-colors hover:border-content/45 disabled:opacity-35 disabled:hover:border-content/15"
    >
      {children}
    </button>
  );
}

function Empty({ total, onReset }: { total: number; onReset: () => void }) {
  return (
    <div className="surface-card p-10 text-center">
      <p className="font-display text-lg font-semibold text-content">Nothing matches that search.</p>
      <p className="lede mx-auto mt-2 max-w-md">
        We run in {total} cities and open new ones when about forty people there ask. Try a state, or clear the
        search to see them all.
      </p>
      <button type="button" onClick={onReset} className="link-underline mt-5 inline-block font-semibold text-content">
        Clear all
      </button>
    </div>
  );
}
