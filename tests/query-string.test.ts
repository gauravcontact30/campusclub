import { describe, expect, it } from 'vitest';
import { parseBusinessQuery, toSearchParams } from '@/lib/query-string';
import type { PriceLevel } from '@/types';

describe('business query serialisation', () => {
  it('parses url params into a typed query', () => {
    const query = parseBusinessQuery({
      term: 'coffee',
      city: 'london',
      price: '2,3',
      minRating: '4',
      openNow: 'true',
      sort: 'rating',
      page: '2',
    });

    expect(query).toMatchObject({
      term: 'coffee',
      city: 'london',
      price: [2, 3],
      minRating: 4,
      openNow: true,
      sort: 'rating',
      page: 2,
    });
  });

  it('drops invalid price levels', () => {
    expect(parseBusinessQuery({ price: '0,2,9' }).price).toEqual([2]);
  });

  it('round-trips without emitting defaults', () => {
    const params = toSearchParams({ term: 'tacos', sort: 'recommended', page: 1 });
    expect(params.toString()).toBe('term=tacos');
  });

  it('round-trips a full query', () => {
    const original = { term: 'bar', city: 'lisbon', category: 'bars', price: [3 as PriceLevel], minRating: 4, openNow: true, sort: 'reviews' as const, page: 3 };
    expect(parseBusinessQuery(Object.fromEntries(toSearchParams(original)))).toMatchObject(original);
  });
});
