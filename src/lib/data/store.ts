import type { AdminEvent, Business, BusinessReview, HostSummary, Join, Meetup, Payment, UserProfile, Vouch } from '@/types';
import { SEED_HOSTS, SEED_MEETUPS, SEED_PAYMENTS, SEED_USERS, SEED_VOUCHES } from './seed';
import { SEED_BUSINESSES, SEED_BUSINESS_REVIEWS } from './seed-businesses';

/**
 * Demo-mode database.
 *
 * A module-level singleton pinned to `globalThis` so it survives Next's HMR and
 * is shared by every route handler / server action in the process. It mirrors
 * exactly the tables defined in `supabase/baseline.sql`, which is what lets the
 * repository layer swap between the two without pages noticing.
 */
export interface DemoDb {
  meetups: Meetup[];
  hosts: HostSummary[];
  vouches: Vouch[];
  /** Member rows the demo data layer reads for hosts, attendees and vouch
   *  authors. Credentials never live here — Supabase Auth owns those. */
  users: UserProfile[];
  joins: Join[];
  payments: Payment[];
  saves: { userId: string; meetupId: string }[];
  /**
   * Admin telemetry, newest last. Capped by `recordEvent` — this lives in a
   * long-running process, and an uncapped array fed by every request is a
   * memory leak with a dashboard attached.
   */
  events: AdminEvent[];
  /** Directory listings. In Supabase mode these live in `businesses`. */
  businesses: Business[];
  businessReviews: BusinessReview[];
}

const globalRef = globalThis as unknown as { __campusclubDb?: DemoDb };

function createDb(): DemoDb {
  return {
    meetups: SEED_MEETUPS.map((m) => ({ ...m })),
    hosts: SEED_HOSTS.map((h) => ({ ...h })),
    vouches: SEED_VOUCHES.map((v) => ({ ...v })),
    users: SEED_USERS.map((u) => ({ ...u })),
    joins: [],
    payments: SEED_PAYMENTS.map((p) => ({ ...p })),
    saves: [
      { userId: 'u001', meetupId: 'm002' },
      { userId: 'u001', meetupId: 'm017' },
    ],
    events: [],
    businesses: SEED_BUSINESSES.map((b) => ({ ...b })),
    businessReviews: SEED_BUSINESS_REVIEWS.map((r) => ({ ...r })),
  };
}

export function db(): DemoDb {
  if (!globalRef.__campusclubDb) globalRef.__campusclubDb = createDb();
  return globalRef.__campusclubDb;
}

/** Test helper — wipes mutations back to the seeded baseline. */
export function resetDb() {
  globalRef.__campusclubDb = createDb();
  return globalRef.__campusclubDb;
}

/** Rating + vouch count are derived, never stored, so they can't drift. */
export function withAggregates(meetup: Meetup, vouches: Vouch[] = db().vouches): Meetup {
  const mine = vouches.filter((v) => v.meetupId === meetup.id);
  const rating = mine.length ? mine.reduce((sum, v) => sum + v.rating, 0) / mine.length : 0;
  return { ...meetup, rating: Math.round(rating * 10) / 10, vouchCount: mine.length };
}

export function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * The demo-mode counterpart of the `business_reviews_rating` trigger.
 *
 * Supabase keeps `businesses.rating` current with a trigger; in demo mode
 * nothing does, so this recomputes the two columns for one business after a
 * write. Same contract, different machinery.
 */
export function refreshBusinessRating(businessId: string) {
  const store = db();
  const business = store.businesses.find((b) => b.id === businessId);
  if (!business) return;
  const mine = store.businessReviews.filter((r) => r.businessId === businessId);
  business.reviewCount = mine.length;
  business.rating = mine.length
    ? Math.round((mine.reduce((sum, r) => sum + r.rating, 0) / mine.length) * 10) / 10
    : 0;
}
