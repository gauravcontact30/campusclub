import type { Business, BusinessSort } from '@/types';
import { distanceKm } from '@/lib/utils';

/**
 * How the directory decides what to show first.
 *
 * The problem this file exists to solve is the first day. Every row arrives
 * from OpenStreetMap with no reviews, so a rating sort would order ~10^5
 * businesses by a column that is zero everywhere — which is to say, at random.
 * A directory that looks random on the day it launches is a directory nobody
 * comes back to.
 *
 * So the default is completeness: how much OSM actually knows about the place.
 * It is a real quality signal — a shop somebody bothered to add hours, a phone
 * number and a website for is a shop that exists and is maintained — and it
 * degrades into rating order by itself as reviews arrive.
 */

/** Prior strength: how many reviews it takes to outweigh the prior. */
export const BAYESIAN_PRIOR_COUNT = 5;
/** Prior mean: what we assume about a place we know nothing about. */
export const BAYESIAN_PRIOR_RATING = 3.5;

/**
 * A rating that cannot be gamed by a single five-star review.
 *
 * `(v/(v+m))·R + (m/(v+m))·C` — the raw average pulled towards the prior in
 * proportion to how little evidence there is behind it.
 */
export function bayesianRating(rating: number, reviewCount: number): number {
  const v = Math.max(0, reviewCount);
  const m = BAYESIAN_PRIOR_COUNT;
  return (v / (v + m)) * rating + (m / (v + m)) * BAYESIAN_PRIOR_RATING;
}

/**
 * Mirrors the `completeness` generated column in `0009_directory.sql`.
 *
 * Duplicated deliberately: Postgres computes it for the Supabase adapter and
 * this computes it for demo mode, and the two must agree. The test above is
 * what holds them together.
 */
export function completenessOf(business: Business): number {
  return [
    Object.keys(business.hours).length > 0,
    Boolean(business.phone),
    Boolean(business.website),
    Boolean(business.address),
    Boolean(business.locality),
  ].filter(Boolean).length;
}

function byRecommended(a: Business, b: Business): number {
  return (
    b.completeness - a.completeness ||
    bayesianRating(b.rating, b.reviewCount) - bayesianRating(a.rating, a.reviewCount) ||
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}

export function sortBusinesses(
  items: Business[],
  sort: BusinessSort = 'recommended',
  near?: { lat: number; lng: number },
): Business[] {
  const rows = [...items];

  switch (sort) {
    case 'rating':
      return rows.sort(
        (a, b) =>
          bayesianRating(b.rating, b.reviewCount) - bayesianRating(a.rating, a.reviewCount) ||
          byRecommended(a, b),
      );

    case 'reviewed':
      return rows.sort((a, b) => b.reviewCount - a.reviewCount || byRecommended(a, b));

    case 'nearest':
      // Without a point there is no "near", so rather than inventing an order
      // this falls back to the default rather than returning the input order.
      if (!near) return rows.sort(byRecommended);
      return rows.sort(
        (a, b) =>
          distanceKm(near, a) - distanceKm(near, b),
      );

    case 'name':
      return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    default:
      return rows.sort(byRecommended);
  }
}
