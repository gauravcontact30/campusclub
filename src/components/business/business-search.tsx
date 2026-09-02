'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Business, BusinessQuery, Paginated, PriceLevel } from '@/types';
import { toSearchParams } from '@/lib/query-string';
import { BusinessCard } from './business-card';
import { FilterPanel } from './filter-panel';
import { Button } from '@/components/ui/button';
import { BusinessCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

async function fetchBusinesses(query: BusinessQuery): Promise<Paginated<Business>> {
  const response = await fetch(`/api/businesses?${toSearchParams(query).toString()}`);
  if (!response.ok) throw new Error('Could not load results.');
  return response.json();
}

export function BusinessSearch({
  initialQuery,
  initialData,
  savedIds,
}: {
  initialQuery: BusinessQuery;
  initialData: Paginated<Business>;
  savedIds: string[];
}) {
  const router = useRouter();
  // The search box is the only filter that needs debouncing, so it lives in its
  // own state and the effective query is derived from it — no effect required.
  const [filters, setFilters] = useState<BusinessQuery>(initialQuery);
  const [termDraft, setTermDraft] = useState(initialQuery.term ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const debouncedTerm = useDebounce(termDraft, 350);

  const query = useMemo<BusinessQuery>(
    () => ({ ...filters, term: debouncedTerm, page: debouncedTerm === filters.term ? filters.page : 1 }),
    [filters, debouncedTerm],
  );

  // Keep the URL shareable without re-running the server component on each keystroke.
  useEffect(() => {
    const params = toSearchParams(query).toString();
    router.replace(params ? `/businesses?${params}` : '/businesses', { scroll: false });
  }, [query, router]);

  const isInitial = JSON.stringify(query) === JSON.stringify(initialQuery);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['businesses', query],
    queryFn: () => fetchBusinesses(query),
    initialData: isInitial ? initialData : undefined,
    placeholderData: keepPreviousData,
  });

  const results = data ?? initialData;

  function update<K extends keyof BusinessQuery>(key: K, value: BusinessQuery[K]) {
    setFilters((f) => ({ ...f, term: debouncedTerm, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  }

  function togglePrice(level: PriceLevel) {
    setFilters((f) => {
      const current = f.price ?? [];
      return {
        ...f,
        term: debouncedTerm,
        price: current.includes(level) ? current.filter((p) => p !== level) : [...current, level],
        page: 1,
      };
    });
  }

  /**
   * Asks the browser where the visitor is and switches the sort to nearest
   * first. Nothing is stored: the coordinates live in the URL for this search.
   */
  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setLocationError('This browser cannot share a location.');
      return;
    }

    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setFilters((f) => ({
          ...f,
          term: debouncedTerm,
          near: { lat: position.coords.latitude, lng: position.coords.longitude },
          sort: 'distance',
          page: 1,
        }));
      },
      () => {
        setLocating(false);
        setLocationError('We could not read your location. Check the browser permission and try again.');
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  function reset() {
    setTermDraft('');
    setLocationError(null);
    setFilters({
      term: '',
      city: '',
      category: '',
      price: [],
      minRating: 0,
      openNow: false,
      sort: 'recommended',
      page: 1,
      near: undefined,
    });
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="display-lg">The directory</h1>
          <p className="lede mt-2">
            {results.total} places reviewed by people who actually went.
          </p>
        </div>

        <div className="flex w-full gap-2 lg:w-auto">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-ink/15 bg-cream-100 px-4 py-3 lg:w-96">
            <Search size={18} className="shrink-0 text-ink/40" />
            <input
              value={termDraft}
              onChange={(e) => setTermDraft(e.target.value)}
              placeholder="Search places, food, services…"
              aria-label="Search the directory"
              className="w-full bg-transparent text-sm focus:outline-none"
            />
            {termDraft && (
              <button onClick={() => setTermDraft('')} aria-label="Clear search">
                <X size={16} className="text-ink/40 hover:text-ink" />
              </button>
            )}
          </div>
          <Button variant="outline" className="lg:hidden" onClick={() => setFiltersOpen((o) => !o)}>
            <SlidersHorizontal size={16} />
            Filters
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className={cn(filtersOpen ? 'block' : 'hidden', 'lg:block')}>
          <FilterPanel
            query={query}
            total={results.total}
            onChange={update}
            onTogglePrice={togglePrice}
            onReset={reset}
            onUseMyLocation={useMyLocation}
            locating={locating}
            locationError={locationError}
          />
        </div>

        <div>
          {isError && (
            <p className="mb-4 rounded-2xl border border-flame/30 bg-flame/10 p-4 text-sm text-flame-700">
              Something went wrong loading results. Try adjusting your filters.
            </p>
          )}

          {isFetching && !results.items.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <BusinessCardSkeleton key={i} />
              ))}
            </div>
          ) : results.items.length === 0 ? (
            <EmptyState
              title="Nothing matches that yet"
              description="Try a broader search, drop a filter, or be the first to add the place you had in mind."
              action={
                <Button onClick={reset} variant="outline">
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <div className={cn('grid gap-5 sm:grid-cols-2 xl:grid-cols-3', isFetching && 'opacity-60 transition-opacity')}>
              {results.items.map((business, i) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  saved={savedIds.includes(business.id)}
                  priority={i < 3}
                />
              ))}
            </div>
          )}

          {results.pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                disabled={results.page <= 1}
                onClick={() => update('page', results.page - 1)}
              >
                <ChevronLeft size={16} /> Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: results.pages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => update('page', i + 1)}
                    aria-current={results.page === i + 1}
                    className={cn(
                      'h-9 w-9 rounded-full text-sm font-semibold transition-colors',
                      results.page === i + 1 ? 'bg-ink text-cream' : 'text-ink/60 hover:bg-ink/5',
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={results.page >= results.pages}
                onClick={() => update('page', results.page + 1)}
              >
                Next <ChevronRight size={16} />
              </Button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
