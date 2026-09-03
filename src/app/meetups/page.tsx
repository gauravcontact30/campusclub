import type { Metadata } from 'next';
import { FilterBar } from '@/components/meetups/filter-bar';
import { MeetupCard } from '@/components/meetups/meetup-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ButtonLink } from '@/components/ui/button';
import { searchMeetups } from '@/lib/data/meetups';
import { getSavedMeetupIds } from '@/lib/data/saves';
import { getCurrentUser } from '@/lib/auth/session';
import { parseMeetupQuery, toSearchParams } from '@/lib/query-string';
import { categoryBySlug, cityBySlug } from '@/lib/constants';
import { pluralize } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'What’s on',
  description: 'Every meetup you can join right now — study tables, gym slots, sport, dinners and runs across six cities.',
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

  const category = query.category ? categoryBySlug(query.category) : undefined;
  const city = query.city ? cityBySlug(query.city) : undefined;

  const heading = category
    ? `${category.name}${city ? ` in ${city.name}` : ''}`
    : city
      ? `What’s on in ${city.name}`
      : 'What’s on';

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">The board</p>
        <h1 className="display-lg mt-2 text-content">{heading}</h1>
        <p className="lede mt-3">
          {results.total > 0
            ? `${pluralize(results.total, 'meetup')} you can join. Every fee shown is what one person pays for one meetup.`
            : 'Nothing matches those filters yet.'}
        </p>
      </header>

      <div className="mt-8">
        <FilterBar query={query} resultCount={results.total} />
      </div>

      {results.items.length ? (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.items.map((meetup) => (
              <MeetupCard key={meetup.id} meetup={meetup} saved={savedIds.includes(meetup.id)} />
            ))}
          </div>

          {results.pages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Pagination">
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
        <div className="mt-8">
          <EmptyState
            title="Nothing matches those filters"
            description="Try widening the time window, or clearing the category — the board changes every day, and there is almost always something on within a week."
            action={
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/meetups">Clear all filters</ButtonLink>
                <ButtonLink href="/host" variant="outline">
                  Host it yourself
                </ButtonLink>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
