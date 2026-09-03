import Link from 'next/link';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import type { MeetupWithHost, Vouch } from '@/types';
import { categoryBySlug, LEVELS } from '@/lib/constants';
import {
  cn,
  dayLabel,
  durationLabel,
  formatDistance,
  formatFee,
  formatTime,
  spotsState,
} from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/category-icon';
import { RatingBlocks } from '@/components/ui/rating-blocks';
import { ButtonLink } from '@/components/ui/button';
import { SaveButton } from './save-button';

/**
 * One meetup as a dense result row: rank, a category tile, the information
 * hierarchy in the middle, and the decision — date, fee, spots — pinned to the
 * right where the eye lands last.
 *
 * The rank number is not decoration. The board is sorted, and saying which
 * position a result holds is the only honest way to show that a list changed
 * when somebody changes the sort.
 */
export function MeetupRow({
  meetup,
  rank,
  saved = false,
  snippet,
}: {
  meetup: MeetupWithHost;
  rank: number;
  saved?: boolean;
  snippet?: Vouch;
}) {
  const spots = spotsState(meetup.spotsTaken, meetup.spotsTotal);
  const category = categoryBySlug(meetup.categorySlug);
  const level = LEVELS.find((l) => l.value === meetup.level);

  return (
    <article className="relative flex gap-4 py-6 sm:gap-5">
      {/* A generated tile rather than a photo: it follows the theme, and this
          app ships no images at all. */}
      <div className="flex shrink-0 flex-col items-center gap-2">
        <span className="text-sm font-bold tabular-nums text-content/40">{rank}</span>
        <span
          className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand/10 text-brand sm:h-20 sm:w-20"
          aria-hidden
        >
          <CategoryIcon slug={meetup.categorySlug} size={26} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg font-semibold leading-snug text-content sm:text-xl">
          <Link href={`/meetups/${meetup.slug}`} className="hover:text-brand focus-visible:text-brand">
            {meetup.title}
          </Link>
        </h3>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {meetup.vouchCount > 0 && (
            <>
              <RatingBlocks value={meetup.rating} size={13} />
              <span className="font-semibold tabular-nums text-content">{meetup.rating.toFixed(1)}</span>
              <span className="text-content/55">({meetup.vouchCount})</span>
              <span className="text-content/30" aria-hidden>
                ·
              </span>
            </>
          )}
          <span className="text-content/70">{category?.name}</span>
          {level && meetup.level !== 'any' && (
            <>
              <span className="text-content/30" aria-hidden>
                ·
              </span>
              <span className="text-content/70">{level.label}</span>
            </>
          )}
        </p>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-content/60">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin size={13} className="shrink-0" aria-hidden />
            <span className="truncate">
              {meetup.venueName}, {meetup.area}
            </span>
          </span>
          {meetup.distanceKm !== undefined && <span>{formatDistance(meetup.distanceKm)} away</span>}
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} aria-hidden />
            {durationLabel(meetup.startsAt, meetup.endsAt)}
          </span>
        </p>

        {snippet && (
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-content/75">
            <span className="font-semibold text-content">“</span>
            {snippet.body}
            <span className="font-semibold text-content">”</span>{' '}
            <span className="text-content/50">— {snippet.authorName.split(' ')[0]}, who went</span>
          </p>
        )}

        <p className="mt-2.5 text-sm text-content/55">
          Hosted by <span className="font-medium text-content/80">{meetup.host.name}</span> ·{' '}
          {meetup.host.hostedCount} hosted
        </p>
      </div>

      {/* The decision column. On mobile it folds under the title instead of
          squeezing into a third of the width. */}
      <div className="hidden w-[11.5rem] shrink-0 flex-col gap-3 border-l border-content/10 pl-5 sm:flex">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-content">
          <CalendarDays size={14} className="text-brand" aria-hidden />
          {dayLabel(meetup.startsAt)}, {formatTime(meetup.startsAt)}
        </p>

        <div>
          <p className="font-display text-2xl font-semibold text-content">{formatFee(meetup.joinFeeCents)}</p>
          <p className="text-xs text-content/55">{meetup.joinFeeCents > 0 ? 'to join' : 'no fee'}</p>
        </div>

        <div className="space-y-1.5">
          <div className="meter">
            <div
              className={cn('meter-fill', spots.full && 'bg-content/40', spots.scarce && 'bg-signal')}
              style={{ width: `${Math.round(spots.fraction * 100)}%` }}
            />
          </div>
          <p
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-medium',
              spots.full ? 'text-content/55' : spots.scarce ? 'text-signal-600' : 'text-content/65',
            )}
          >
            <Users size={12} aria-hidden />
            {spots.full ? 'Waitlist open' : spots.label}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <ButtonLink href={`/meetups/${meetup.slug}`} size="sm" className="flex-1">
            {spots.full ? 'Waitlist' : 'View'}
          </ButtonLink>
          <SaveButton meetupId={meetup.id} initialSaved={saved} title={meetup.title} />
        </div>
      </div>

      {/* The same three facts, stacked, below the width where the column fits. */}
      <div className="absolute right-0 top-6 sm:hidden">
        <SaveButton meetupId={meetup.id} initialSaved={saved} title={meetup.title} />
      </div>
    </article>
  );
}

/** The mobile strip that replaces the decision column below `sm`. */
export function MeetupRowFacts({ meetup }: { meetup: MeetupWithHost }) {
  const spots = spotsState(meetup.spotsTaken, meetup.spotsTotal);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-6 text-sm sm:hidden">
      <span className="inline-flex items-center gap-1.5 font-semibold text-content">
        <CalendarDays size={14} className="text-brand" aria-hidden />
        {dayLabel(meetup.startsAt)}, {formatTime(meetup.startsAt)}
      </span>
      <span className="font-display text-base font-semibold text-content">
        {formatFee(meetup.joinFeeCents)}
        {meetup.joinFeeCents > 0 && <span className="ml-1 text-xs font-medium text-content/55">to join</span>}
      </span>
      <span
        className={cn(
          'inline-flex items-center gap-1.5',
          spots.full ? 'text-content/55' : spots.scarce ? 'text-signal-600' : 'text-content/65',
        )}
      >
        <Users size={13} aria-hidden />
        {spots.full ? 'Waitlist open' : spots.label}
      </span>
    </div>
  );
}
