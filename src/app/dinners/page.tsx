import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { CalendarRange } from 'lucide-react';
import { getDinners } from '@/lib/data/dinners';
import { DinnerCard } from '@/components/dinners/dinner-card';
import { CityFilter } from '@/components/dinners/city-filter';
import { EmptyState } from '@/components/ui/empty-state';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Wednesday dinners',
  description: 'Book a seat at a table of six strangers matched to you — in Bengaluru, Mumbai, Delhi, London, New York and Lisbon.',
};

export default async function DinnersPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  const events = await getDinners(city);

  const grouped = events.reduce<Record<string, typeof events>>((acc, event) => {
    const key = new Date(event.startsAt).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    (acc[key] ??= []).push(event);
    return acc;
  }, {});

  return (
    <>
      <section className="bg-noir py-14 text-frost sm:py-20">
        <div className="container-page">
          <p className="eyebrow">Every Wednesday, 8:00 PM</p>
          <h1 className="display-lg mt-3 max-w-2xl text-frost">
            Pick a Wednesday. We will handle the other five people.
          </h1>
          <p className="lede mt-5 max-w-2xl text-frost/70">
            Six seats per table. Venue revealed 36 hours before. If the table fills, you go on the waitlist and get first
            call on a drop-out.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/dinners/quiz" size="lg">
              Take the matching quiz
            </ButtonLink>
            <ButtonLink href="/pricing" variant="secondary" size="lg">
              See membership plans
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="container-page py-10">
        <Suspense fallback={<div className="h-10" />}>
          <CityFilter />
        </Suspense>

        {events.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No tables here yet"
              description="We open a new city once 200 people in it join the waitlist. Pick another city, or tell us where you are."
              action={
                <Link href="/dinners" className="link-underline text-sm font-semibold">
                  See all cities
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            {Object.entries(grouped).map(([date, group]) => (
              <section key={date}>
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <CalendarRange size={18} className="text-orchid" />
                  {date}
                </h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((event) => (
                    <DinnerCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
