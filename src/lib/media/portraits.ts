/**
 * Member portraits — one list, used by the seed data, the hero and the
 * professionals section.
 *
 * Real photographs, from Unsplash under its licence. They were three separate
 * copies before this file existed, which meant three places to fix when a URL
 * stopped resolving and no single place to run a check against. Verify with:
 *
 *   npm run media:check
 *
 * Only the id is stored. The crop is asked of the CDN rather than of CSS, so
 * one entry serves a 28px circle in the hero and a 400px host portrait without
 * either one being a squashed or off-centre version of the other.
 */

const HOST = 'https://images.unsplash.com';

export function portraitUrl(id: string, size = 400) {
  return `${HOST}/${id}?w=${size}&h=${size}&fit=crop&crop=faces&q=80`;
}

/**
 * Ordered to match `people` in src/lib/data/seed.ts, index for index — a member
 * and their face are paired by position, so the two lists must stay the same
 * length and the same order.
 */
export const PORTRAIT_IDS = [
  'photo-1604177091072-b7b677a077f6', // Aarav Mehta
  'photo-1679138118375-47f78db3761d', // Priya Nair
  'photo-1667655699558-8f1b362a67a8', // Kabir Shah
  'photo-1706943262459-3ef6ce03305c', // Ananya Rao
  'photo-1771165553611-fbe2655c3a91', // Rohan Kapoor
  'photo-1674278882093-3870ef98e826', // Meera Iyer
  'photo-1632507273499-df468b359d7d', // Vikram Sethi
  'photo-1646979200272-b76a262249b8', // Sara Qureshi
  'photo-1757744705465-ea08b0ddc38a', // Aditya Menon
  'photo-1646979201225-00e36437d09e', // Nisha Gupta
  'photo-1533128361669-69c065857a13', // Tanvi Deshmukh
  'photo-1609943878157-c6b5694231a7', // Arjun Reddy
  'photo-1778692258270-bc0e80e975c0', // Gaurav
];

/**
 * A deliberately mixed handful — students and working professionals, women and
 * men — for the places that need faces whatever happens to be on the board.
 *
 * The hero needs exactly this. Its stack used to be drawn from the hosts of
 * whatever meetups were upcoming, which meant flat colour discs whenever those
 * hosts had no photo and nothing at all against an empty database. A row of
 * people is the point of it, so the row does not get to depend on the query.
 */
export const FEATURED_PORTRAIT_IDS = [
  PORTRAIT_IDS[0], // college, man
  PORTRAIT_IDS[3], // college, woman
  PORTRAIT_IDS[6], // student, man
  PORTRAIT_IDS[1], // professional, woman
  PORTRAIT_IDS[12], // professional, man
];

/** The professionals section's own faces, kept off the seed members' set. */
export const PROFESSIONAL_PORTRAIT_IDS = [
  'photo-1778692258270-bc0e80e975c0',
  'photo-1628726987013-db899232027c',
  'photo-1625241152315-4a698f74ceb7',
  'photo-1547212371-eb5e6a4b590c',
  'photo-1757744705465-ea08b0ddc38a',
];
