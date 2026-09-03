import type { HostSummary, Join, Meetup, Payment, UserProfile, Vouch } from '@/types';
import { SEED_HOSTS, SEED_MEETUPS, SEED_USERS, SEED_VOUCHES } from './seed';

/**
 * Demo-mode database.
 *
 * A module-level singleton pinned to `globalThis` so it survives Next's HMR and
 * is shared by every route handler / server action in the process. It mirrors
 * exactly the tables defined in `supabase/migrations`, which is what lets the
 * repository layer swap between the two without pages noticing.
 */
export interface DemoDb {
  meetups: Meetup[];
  hosts: HostSummary[];
  vouches: Vouch[];
  users: (UserProfile & { password: string })[];
  joins: Join[];
  payments: Payment[];
  saves: { userId: string; meetupId: string }[];
}

const globalRef = globalThis as unknown as { __campusclubDb?: DemoDb };

function createDb(): DemoDb {
  return {
    meetups: SEED_MEETUPS.map((m) => ({ ...m })),
    hosts: SEED_HOSTS.map((h) => ({ ...h })),
    vouches: SEED_VOUCHES.map((v) => ({ ...v })),
    users: SEED_USERS.map((u) => ({ ...u })),
    joins: [],
    payments: [],
    saves: [
      { userId: 'u001', meetupId: 'm002' },
      { userId: 'u001', meetupId: 'm017' },
    ],
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
