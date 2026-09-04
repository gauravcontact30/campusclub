import type { Meetup } from '@/types';
import { hashIndex } from '@/lib/utils';

/**
 * Every cover on the site is decided here, so a card, a hero and an Open Graph
 * image can never disagree about what a meetup looks like.
 *
 * Two kinds of cover exist:
 *
 *  • `photo`      — a real image. A host upload, a Supabase Storage object, or
 *                   an entry in PHOTO_COVERS below. Always wins when present.
 *  • `generated`  — drawn from theme tokens and the category glyph. This is the
 *                   default, and it is a designed cover rather than a
 *                   placeholder: it follows the active palette and the
 *                   light/dark switch, which no stock photo can do.
 *
 * Photos degrade to the generated cover on any load failure (see MeetupCover),
 * so an expired or wrong URL costs polish, never layout.
 */

export interface GeneratedCover {
  kind: 'generated';
  /** Gradient stops. Fixed hues — see CATEGORY_TONES for why. */
  from: string;
  to: string;
  /** Where the soft highlight sits, so sibling cards do not look stamped. */
  highlight: string;
  /** Rotation of the oversized glyph, in degrees. */
  tilt: number;
}

export interface PhotoCover {
  kind: 'photo';
  src: string;
}

export type Cover = PhotoCover | GeneratedCover;

/* ------------------------------------------------------------------ */
/* Photo covers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Category slug → image URLs, used when a meetup carries no `coverImage` of
 * its own. Empty by default and safe to fill in: `next.config.ts` already
 * allowlists `images.unsplash.com`, `plus.unsplash.com` and `*.supabase.co`.
 *
 * Add a host here only after allowlisting it in `next.config.ts`, then prove
 * every URL resolves before shipping:
 *
 *   npm run media:check
 *
 * Entries are picked deterministically per meetup, so a given meetup keeps the
 * same photo across renders and between the two backends.
 */
export const PHOTO_COVERS: Record<string, string[]> = {};

/* ------------------------------------------------------------------ */
/* Generated covers                                                    */
/* ------------------------------------------------------------------ */

/**
 * One duotone per category.
 *
 * These are deliberately NOT theme tokens. A board where every cover is drawn
 * from the brand hue turns into a single wash of colour, and the cover stops
 * doing the one job it has: letting somebody scanning a long list tell a gym
 * session from a book club without reading. Fixed hues give the list the
 * colour-coding a directory needs, and each pair is dark and saturated enough
 * to carry white type in either theme.
 *
 * Ordered to match CATEGORIES in src/lib/constants.ts.
 */
const CATEGORY_TONES: Record<string, [string, string]> = {
  'group-study':     ['#4C5FD5', '#3730A3'],
  'exam-prep':       ['#0F766E', '#134E4A'],
  dinner:            ['#C2410C', '#7C2D12'],
  'breakfast-lunch': ['#D97706', '#92400E'],
  gym:               ['#1D4ED8', '#1E3A8A'],
  sports:            ['#059669', '#065F46'],
  outdoors:          ['#0284C7', '#075985'],
  skills:            ['#A21CAF', '#701A75'],
  'movies-shows':    ['#6D28D9', '#4C1D95'],
  gaming:            ['#7C3AED', '#5B21B6'],
  'board-games':     ['#E11D48', '#9F1239'],
  'music-jam':       ['#DB2777', '#9D174D'],
  'open-mic':        ['#DC2626', '#991B1B'],
  'book-club':       ['#92400E', '#78350F'],
  'coffee-chat':     ['#A16207', '#713F12'],
  'weekend-trips':   ['#0891B2', '#155E75'],
  photography:       ['#475569', '#1E293B'],
  cycling:           ['#4D7C0F', '#365314'],
  'hiking-treks':    ['#15803D', '#14532D'],
  cooking:           ['#EA580C', '#9A3412'],
  'arts-crafts':     ['#F43F5E', '#BE123C'],
  volunteering:      ['#BE185D', '#831843'],
  networking:        ['#1E40AF', '#172554'],
  'pet-meetups':     ['#CA8A04', '#854D0E'],
};

/** For a category not in the table — a new slug should still look designed. */
const FALLBACK_TONES: [string, string][] = [
  ['#4C5FD5', '#3730A3'],
  ['#0F766E', '#134E4A'],
  ['#C2410C', '#7C2D12'],
  ['#A21CAF', '#701A75'],
];

const HIGHLIGHTS = ['22% 18%', '78% 22%', '30% 78%', '72% 70%'];

/** Stable per category, so every gym meetup reads as the same section. */
export function generatedCover(seed: string): GeneratedCover {
  const [from, to] = CATEGORY_TONES[seed] ?? FALLBACK_TONES[hashIndex(seed, FALLBACK_TONES.length)];
  return {
    kind: 'generated',
    from,
    to,
    highlight: HIGHLIGHTS[hashIndex(`${seed}-h`, HIGHLIGHTS.length)],
    // A small, deterministic tilt — enough that a grid does not look tiled.
    tilt: [-12, -6, 7, 14][hashIndex(`${seed}-t`, 4)],
  };
}

/* ------------------------------------------------------------------ */
/* The one entry point                                                 */
/* ------------------------------------------------------------------ */

export function coverFor(
  meetup: Pick<Meetup, 'coverImage' | 'categorySlug' | 'slug'>,
): Cover {
  if (meetup.coverImage) return { kind: 'photo', src: meetup.coverImage };

  const pool = PHOTO_COVERS[meetup.categorySlug];
  if (pool?.length) {
    return { kind: 'photo', src: pool[hashIndex(meetup.slug, pool.length)] };
  }

  // Seeded on the category, not the slug: covers group the board by activity,
  // which is the distinction a visitor is actually scanning for.
  return generatedCover(meetup.categorySlug);
}

/** Flat list of every configured photo URL — what `npm run media:check` reads. */
export function allPhotoCovers(): string[] {
  return Object.values(PHOTO_COVERS).flat();
}
