import { describe, expect, it } from 'vitest';
import { activeFilterCount, parseMeetupQuery, toSearchParams } from '@/lib/query-string';

describe('parseMeetupQuery', () => {
  it('defaults to everything upcoming, soonest first', () => {
    const query = parseMeetupQuery({});
    expect(query).toMatchObject({ term: '', city: '', category: '', when: 'any', sort: 'soonest', page: 1 });
    expect(query.near).toBeUndefined();
  });

  it('reads the filters a shared link carries', () => {
    const query = parseMeetupQuery({
      term: 'badminton',
      city: 'pune',
      category: 'sports',
      level: 'beginner',
      when: 'weekend',
      maxFee: '19900',
      hasSpots: 'true',
      sort: 'cheapest',
      page: '3',
    });
    expect(query).toMatchObject({
      term: 'badminton',
      city: 'pune',
      category: 'sports',
      level: 'beginner',
      when: 'weekend',
      maxFeeCents: 19900,
      hasSpots: true,
      sort: 'cheapest',
      page: 3,
    });
  });

  it('drops values that are not in the catalogue rather than querying for them', () => {
    // A hand-edited URL should land on a sensible board, not an empty one.
    const query = parseMeetupQuery({ category: 'underwater-basket-weaving', level: 'olympian', sort: 'vibes' });
    expect(query.category).toBe('');
    expect(query.level).toBe('any');
    expect(query.sort).toBe('soonest');
  });

  it('takes the first value when a param is repeated', () => {
    expect(parseMeetupQuery({ city: ['pune', 'delhi'] }).city).toBe('pune');
  });

  it('ignores coordinates that are missing a half or off the globe', () => {
    expect(parseMeetupQuery({ lat: '12.97' }).near).toBeUndefined();
    expect(parseMeetupQuery({ lat: '99', lng: '77' }).near).toBeUndefined();
    expect(parseMeetupQuery({ lat: '12.97', lng: '77.59' }).near).toEqual({ lat: 12.97, lng: 77.59 });
  });
});

describe('toSearchParams', () => {
  it('omits defaults so a clean board has a clean URL', () => {
    expect(toSearchParams(parseMeetupQuery({})).toString()).toBe('');
  });

  it('round-trips a filtered board', () => {
    const original = parseMeetupQuery({
      term: 'study',
      city: 'bengaluru',
      category: 'group-study',
      when: 'week',
      maxFee: '14900',
      hasSpots: 'true',
      sort: 'cheapest',
      page: '2',
      lat: '12.97',
      lng: '77.59',
    });
    const round = parseMeetupQuery(Object.fromEntries(toSearchParams(original)));
    expect(round).toEqual(original);
  });
});

describe('activeFilterCount', () => {
  it('counts only the filters that are actually narrowing anything', () => {
    expect(activeFilterCount(parseMeetupQuery({}))).toBe(0);
    expect(activeFilterCount(parseMeetupQuery({ city: 'pune', when: 'weekend' }))).toBe(2);
    // "any" is the absence of a filter, not a filter.
    expect(activeFilterCount(parseMeetupQuery({ level: 'any', when: 'any' }))).toBe(0);
  });
});
