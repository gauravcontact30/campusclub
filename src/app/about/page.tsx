import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';
import { CATEGORIES, CITIES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About',
  description: 'Why CampusClub exists: cities full of people doing the same things alone, twenty minutes apart.',
};

const MILESTONES: [string, string][] = [
  ['2024', 'A WhatsApp group of nine people in Indiranagar who kept turning up to the same 6am run.'],
  ['Early 2025', 'The group hit its cap. We started charging ₹40 a head to cover the chai and nobody minded — that was the whole insight.'],
  ['Mid 2025', 'Study tables, gym slots and badminton courts. Pune and Hyderabad open.'],
  ['Today', 'Six cities, eight kinds of meetup, and a rule that only people who went can rate it.'],
];

export default function AboutPage() {
  return (
    <>
      <section className="container-page py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow">About CampusClub</p>
          <h1 className="display-xl mt-4 text-balance text-content">
            A city is thousands of people doing the same thing alone.
          </h1>
          <p className="lede mt-6">
            Someone within a kilometre of you is revising for the same exam, going to the same gym at the same hour,
            eating the same dinner by themselves. The distance between you is not geography — it is that neither of you
            has a reason to say so out loud. CampusClub is the reason: a board of things happening near you, that you can
            pay to be part of, one at a time.
          </p>
        </div>
      </section>

      <section className="border-y border-content/10 bg-canvas-900/40 py-16" aria-labelledby="belief-heading">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 id="belief-heading" className="display-md text-balance text-content">
              Why the fee is the point, not the friction.
            </h2>
            <p className="lede mt-4">
              Free groups fill up with people who said yes and meant maybe. A ₹149 join fee is small enough that nobody
              has to think about it and large enough that everyone turns up — and it means the host can book the court
              without being out of pocket.
            </p>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-content/75">
            <p>
              We do not take a cut of it while the product is finding its feet. The host sets the fee, the host keeps
              the fee, and we carry the payments, the waitlist and the refunds.
            </p>
            <p>
              There is no membership standing between you and your first meetup. Passes exist because the people who go
              three times a week asked for them, not because the business needed a subscription to work.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-16" aria-labelledby="what-heading">
        <p className="eyebrow">Eight things</p>
        <h2 id="what-heading" className="display-md mt-2 text-content">
          What people actually meet up to do.
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <li key={c.slug} className="surface-card p-5">
              <p className="font-display text-base font-bold text-content">{c.verb}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-content/65">{c.blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pb-16" aria-labelledby="story-heading">
        <p className="eyebrow">How we got here</p>
        <h2 id="story-heading" className="display-md mt-2 text-content">
          It started as a WhatsApp group that got too big.
        </h2>
        {/* A real timeline, so the dates carry information rather than decorating. */}
        <ol className="mt-8 space-y-0 border-l border-content/15 pl-6">
          {MILESTONES.map(([year, note]) => (
            <li key={year} className="relative pb-8 last:pb-0">
              <span className="absolute -left-[1.72rem] top-1.5 h-3 w-3 rounded-full border-2 border-canvas bg-brand" />
              <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-brand">{year}</p>
              <p className="mt-1.5 text-base leading-relaxed text-content/75">{note}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page pb-24">
        <div className="surface-card bg-brand/10 p-10 sm:p-14">
          <h2 className="display-md max-w-2xl text-balance text-content">
            Live in {CITIES.map((c) => c.name).slice(0, 3).join(', ')} or {CITIES[CITIES.length - 1].name}? Something is
            on tonight.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/meetups" size="lg">
              See what’s on
            </ButtonLink>
            <ButtonLink href="/host" variant="outline" size="lg">
              Host your own
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
