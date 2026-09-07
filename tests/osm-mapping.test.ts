import { describe, expect, it } from 'vitest';
import { BUSINESS_CATEGORY_SLUGS } from '@/lib/constants';
import { CATEGORY_GROUPS, OSM_CATEGORY_MAP, categoryForTags, priceBandForTags } from '../scripts/lib/osm-categories.mjs';

describe('OSM category map', () => {
  it('maps every tag to a category that actually exists', () => {
    const unknown = Object.entries(OSM_CATEGORY_MAP)
      .filter(([, slug]) => !BUSINESS_CATEGORY_SLUGS.includes(slug))
      .map(([tag, slug]) => `${tag} -> ${slug}`);
    expect(unknown).toEqual([]);
  });

  it('maps every tag exactly once', () => {
    const tags = Object.keys(OSM_CATEGORY_MAP);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('uses key=value tag syntax throughout', () => {
    for (const tag of Object.keys(OSM_CATEGORY_MAP)) expect(tag).toMatch(/^[a-z_]+=[a-z_:]+$/);
  });

  it('lists every mapped tag in exactly one query group', () => {
    const grouped = CATEGORY_GROUPS.flatMap((g) => g.tags);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual(Object.keys(OSM_CATEGORY_MAP).sort());
  });

  it('never maps to a top-level category — imports land on a leaf', () => {
    const parents = ['food-drink', 'active-life', 'study-work', 'beauty-spas', 'shopping', 'nightlife', 'home-services', 'health'];
    const bad = Object.entries(OSM_CATEGORY_MAP).filter(([, slug]) => parents.includes(slug));
    expect(bad).toEqual([]);
  });
});

describe('categoryForTags', () => {
  it('resolves a known tag', () => {
    expect(categoryForTags({ amenity: 'restaurant', name: 'Anna' })).toBe('restaurants');
    expect(categoryForTags({ shop: 'hairdresser', name: 'Cut' })).toBe('barbers');
    expect(categoryForTags({ leisure: 'fitness_centre', name: 'Iron' })).toBe('gyms');
  });

  it('returns null for anything unmapped rather than guessing a bucket', () => {
    expect(categoryForTags({ amenity: 'bench' })).toBeNull();
    expect(categoryForTags({ name: 'No tags' })).toBeNull();
  });
});

describe('priceBandForTags', () => {
  it('reads an explicit OSM price level', () => {
    expect(priceBandForTags({ 'price:level': '2' })).toBe(2);
  });

  it('clamps out-of-range values and ignores junk', () => {
    expect(priceBandForTags({ 'price:level': '9' })).toBe(4);
    expect(priceBandForTags({ 'price:level': 'cheap' })).toBeNull();
    expect(priceBandForTags({})).toBeNull();
  });
});
