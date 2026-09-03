import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { MeetupWithHost } from '@/types';
import { MeetupCard } from '@/components/meetups/meetup-card';

export function Upcoming({
  meetups,
  savedIds,
  title,
  subtitle,
  href = '/meetups',
}: {
  meetups: MeetupWithHost[];
  savedIds: string[];
  title: string;
  subtitle: string;
  href?: string;
}) {
  if (!meetups.length) return null;

  return (
    <section className="container-page py-12" aria-labelledby="upcoming-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Starting soon</p>
          <h2 id="upcoming-heading" className="display-lg mt-2 text-content">
            {title}
          </h2>
          <p className="lede mt-2 max-w-xl">{subtitle}</p>
        </div>
        <Link href={href} className="link-underline inline-flex items-center gap-1.5 font-semibold text-content">
          See everything <ArrowRight size={15} />
        </Link>
      </div>

      <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {meetups.map((meetup) => (
          <MeetupCard key={meetup.id} meetup={meetup} saved={savedIds.includes(meetup.id)} />
        ))}
      </div>
    </section>
  );
}
