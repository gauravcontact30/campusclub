import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader, NextUp } from '@/components/site/page-header';
import { CityExplorer } from '@/components/cities/city-explorer';
import { CATEGORIES, CITIES } from '@/lib/constants';
import { countMeetupsByCategory, countMeetupsByCity } from '@/lib/data/meetups';
import { pluralize } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Cities',
  description: `CampusClub runs in ${CITIES.length} cities across India, from Bengaluru and Mumbai to Guwahati and Kochi — see what is on in yours.`,
};

export default async function CitiesPage() {
  const [byCity, byCategory] = await Promise.all([countMeetupsByCity(), countMeetupsByCategory()]);
  const total = Object.values(byCity).reduce((sum, n) => sum + n, 0);

  return (
    <>
      <PageHeader
        eyebrow={`${CITIES.length} cities`}
        title="Wherever you already live."
        lede={`${pluralize(total, 'meetup')} on the board right now. We open a city when about forty people there have asked for one — not before, because a board with three things on it is worse than no board.`}
      />

      <div className="container-page py-14">
        <CityExplorer cities={CITIES} counts={byCity} />

        <section className="mt-16" aria-labelledby="activities-heading">
          <h2 id="activities-heading" className="display-md text-content">
            Or start with what you want to do
          </h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/meetups?category=${c.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-content/18 px-4 py-2 text-sm font-medium text-content/80 transition-colors hover:border-brand hover:text-brand"
                >
                  {c.name}
                  <span className="text-content/45">{byCategory[c.slug] ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <NextUp
        links={[
          { href: '/how-it-works', label: 'How it works', blurb: 'Four steps, and you only pay at the second one.' },
          { href: '/host', label: 'Host a meetup', blurb: 'Free to list, and you keep the whole join fee.' },
          { href: '/ambassadors', label: 'Open your city', blurb: 'What we need from someone on the ground first.' },
        ]}
      />
    </>
  );
}
