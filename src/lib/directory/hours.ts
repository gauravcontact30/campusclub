import type { DayKey, OpeningHours } from '@/types';

/**
 * Is this place open right now?
 *
 * The parser that produced these intervals lives in `scripts/lib/hours.mjs`,
 * because parsing happens once at import time in a Node script that cannot
 * read TypeScript. This half runs on every request, so it lives in `src` and
 * stays typed. Neither imports the other; there is no shared logic to drift.
 */

export const DAY_KEYS: readonly DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** JS getDay() is Sunday-first; DAY_KEYS is Monday-first. */
function dayKeyOf(date: Date): DayKey {
  return DAY_KEYS[(date.getDay() + 6) % 7];
}

export function isOpenAt(hours: OpeningHours, at: Date): boolean {
  const minutes = at.getHours() * 60 + at.getMinutes();

  const today = hours[dayKeyOf(at)];
  if (today?.some((i) => minutes >= i.open && minutes < i.close)) return true;

  // A shift that started yesterday and runs past midnight: 01:00 on Sunday is
  // minute 1440 + 60 of Saturday's timeline.
  const yesterday = new Date(at);
  yesterday.setDate(yesterday.getDate() - 1);
  const previous = hours[dayKeyOf(yesterday)];
  return Boolean(previous?.some((i) => i.close > 1440 && minutes + 1440 >= i.open && minutes + 1440 < i.close));
}
