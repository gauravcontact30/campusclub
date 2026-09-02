import type { Business, DinnerBooking, QuizAnswers, Review, UserProfile } from '@/types';
import { SEED_BUSINESSES, SEED_DINNERS, SEED_REVIEWS, SEED_USERS } from './seed';

/**
 * Demo-mode database.
 *
 * A module-level singleton pinned to `globalThis` so it survives Next's HMR and
 * is shared by every route handler / server action in the process. It mirrors
 * exactly the tables defined in `supabase/migrations`, which is what lets the
 * repository layer swap between the two without pages noticing.
 */
export interface DemoDb {
  businesses: Business[];
  reviews: Review[];
  users: (UserProfile & { password: string })[];
  saves: { userId: string; businessId: string }[];
  bookings: DinnerBooking[];
  quiz: Record<string, QuizAnswers>;
  helpfulVotes: { reviewId: string; userId: string }[];
  dinners: typeof SEED_DINNERS;
}

const globalRef = globalThis as unknown as { __homemartDb?: DemoDb };

function createDb(): DemoDb {
  return {
    businesses: SEED_BUSINESSES.map((b) => ({ ...b })),
    reviews: SEED_REVIEWS.map((r) => ({ ...r })),
    users: SEED_USERS.map((u) => ({ ...u })),
    saves: [
      { userId: 'u001', businessId: 'b001' },
      { userId: 'u001', businessId: 'b014' },
    ],
    bookings: [],
    quiz: {},
    helpfulVotes: [],
    dinners: SEED_DINNERS.map((d) => ({ ...d })),
  };
}

export function db(): DemoDb {
  if (!globalRef.__homemartDb) globalRef.__homemartDb = createDb();
  return globalRef.__homemartDb;
}

/** Test helper — wipes mutations back to the seeded baseline. */
export function resetDb() {
  globalRef.__homemartDb = createDb();
  return globalRef.__homemartDb;
}

/** Rating + review count are derived, never stored, so they can't drift. */
export function withAggregates(business: Business, reviews: Review[] = db().reviews): Business {
  const mine = reviews.filter((r) => r.businessId === business.id);
  const rating = mine.length ? mine.reduce((sum, r) => sum + r.rating, 0) / mine.length : 0;
  return { ...business, rating: Math.round(rating * 10) / 10, reviewCount: mine.length };
}

export function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
