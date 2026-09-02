import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Globe2, MapPin, Utensils } from 'lucide-react';
import { buildTable, getBookingForEvent, getDinner, getDinners, getQuiz } from '@/lib/data/dinners';
import { getCurrentUser } from '@/lib/auth/session';
import { BookingPanel } from '@/components/dinners/booking-panel';
import { TableReveal } from '@/components/dinners/table-reveal';
import { DinnerCard } from '@/components/dinners/dinner-card';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { formatDateTime } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await getDinner(id);
  if (!event) return { title: 'Dinner not found' };
  return {
    title: `Dinner in ${event.city} — ${formatDateTime(event.startsAt)}`,
    description: `Six strangers, one table in ${event.neighborhood}. ${event.vibe}.`,
  };
}

export default async function DinnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getDinner(id);
  if (!event) notFound();

  const user = await getCurrentUser();
  const [booking, quiz, others] = await Promise.all([
    user ? getBookingForEvent(user.id, id) : Promise.resolve(null),
    user ? getQuiz(user.id) : Promise.resolve(null),
    getDinners(event.city),
  ]);

  const mates = buildTable(event.id, user?.id ?? 'guest');
  const revealed = Boolean(booking && booking.status === 'confirmed');
  const upcoming = others.filter((e) => e.id !== event.id).slice(0, 3);

  return (
    <div className="container-page py-8 sm:py-10">
      <Link href="/dinners" className="inline-flex items-center gap-2 text-sm text-pearl/60 hover:text-pearl">
        <ArrowLeft size={16} /> All dinners
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-4xl bg-pearl/5">
            <ImageWithFallback
              src={event.coverImage}
              alt={`Dinner in ${event.city}`}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              seed={event.id}
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noir/90 to-transparent p-6 text-pearl">
              <p className="text-sm font-medium text-pearl/80">{event.vibe}</p>
              <h1 className="display-md mt-1 text-pearl">
                Dinner in {event.city}
              </h1>
            </div>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Clock, label: 'When', value: formatDateTime(event.startsAt) },
              { icon: MapPin, label: 'Where', value: `${event.neighborhood} — revealed 36h before` },
              { icon: Globe2, label: 'Language', value: event.language },
            ].map((item) => (
              <div key={item.label} className="surface-card p-5">
                <item.icon size={18} className="text-rouge" />
                <dt className="mt-3 text-xs font-semibold uppercase tracking-widest text-pearl/55">{item.label}</dt>
                <dd className="mt-1 text-sm font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-10">
            <h2 className="display-md flex items-center gap-2">
              <Utensils size={22} className="text-rouge" />
              How the night runs
            </h2>
            <p className="lede mt-4">{event.hostNotes}</p>

            <ol className="mt-6 space-y-4">
              {[
                ['20:00', 'Everyone arrives within ten minutes of each other. The table is booked under SitNext.'],
                ['20:15', 'The conversation deck unlocks on your phone. First question is always the same one.'],
                ['21:30', 'Mains, second bottle, the part where nobody checks the time.'],
                ['23:00', 'The bill is split evenly by default. Half the tables go somewhere else afterwards.'],
              ].map(([time, text]) => (
                <li key={time} className="flex gap-4">
                  <span className="w-14 shrink-0 font-display text-lg font-semibold text-rouge">{time}</span>
                  <span className="text-sm leading-relaxed text-pearl/70">{text}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-10">
            <TableReveal mates={mates} locked={!revealed} />
          </div>
        </div>

        <div>
          <BookingPanel event={event} signedIn={Boolean(user)} booking={booking} hasQuiz={Boolean(quiz)} />
        </div>
      </div>

      {upcoming.length > 0 && (
        <section className="mt-16 border-t border-pearl/10 pt-10">
          <h2 className="display-md">Other tables in {event.city}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((item) => (
              <DinnerCard key={item.id} event={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
