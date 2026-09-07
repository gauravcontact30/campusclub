/**
 * The photograph on each side of the account door.
 *
 * Same convention as slides.ts: the Unsplash id is stored once and the CDN is
 * asked for whatever crop the panel needs, so a wider panel is a parameter
 * rather than a second asset.
 *
 * The two are chosen to say different things, because the two pages are
 * addressed to different people. Sign-up is an invitation, so it is the thing
 * you are being invited to — a table of people halfway through a meal. Sign-in
 * is a return, so it is the ordinary version of the same room: people who
 * already know each other, working. Neither is the arms-round-shoulders
 * sunset shot, which is the stock image every product with a community reaches
 * for and which nothing else in this product's voice would survive standing
 * next to.
 *
 * Verify with:
 *
 *   npm run media:check
 */

const HOST = 'https://images.unsplash.com';

export function authImageUrl(id: string, width = 720, height = 900) {
  return `${HOST}/${id}?w=${width}&h=${height}&fit=crop&q=80`;
}

export const AUTH_IMAGE_IDS = {
  /** People sharing a meal — what an account gets you. */
  signup: 'photo-1753351055582-67172f8c4d27',
  /** A table already in progress — what you are coming back to. */
  signin: 'photo-1543269865-cbf427effbad',
  /**
   * Resetting a password is getting back into an account you already have, so
   * it is the same picture as signing in rather than a third one. A recovery
   * flow that looks like a different product is exactly the wrong feeling to
   * give somebody who is already unsure whether they are in the right place.
   */
  recovery: 'photo-1543269865-cbf427effbad',
} as const;
