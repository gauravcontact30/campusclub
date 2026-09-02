import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';
import { CITIES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About',
  description: 'Why SitNext exists: better local recommendations, and somebody to use them with.',
};

const MILESTONES = [
  ['2023', 'Six friends, one long table in Bengaluru, a spreadsheet doing the matching.'],
  ['2024', 'The directory opens — reviews written by people who came to dinner.'],
  ['2025', 'London, New York and Lisbon join. 18,400 seats filled.'],
  ['Today', 'Six cities, 200+ reviewed venues, one Wednesday at a time.'],
];

export default function AboutPage() {
  return (
    <>
      <section className="container-page py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow">About SitNext</p>
          <h1 className="display-xl mt-4">Cities are full of good places and lonely people.</h1>
          <p className="lede mt-6">
            We started with a spreadsheet and a booking for six. The idea has not changed since: the internet is very
            good at telling you where to eat and terrible at giving you someone to eat with. SitNext does both, and
            each half makes the other better — our reviews come from people who actually sat down, and our dinners
            happen in places those reviews vouch for.
          </p>
        </div>
      </section>

      <section className="bg-noir py-20 text-frost">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="display-lg text-frost">How we got here</h2>
            <p className="lede mt-4 text-frost/70">
              No growth hacks, no fake reviews, no paid placement. Just a table that keeps getting longer.
            </p>
          </div>
          <ol className="space-y-6">
            {MILESTONES.map(([year, text]) => (
              <li key={year} className="flex gap-6 border-b border-frost/15 pb-6 last:border-0">
                <span className="w-20 shrink-0 font-display text-xl font-semibold text-orchid">{year}</span>
                <span className="text-sm leading-relaxed text-frost/75">{text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-20">
        <h2 className="display-lg">Where you will find us</h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <span key={city.slug} className="rounded-full border border-frost/15 px-4 py-2 text-sm font-medium">
              {city.name}
            </span>
          ))}
          <span className="rounded-full border border-dashed border-frost/25 px-4 py-2 text-sm text-frost/55">
            Your city next?
          </span>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/signup" size="lg">
            Join SitNext
          </ButtonLink>
          <ButtonLink href="/add-business" variant="outline" size="lg">
            List your business
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
