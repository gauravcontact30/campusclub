import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader, NextUp } from '@/components/site/page-header';
import { MeetupCard } from '@/components/meetups/meetup-card';
import { ButtonLink } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { searchMeetups } from '@/lib/data/meetups';
import { getSavedMeetupIds } from '@/lib/data/saves';
import { getCurrentUser } from '@/lib/auth/session';
import { CATEGORIES, CITIES, cityBySlug, SITE } from '@/lib/constants';
import { formatFee, pluralize } from '@/lib/utils';

export function generateStaticParams() {
  return CITIES.map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = cityBySlug(slug);
  if (!city) return { title: 'City not found' };

  return {
    title: `Meetups in ${city.name}`,
    description: `Group study, exam prep, gym, sport, runs and dinners you can join in ${city.name}. Pay only the join fee for the one you go to.`,
    openGraph: { title: `Meetups in ${city.name} · ${SITE.name}`, type: 'website' },
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = cityBySlug(slug);
  if (!city) notFound();

  const [{ items, total }, user] = await Promise.all([
    searchMeetups({ city: slug, perPage: 6, hasSpots: true }),
    getCurrentUser(),
  ]);
  const savedIds = user ? await getSavedMeetupIds(user.id) : [];

  // Only the activities that actually have something on. A city page listing
  // eight categories where five are empty is a page that lies.
  const all = await searchMeetups({ city: slug, perPage: 1000 });
  const counts = all.items.reduce<Record<string, number>>((acc, m) => {
    acc[m.categorySlug] = (acc[m.categorySlug] ?? 0) + 1;
    return acc;
  }, {});
  const live = CATEGORIES.filter((c) => counts[c.slug]);
  const areas = [...new Set(all.items.map((m) => m.area))].sort();
  const cheapest = all.items.reduce<number | null>(
    (min, m) => (min === null || m.joinFeeCents < min ? m.joinFeeCents : min),
    null,
  );

  return (
    <>
      <PageHeader
        eyebrow={city.state}
        title={`What’s on in ${city.name}`}
        lede={`${city.blurb} ${pluralize(total, 'meetup')} with a spot open right now${
          cheapest !== null ? `, from ${formatFee(cheapest)} to join` : ''
        }.`}
        actions={
          <>
            <ButtonLink href={`/meetups?city=${city.slug}`} size="lg">
              Browse all {all.total}
            </ButtonLink>
            <ButtonLink href="/host" variant="outline" size="lg">
              Host one here
            </ButtonLink>
          </>
        }
      />

      <div className="container-page py-14">
        {items.length ? (
          <>
            <h2 className="display-md text-content">Starting soonest</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((meetup) => (
                <MeetupCard key={meetup.id} meetup={meetup} saved={savedIds.includes(meetup.id)} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={`Nothing on in ${city.name} this week`}
            description="That happens in a new city. The fastest fix is to put on the thing you were going to do anyway and let six people join you."
            action={<ButtonLink href="/host">Host the first one</ButtonLink>}
          />
        )}

        {live.length > 0 && (
          <section className="mt-16" aria-labelledby="what-heading">
            <h2 id="what-heading" className="display-md text-content">
              What people do here
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {live.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/meetups?city=${city.slug}&category=${c.slug}`}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-content/12 bg-canvas-700 p-4 transition-colors hover:border-brand/45"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CategoryIcon slug={c.slug} size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-content">{c.name}</span>
                      <span className="block text-xs text-content/55">{pluralize(counts[c.slug], 'meetup')}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {areas.length > 0 && (
          <section className="mt-16" aria-labelledby="areas-heading">
            <h2 id="areas-heading" className="display-md text-content">
              Neighbourhoods with something on
            </h2>
            <p className="lede mt-2">
              Twenty minutes is the number that decides whether somebody actually goes, so the area matters more than
              the city.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {areas.map((area) => (
                <li key={area}>
                  <Link
                    href={`/meetups?city=${city.slug}&term=${encodeURIComponent(area)}`}
                    className="inline-block rounded-full border border-content/18 px-4 py-2 text-sm text-content/80 transition-colors hover:border-brand hover:text-brand"
                  >
                    {area}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <NextUp
        links={[
          { href: '/cities', label: 'Other cities', blurb: 'Six and counting. Yours may already be one of them.' },
          { href: '/passes', label: 'Join fees & passes', blurb: 'What a meetup costs, and when a pass is worth it.' },
          { href: '/safety', label: 'Trust & safety', blurb: 'What we check before somebody can host.' },
        ]}
      />
    </>
  );
}
