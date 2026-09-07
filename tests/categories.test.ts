import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_GROUPS, categoriesInGroup } from '@/lib/constants';

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
