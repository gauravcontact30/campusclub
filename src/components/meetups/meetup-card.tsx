import Link from 'next/link';
import { MapPin, Users } from 'lucide-react';
import type { MeetupWithHost } from '@/types';
import { categoryBySlug } from '@/lib/constants';
import { cn, dayLabel, durationLabel, formatDistance, formatFee, formatTime, spotsState } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/category-icon';
import { Avatar } from '@/components/ui/avatar';
import { SaveButton } from './save-button';

/**
 * A meetup rendered as a pass: the date on a stub down the left, the detail on
 * the right, and a meter showing how full it is. Every element on the card is a
 * fact somebody needs before deciding — day, time, distance, fee, spots left —
 * with nothing decorative between them.
 */
export function MeetupCard({
  meetup,
  saved = false,
  showSave = true,
  className,
}: {
  meetup: MeetupWithHost;
  saved?: boolean;
  showSave?: boolean;
  className?: string;
}) {
  const spots = spotsState(meetup.spotsTaken, meetup.spotsTotal);
  const category = categoryBySlug(meetup.categorySlug);

  return (
    <article
      className={cn(
        // `min-w-0` because a grid item defaults to min-width:auto and would
        // otherwise grow to fit its longest unbroken string rather than truncating.
        'pass group flex min-w-0 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
      style={{ ['--stub' as string]: '5.5rem' }}
    >
      {/* The stub. Its own colour block, so the date reads first at a glance. */}
      <div className="flex w-[5.5rem] shrink-0 flex-col items-center justify-center gap-0.5 bg-brand/10 px-2 py-5 text-center">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand">
          {dayLabel(meetup.startsAt)}
        </span>
        <span className="font-display text-lg font-bold leading-tight text-content">
          {formatTime(meetup.startsAt)}
        </span>
        <span className="text-[0.68rem] text-content/55">{durationLabel(meetup.startsAt, meetup.endsAt)}</span>
      </div>

      <span className="pass-notch" aria-hidden />

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-content/60">
            <CategoryIcon slug={meetup.categorySlug} size={14} className="text-brand" />
            {category?.name ?? 'Meetup'}
          </span>
          {showSave && <SaveButton meetupId={meetup.id} initialSaved={saved} title={meetup.title} />}
        </div>

        <h3 className="font-display text-lg font-bold leading-snug text-content">
          <Link href={`/meetups/${meetup.slug}`} className="after:absolute after:inset-0">
            {meetup.title}
          </Link>
        </h3>

        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-content/65">
          <MapPin size={14} className="text-content/45" aria-hidden />
          <span className="truncate">
            {meetup.venueName}, {meetup.area}
          </span>
          {meetup.distanceKm !== undefined && (
            <span className="text-content/45">· {formatDistance(meetup.distanceKm)} away</span>
          )}
        </p>

        <div className="mt-auto space-y-2.5 pt-1">
          <div className="meter" role="presentation">
            <div
              className={cn('meter-fill', spots.full && 'bg-content/40', spots.scarce && 'bg-signal')}
              style={{ width: `${Math.round(spots.fraction * 100)}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 font-medium',
                spots.full ? 'text-content/55' : spots.scarce ? 'text-signal-600' : 'text-content/65',
              )}
            >
              <Users size={14} aria-hidden />
              {spots.full ? 'Full — waitlist open' : spots.label}
            </span>
            <span className="font-display text-base font-bold text-content">
              {formatFee(meetup.joinFeeCents)}
              {meetup.joinFeeCents > 0 && (
                <span className="ml-1 text-xs font-medium text-content/50">to join</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 border-t border-content/10 pt-3 text-xs text-content/55">
            <Avatar name={meetup.host.name} src={meetup.host.avatarUrl} size={22} />
            <span className="truncate">
              {meetup.host.name.split(' ')[0]} · {meetup.host.hostedCount} hosted
            </span>
            {meetup.host.rating > 0 && (
              <span className="ml-auto shrink-0 font-semibold text-content/70">★ {meetup.host.rating.toFixed(1)}</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
