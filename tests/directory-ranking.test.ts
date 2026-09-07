import { describe, expect, it } from 'vitest';
import type { Business } from '@/types';
import { bayesianRating, completenessOf, sortBusinesses } from '@/lib/directory/ranking';

function make(over: Partial<Business> = {}): Business {
  return {
    id: 'b1', slug: 'b1', name: 'B1', citySlug: 'pune', categorySlug: 'cafes',
    address: '', locality: '', lat: 18.52, lng: 73.85,
    phone: null, website: null, hours: {}, priceBand: null,
    attribution: 'OpenStreetMap contributors, ODbL',
    rating: 0, reviewCount: 0, completeness: 0, claimedBy: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('completenessOf', () => {
  it('scores nothing for a bare row and five for a fully documented one', () => {
    expect(completenessOf(make())).toBe(0);
    expect(completenessOf(make({
      hours: { mon: [{ open: 540, close: 1020 }] },
      phone: '+912012345678', website: 'https://x.test',
      address: '12 Main St', locality: 'Kothrud',
    }))).toBe(5);
  });

  it('ignores empty strings, which OSM produces freely', () => {
    expect(completenessOf(make({ phone: '', website: '', address: '', locality: '' }))).toBe(0);
  });
});

describe('bayesianRating', () => {
  it('pulls a single glowing review towards the prior', () => {
    expect(bayesianRating(5, 1)).toBeCloseTo((1 / 6) * 5 + (5 / 6) * 3.5, 5);
  });

  it('barely moves a heavily reviewed average', () => {
    expect(bayesianRating(4.6, 200)).toBeGreaterThan(4.5);
  });

  it('ranks a well-reviewed 4.6 above a single 5', () => {
    expect(bayesianRating(4.6, 200)).toBeGreaterThan(bayesianRating(5, 1));
  });

  it('returns the prior when there are no reviews at all', () => {
    expect(bayesianRating(0, 0)).toBe(3.5);
  });
});

describe('sortBusinesses', () => {
  it('orders Recommended by completeness, then rating, then name', () => {
    const items = [
      make({ id: 'a', name: 'Anna', completeness: 1 }),
      make({ id: 'b', name: 'Bela', completeness: 5 }),
      make({ id: 'c', name: 'Cyrus', completeness: 5, rating: 4.8, reviewCount: 30 }),
    ];
    expect(sortBusinesses(items, 'recommended').map((b) => b.id)).toEqual(['c', 'b', 'a']);
  });

  // The cold-start case: on import day nothing has a review, and the order
  // must still be deterministic and meaningful rather than arbitrary.
  it('stays stable and completeness-led when every row has no reviews', () => {
    const items = [
      make({ id: 'z', name: 'Zoya', completeness: 3 }),
      make({ id: 'a', name: 'Anna', completeness: 3 }),
      make({ id: 'm', name: 'Mira', completeness: 5 }),
    ];
    const once = sortBusinesses(items, 'recommended').map((b) => b.id);
    const twice = sortBusinesses([...items].reverse(), 'recommended').map((b) => b.id);
    expect(once).toEqual(['m', 'a', 'z']);
    expect(twice).toEqual(once);
  });

  it('orders rating by the Bayesian average, not the raw one', () => {
    const items = [
      make({ id: 'raw5', name: 'Raw', rating: 5, reviewCount: 1 }),
      make({ id: 'solid', name: 'Solid', rating: 4.6, reviewCount: 200 }),
    ];
    expect(sortBusinesses(items, 'rating').map((b) => b.id)).toEqual(['solid', 'raw5']);
  });

  it('orders most-reviewed by review count', () => {
    const items = [make({ id: 'few', reviewCount: 2 }), make({ id: 'many', reviewCount: 90 })];
    expect(sortBusinesses(items, 'reviewed').map((b) => b.id)).toEqual(['many', 'few']);
  });

  it('orders nearest by distance from the given point', () => {
    const items = [
      make({ id: 'far', lat: 19.5, lng: 73.85 }),
      make({ id: 'near', lat: 18.53, lng: 73.85 }),
    ];
    const sorted = sortBusinesses(items, 'nearest', { lat: 18.52, lng: 73.85 });
    expect(sorted.map((b) => b.id)).toEqual(['near', 'far']);
  });

  it('falls back to Recommended when nearest is asked for without a point', () => {
    const items = [make({ id: 'a', completeness: 1 }), make({ id: 'b', completeness: 4 })];
    expect(sortBusinesses(items, 'nearest').map((b) => b.id)).toEqual(['b', 'a']);
  });

  it('orders A–Z case-insensitively', () => {
    const items = [make({ id: '1', name: 'zebra' }), make({ id: '2', name: 'Apple' })];
    expect(sortBusinesses(items, 'name').map((b) => b.name)).toEqual(['Apple', 'zebra']);
  });

  it('does not mutate the array it is given', () => {
    const items = [make({ id: 'a', completeness: 1 }), make({ id: 'b', completeness: 4 })];
    sortBusinesses(items, 'recommended');
    expect(items.map((b) => b.id)).toEqual(['a', 'b']);
  });
});
