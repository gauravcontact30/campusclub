import type { Business, BusinessReview } from '@/types';
import { completenessOf } from '@/lib/directory/ranking';

/**
 * Demo-mode listings.
 *
 * Hand-written for now so the repository and the pages are buildable before
 * the importer runs; `node scripts/directory-import.mjs --sample` overwrites
 * this file with real OpenStreetMap rows once it exists.
 *
 * Completeness is computed rather than typed out, for the same reason
 * Postgres generates it rather than storing a literal: two hand-maintained
 * copies of a derived number drift, and the drift is invisible.
 */
function business(row: Omit<Business, 'completeness' | 'attribution'>): Business {
  const full = { ...row, attribution: 'OpenStreetMap contributors, ODbL', completeness: 0 };
  return { ...full, completeness: completenessOf(full) };
}

export const SEED_BUSINESSES: Business[] = [
  business({
    id: 'biz-001',
    slug: 'vaishali-fergusson-road-pune',
    name: 'Vaishali',
    citySlug: 'pune',
    categorySlug: 'restaurants',
    address: '1218/1 Fergusson College Road',
    locality: 'Shivajinagar',
    lat: 18.5236, lng: 73.8407,
    phone: '+912025533636',
    website: null,
    hours: { mon: [{ open: 420, close: 1350 }], tue: [{ open: 420, close: 1350 }], wed: [{ open: 420, close: 1350 }], thu: [{ open: 420, close: 1350 }], fri: [{ open: 420, close: 1350 }], sat: [{ open: 420, close: 1350 }], sun: [{ open: 420, close: 1350 }] },
    priceBand: 2,
    rating: 0, reviewCount: 0,
    claimedBy: null,
    createdAt: '2026-01-04T05:00:00.000Z',
  }),
  business({
    id: 'biz-002',
    slug: 'third-wave-coffee-koramangala-bengaluru',
    name: 'Third Wave Coffee',
    citySlug: 'bengaluru',
    categorySlug: 'cafes',
    address: '80 Feet Road, 4th Block',
    locality: 'Koramangala',
    lat: 12.9345, lng: 77.6265,
    phone: '+918041234567',
    website: 'https://thirdwavecoffee.in',
    hours: { mon: [{ open: 480, close: 1380 }], tue: [{ open: 480, close: 1380 }], wed: [{ open: 480, close: 1380 }], thu: [{ open: 480, close: 1380 }], fri: [{ open: 480, close: 1380 }], sat: [{ open: 480, close: 1380 }], sun: [{ open: 480, close: 1380 }] },
    priceBand: 2,
    rating: 0, reviewCount: 0,
    claimedBy: null,
    createdAt: '2026-01-04T05:00:00.000Z',
  }),
  business({
    id: 'biz-003',
    slug: 'cult-fit-indore-vijay-nagar',
    name: 'Cult.fit Vijay Nagar',
    citySlug: 'indore',
    categorySlug: 'gyms',
    address: 'Scheme 54, Vijay Nagar',
    locality: 'Vijay Nagar',
    lat: 22.7533, lng: 75.8937,
    phone: null,
    website: null,
    hours: {},
    priceBand: null,
    rating: 0, reviewCount: 0,
    claimedBy: null,
    createdAt: '2026-01-04T05:00:00.000Z',
  }),
];

/**
 * Two reviews, on one business only.
 *
 * Deliberately sparse: the interesting demo state is a directory where almost
 * nothing has been reviewed, because that is the real state on launch day and
 * the state the Recommended sort exists to handle.
 *
 * authorName is denormalised from `SEED_USERS` (`src/lib/data/seed.ts`) —
 * u001 is Aarav Mehta and u002 is Priya Nair — so it matches the profile
 * `userId` points at instead of drifting from it.
 */
export const SEED_BUSINESS_REVIEWS: BusinessReview[] = [
  {
    id: 'br-001',
    businessId: 'biz-001',
    userId: 'u001',
    authorName: 'Aarav Mehta',
    authorAvatar: null,
    rating: 5,
    body: 'The sambar has not changed in thirty years and that is the entire point. Go before nine or queue.',
    photos: [],
    createdAt: '2026-02-11T04:30:00.000Z',
    ownerReply: null,
    ownerReplyAt: null,
  },
  {
    id: 'br-002',
    businessId: 'biz-001',
    userId: 'u002',
    authorName: 'Priya Nair',
    authorAvatar: null,
    rating: 4,
    body: 'Good for a study break, bad for studying — nobody will let you keep a table for three hours at lunch.',
    photos: [],
    createdAt: '2026-02-19T11:15:00.000Z',
    ownerReply: null,
    ownerReplyAt: null,
  },
];
