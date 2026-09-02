import Link from 'next/link';
import { Clock, MapPin, Users } from 'lucide-react';
import type { DinnerEvent } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { formatMoneyForCity, pluralize } from '@/lib/utils';

export function DinnerCard({ event, compact = false }: { event: DinnerEvent; compact?: boolean }) {
  const date = new Date(event.startsAt);
  const seatsLeft = Math.max(0, event.seatsTotal - event.seatsTaken);
  const filled = (event.seatsTaken / event.seatsTotal) * 100;

  return (
    <article className="surface-card flex flex-col gap-5 p-6 transition-all hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-frost/12 bg-noir-600 text-frost">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-frost/60">
              {date.toLocaleDateString('en-GB', { month: 'short' })}
            </span>
            <span className="font-display text-2xl font-semibold leading-none">{date.getDate()}</span>
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold">
              {event.city} · {event.neighborhood}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-frost/60">
              <Clock size={14} />
              {date.toLocaleDateString('en-GB', { weekday: 'long' })},{' '}
              {date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        </div>
        {seatsLeft <= 2 && seatsLeft > 0 && <Badge tone="orchid">{pluralize(seatsLeft, 'seat')} left</Badge>}
        {seatsLeft === 0 && <Badge tone="neutral">Waitlist</Badge>}
      </div>

      {!compact && (
        <p className="flex items-center gap-1.5 text-sm text-frost/60">
          <MapPin size={14} className="shrink-0" />
          Venue revealed 36 hours before · {event.vibe}
        </p>
      )}

      <div>
        <div className="flex items-center justify-between text-xs font-medium text-frost/60">
          <span className="flex items-center gap-1.5">
            <Users size={14} />
            {event.seatsTaken} of {event.seatsTotal} seats taken
          </span>
          <span>{event.language}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-frost/10">
          <div className="h-full rounded-full bg-orchid transition-all" style={{ width: `${filled}%` }} />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-frost/10 pt-4">
        <p className="text-sm">
          <span className="font-display text-lg font-semibold">{formatMoneyForCity(event.priceCents, event.city)}</span>
          <span className="text-frost/55"> / seat</span>
        </p>
        <ButtonLink href={`/dinners/${event.id}`} size="sm" variant={seatsLeft === 0 ? 'outline' : 'primary'}>
          {seatsLeft === 0 ? 'Join waitlist' : 'Claim a seat'}
        </ButtonLink>
      </div>

      <Link href={`/dinners/${event.id}`} className="sr-only">
        View dinner in {event.city}
      </Link>
    </article>
  );
}
