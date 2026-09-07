import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_GROUPS, categoriesInGroup, BUSINESS_CATEGORIES, BUSINESS_CATEGORY_SLUGS, CATEGORY_SLUGS } from '@/lib/constants';

describe('CATEGORY_GROUPS', () => {
  it('shelves every category exactly once', () => {
    // The landing page renders the catalogue *through* the shelves, so a slug
    // typo here does not throw — it quietly drops an activity off the page and
    // nobody can browse to it. This is the only place that notices.
    const shelved = CATEGORY_GROUPS.flatMap((g) => g.slugs);
    expect([...shelved].sort()).toEqual(CATEGORIES.map((c) => c.slug).sort());
    expect(new Set(shelved).size).toBe(shelved.length);
  });

  it('resolves every shelved slug to a real category', () => {
    for (const group of CATEGORY_GROUPS) {
      expect(categoriesInGroup(group)).toHaveLength(group.slugs.length);
    }
  });

  it('never repeats an accent, and never puts the same one on neighbouring shelves', () => {
    // Colour is the only thing telling one shelf from the next at a glance.
    const tints = CATEGORY_GROUPS.map((g) => g.tint);
    expect(new Set(tints).size).toBe(tints.length);
  });
});

describe('business categories', () => {
  it('has a unique slug for every entry', () => {
    expect(new Set(BUSINESS_CATEGORY_SLUGS).size).toBe(BUSINESS_CATEGORIES.length);
  });

  it('resolves every parent slug to a real top-level category', () => {
    const tops = new Set(BUSINESS_CATEGORIES.filter((c) => c.parentSlug === null).map((c) => c.slug));
    for (const cat of BUSINESS_CATEGORIES) {
      if (cat.parentSlug !== null) expect(tops.has(cat.parentSlug)).toBe(true);
    }
  });

  it('keeps the directory taxonomy disjoint from the meetup taxonomy', () => {
    const overlap = BUSINESS_CATEGORY_SLUGS.filter((s) => CATEGORY_SLUGS.includes(s));
    expect(overlap).toEqual([]);
  });

  it('offers at least six top-level categories for the tile grid', () => {
    expect(BUSINESS_CATEGORIES.filter((c) => c.parentSlug === null).length).toBeGreaterThanOrEqual(6);
  });
});
