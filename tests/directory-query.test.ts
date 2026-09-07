import { describe, expect, it } from 'vitest';
import { activeDirectoryFilterCount, parseBusinessQuery, toBusinessSearchParams } from '@/lib/directory/query';

describe('parseBusinessQuery', () => {
  it('falls back to a sane empty query', () => {
    expect(parseBusinessQuery({})).toEqual({
      term: '', city: '', category: '', priceBand: undefined,
      openNow: false, sort: 'recommended', page: 1, near: undefined,
    });
  });

  it('keeps a category that exists in the catalogue', () => {
    expect(parseBusinessQuery({ cat: 'cafes' }).category).toBe('cafes');
  });

  it('drops a category that does not, so a hand-edited URL cannot show an empty page', () => {
    expect(parseBusinessQuery({ cat: 'unicorns' }).category).toBe('');
  });

  it('drops a meetup category — the two taxonomies are separate', () => {
    expect(parseBusinessQuery({ cat: 'exam-prep' }).category).toBe('');
  });

  it('takes the first value when a param repeats', () => {
    expect(parseBusinessQuery({ q: ['tea', 'coffee'] }).term).toBe('tea');
  });

  it('accepts a valid sort and rejects an invalid one', () => {
    expect(parseBusinessQuery({ sort: 'rating' }).sort).toBe('rating');
    expect(parseBusinessQuery({ sort: 'cheapest' }).sort).toBe('recommended');
  });

  it('accepts price bands 1 to 4 only', () => {
    expect(parseBusinessQuery({ price: '3' }).priceBand).toBe(3);
    expect(parseBusinessQuery({ price: '0' }).priceBand).toBeUndefined();
    expect(parseBusinessQuery({ price: '5' }).priceBand).toBeUndefined();
    expect(parseBusinessQuery({ price: 'free' }).priceBand).toBeUndefined();
  });

  it('reads open=true as a flag', () => {
    expect(parseBusinessQuery({ open: 'true' }).openNow).toBe(true);
    expect(parseBusinessQuery({ open: 'yes' }).openNow).toBe(false);
  });

  it('clamps a nonsense page to 1', () => {
    expect(parseBusinessQuery({ page: '0' }).page).toBe(1);
    expect(parseBusinessQuery({ page: '-4' }).page).toBe(1);
    expect(parseBusinessQuery({ page: 'x' }).page).toBe(1);
    expect(parseBusinessQuery({ page: '3' }).page).toBe(3);
  });

  it('takes coordinates only when both halves are on the globe', () => {
    expect(parseBusinessQuery({ lat: '18.52', lng: '73.85' }).near).toEqual({ lat: 18.52, lng: 73.85 });
    expect(parseBusinessQuery({ lat: '18.52' }).near).toBeUndefined();
    expect(parseBusinessQuery({ lat: '99', lng: '73.85' }).near).toBeUndefined();
  });
});

describe('toBusinessSearchParams', () => {
  it('round-trips a full query', () => {
    const query = parseBusinessQuery({ q: 'chai', city: 'pune', cat: 'cafes', sort: 'rating', price: '2', open: 'true', page: '2' });
    expect(parseBusinessQuery(Object.fromEntries(toBusinessSearchParams(query)))).toEqual(query);
  });

  it('omits defaults so a clean URL stays clean', () => {
    expect(toBusinessSearchParams(parseBusinessQuery({})).toString()).toBe('');
  });
});

describe('activeDirectoryFilterCount', () => {
  it('counts only the filters that narrow the list', () => {
    expect(activeDirectoryFilterCount(parseBusinessQuery({}))).toBe(0);
    expect(activeDirectoryFilterCount(parseBusinessQuery({ city: 'pune', cat: 'cafes', open: 'true' }))).toBe(3);
    // Sort and page reorder or paginate; they do not filter.
    expect(activeDirectoryFilterCount(parseBusinessQuery({ sort: 'rating', page: '4' }))).toBe(0);
  });
});
