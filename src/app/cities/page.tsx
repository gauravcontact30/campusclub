import type { Metadata } from 'next';
import { PageHeader, NextUp } from '@/components/site/page-header';
import { CityExplorer } from '@/components/cities/city-explorer';
import { CategoryIndex } from '@/components/meetups/category-index';
import { CATEGORIES, CITIES, citiesInTier } from '@/lib/constants';
import { countMeetupsByCategory, countMeetupsByCity } from '@/lib/data/meetups';
import { ButtonLink } from '@/components/ui/button';
import { pluralize } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Cities',
  description: `CampusClub runs in ${CITIES.length} Indian cities — the eight metros, ${citiesInTier(2).length} Tier-2 cities from Jaipur and Lucknow to Kochi and Guwahati, and two district towns in Uttar Pradesh. See what is on in yours.`,
};

export default async function CitiesPage() {
  const [byCity, byCategory] = await Promise.all([countMeetupsByCity(), countMeetupsByCategory()]);
  const total = Object.values(byCity).reduce((sum, n) => sum + n, 0);
  const states = new Set(CITIES.map((c) => c.state)).size;

  /**
   * Four facts about the directory, stated before it rather than left to be
   * counted off the cards. The second is the argument the page is actually
   * making — the Tier-2 tranche is the largest of the three, so this is not a
   * metro product with a long tail bolted on, and the number says so before
   * any of the copy has to.
   */
  const stats = [
    { value: String(CITIES.length), label: 'cities with a board' },
    { value: String(citiesInTier(2).length), label: 'of them Tier-2' },
    { value: String(states), label: 'states and union territories' },
    { value: String(CATEGORIES.length), label: 'things to do in them' },
  ];

  return (
    <>
      <PageHeader
        eyebrow={`${CITIES.length} cities`}
        title="Find your city. Meet your people."
        lede={`${pluralize(total, 'meetup')} on the board across ${CITIES.length} cities — eight metros, ${citiesInTier(2).length} Tier-2 cities, and two district towns. Pick a state or a tier and read what each place is known for: where people eat, stay and play, and what is on there.`}
        actions={<ButtonLink href="#city-directory" variant="outline">Pick a state or a tier</ButtonLink>}
      />

      <div className="border-b border-content/10 bg-canvas-900/50">
        <dl className="container-page grid grid-cols-2 divide-x divide-content/10 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              /* `divide-x` rules between columns; at phone width the four
                 tiles wrap to two rows, so the third loses its rule (it starts
                 a row) and gains one back at sm, and the top row gains a
                 hairline under it. */
              className="border-content/10 px-4 py-7 text-center first:pl-0 [&:nth-child(-n+2)]:border-b [&:nth-child(3)]:border-l-0 sm:[&:nth-child(-n+2)]:border-b-0 sm:[&:nth-child(3)]:border-l sm:last:pr-0"
            >
              <dd className="font-display text-3xl font-semibold leading-none text-content tabular-nums">
                {stat.value}
              </dd>
              <dt className="mt-2 text-xs leading-snug text-content/60 sm:text-sm">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div id="city-directory" className="scroll-mt-24"><CityExplorer cities={CITIES} counts={byCity} /></div>

      {/* The same shelved index the landing page uses. A second, looser row of
          twenty-four pills here would be the same catalogue drawn two different
          ways on two pages of one site. */}
      <section className="border-t border-content/10 bg-canvas-900/50 py-16" aria-labelledby="activities-heading">
        <div className="container-page">
          <h2 id="activities-heading" className="section-title text-content">
            Or start with what you want to do
          </h2>
          <p className="lede mt-3 max-w-xl">
            Every activity runs in more than one city. Pick the thing first and the map sorts itself out.
          </p>
          <CategoryIndex counts={byCategory} variant="cards" className="mt-8" />
        </div>
      </section>

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
