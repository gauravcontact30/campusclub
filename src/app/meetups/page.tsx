import type { Metadata } from 'next';
import { FilterSidebar } from '@/components/meetups/filter-sidebar';
import { SortBar } from '@/components/meetups/sort-bar';
import { SearchBar } from '@/components/meetups/search-bar';
import { CategoryRail } from '@/components/meetups/category-rail';
import { BoardHeader } from '@/components/meetups/board-header';
import { MeetupRow, MeetupRowFacts } from '@/components/meetups/meetup-row';
import { EmptyState } from '@/components/ui/empty-state';
import { ButtonLink } from '@/components/ui/button';
import { searchMeetups } from '@/lib/data/meetups';
import { getVouches } from '@/lib/data/vouches';
import { getSavedMeetupIds } from '@/lib/data/saves';
import { getCurrentUser } from '@/lib/auth/session';
import { parseMeetupQuery, toSearchParams } from '@/lib/query-string';
import { CITIES, categoryBySlug, cityBySlug } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'What’s on',
  description: `Every meetup you can join right now — study tables, gym slots, sport, dinners and runs across ${CITIES.length} cities. Pay only the join fee for the one you go to.`,
};

export default async function MeetupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseMeetupQuery(params);

  const [results, user] = await Promise.all([searchMeetups(query), getCurrentUser()]);
  const savedIds = user ? await getSavedMeetupIds(user.id) : [];

  // One quoted line per result, from the highest-rated piece of feedback it has.
  // A row without a human sentence in it is just a database record.
  const snippets = await Promise.all(
    results.items.map(async (meetup) => {
      if (!meetup.vouchCount) return undefined;
      const [top] = await getVouches(meetup.id, 'rating');
      return top;
    }),
  );

  const category = query.category ? categoryBySlug(query.category) : undefined;
  const city = query.city ? cityBySlug(query.city) : undefined;

  const firstRank = ((query.page ?? 1) - 1) * (query.perPage ?? 12);

  return (
    <>
      {/* The search and the rail sit in a band above the results, so the two
          ways in — type it, or pick an activity — are both above the fold. */}
      <div className="border-b border-content/10 bg-canvas-700/60">
        <div className="container-page space-y-5 py-6">
          <SearchBar defaultTerm={query.term} defaultCity={query.city} className="max-w-2xl" />
          <CategoryRail active={query.category} />
        </div>
      </div>

      <div className="container-page py-8">
        <BoardHeader category={category} city={city} total={results.total} />

        <div className="mt-6 grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-10">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <FilterSidebar query={query} resultCount={results.total} />
          </div>

          <div className="min-w-0">
            {results.items.length ? (
              <>
                <div className="mb-2 hidden items-center justify-between gap-4 border-b border-content/10 pb-4 lg:flex">
                  <p className="text-sm text-content/60">
                    Showing {firstRank + 1}–{firstRank + results.items.length} of {results.total}
                  </p>
                  <SortBar query={query} />
                </div>

                <div className="result-list">
                  {results.items.map((meetup, i) => (
                    <div key={meetup.id}>
                      <MeetupRow
                        meetup={meetup}
                        rank={firstRank + i + 1}
                        saved={savedIds.includes(meetup.id)}
                        snippet={snippets[i]}
                      />
                      <MeetupRowFacts meetup={meetup} />
                    </div>
                  ))}
                </div>

                {results.pages > 1 && (
                  <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
                    {query.page! > 1 && (
                      <ButtonLink
                        href={`/meetups?${toSearchParams({ ...query, page: query.page! - 1 })}`}
                        variant="outline"
                      >
                        Previous
                      </ButtonLink>
                    )}
                    <span className="text-sm tabular-nums text-content/60">
                      Page {results.page} of {results.pages}
                    </span>
                    {query.page! < results.pages && (
                      <ButtonLink
                        href={`/meetups?${toSearchParams({ ...query, page: query.page! + 1 })}`}
                        variant="outline"
                      >
                        Next
                      </ButtonLink>
                    )}
                  </nav>
                )}
              </>
            ) : (
              <EmptyState
                title="Nothing matches those filters"
                description="Try widening the time window, or clearing the activity — the board changes every day, and there is almost always something on within a week."
                action={
                  <div className="mt-2 flex flex-wrap justify-center gap-3">
                    <ButtonLink href="/meetups">Clear all filters</ButtonLink>
                    <ButtonLink href="/host" variant="outline">
                      Host it yourself
                    </ButtonLink>
                  </div>
                }
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
