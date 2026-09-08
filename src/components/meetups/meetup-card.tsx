import Link from 'next/link';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import type { MeetupWithHost } from '@/types';
import { categoryBySlug } from '@/lib/constants';
import { cn, dayLabel, formatDistance, formatFee, formatTime, spotsState } from '@/lib/utils';
import { MeetupCover } from '@/components/ui/meetup-cover';
import { Avatar } from '@/components/ui/avatar';
import { SaveButton } from './save-button';

/**
 * A meetup rendered as a photo-led card: a cover image carries the card,
 * a rating badge and the save toggle overlay it, and everything else — who's
 * hosting, what it is, when, how full, what it costs — sits in the body
 * below. This replaced a photo-less "ticket stub" anatomy; the facts it
 * showed (day/time, distance, fee, spots) are unchanged, just laid out
 * around a photo instead of a date stub.
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
    <article className={cn('pass group flex flex-col transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lift', className)}>
      <div className="relative">
        <MeetupCover
          categorySlug={meetup.categorySlug}
          slug={meetup.slug}
          coverImage={meetup.coverImage}
          alt=""
          glyph="sm"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-36 w-full"
        />

        {meetup.vouchCount > 0 && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-canvas-700/95 px-2.5 py-1 text-xs font-bold text-content shadow-card">
            ★ {meetup.rating.toFixed(1)}
          </span>
        )}

        {showSave && (
          <span className="absolute right-3 top-3">
            <SaveButton meetupId={meetup.id} initialSaved={saved} title={meetup.title} />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-xs text-content/60">
          <Avatar name={meetup.host.name} src={meetup.host.avatarUrl} size={20} />
          <span className="truncate">
            {meetup.host.name.split(' ')[0]} · {meetup.host.hostedCount} hosted
          </span>
        </div>

        <h3 className="font-display text-lg font-bold leading-snug text-content">
          <Link href={`/meetups/${meetup.slug}`} className="after:absolute after:inset-0">
            {meetup.title}
          </Link>
        </h3>

        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-content/65">
          <span className="font-medium text-content/75">{category?.name ?? 'Meetup'}</span>
          <span aria-hidden>·</span>
          <MapPin size={14} className="shrink-0 text-content/45" aria-hidden />
          <span className="truncate">
            {meetup.venueName}, {meetup.area}
          </span>
          {meetup.distanceKm !== undefined && (
            <span className="text-content/45">· {formatDistance(meetup.distanceKm)} away</span>
          )}
        </p>

        <p className="flex items-center gap-1.5 text-sm font-medium text-content/70">
          <CalendarDays size={14} className="text-brand" aria-hidden />
          {dayLabel(meetup.startsAt)}, {formatTime(meetup.startsAt)}
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
        </div>
      </div>
    </article>
  );
}
