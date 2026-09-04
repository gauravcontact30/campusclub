import { describe, expect, it } from 'vitest';
import { coverFor, generatedCover, allPhotoCovers, PHOTO_COVERS } from '@/lib/media/covers';
import { CATEGORIES } from '@/lib/constants';
import { SEED_MEETUPS, SEED_VOUCHES } from '@/lib/data/seed';

describe('coverFor', () => {
  const base = { categorySlug: 'gym', slug: 'a-meetup' };

  it('prefers a meetup’s own image over anything else', () => {
    const cover = coverFor({ ...base, coverImage: 'https://images.unsplash.com/photo-1' });
    expect(cover).toEqual({ kind: 'photo', src: 'https://images.unsplash.com/photo-1' });
  });

  it('falls back to a drawn cover when no photo is configured', () => {
    expect(coverFor({ ...base, coverImage: null }).kind).toBe('generated');
  });

  it('is stable — the same meetup never changes cover between renders', () => {
    const once = coverFor({ ...base, coverImage: null });
    const twice = coverFor({ ...base, coverImage: null });
    expect(once).toEqual(twice);
  });
});

describe('generatedCover', () => {
  it('gives every catalogue category its own colour pair', () => {
    // The covers are the only thing distinguishing rows at a glance on a long
    // board, so two categories sharing a gradient is a real regression.
    const seen = new Map<string, string>();
    for (const category of CATEGORIES) {
      const { from, to } = generatedCover(category.slug);
      const key = `${from}->${to}`;
      expect(seen.has(key), `${category.slug} shares a gradient with ${seen.get(key)}`).toBe(false);
      seen.set(key, category.slug);
    }
  });

  it('keeps one hue per category but varies the composition per meetup', () => {
    // A category-filtered board is the case this protects: every result shares
    // a category, so if the whole cover were seeded on the category alone the
    // page would be the same tile repeated down the column.
    const a = generatedCover('exam-prep', 'gate-5am-club');
    const b = generatedCover('exam-prep', 'neet-biology-one-system-a-week');

    expect(b.from).toBe(a.from);
    expect(b.to).toBe(a.to);
    expect([a.angle, a.highlight, a.tilt]).not.toEqual([b.angle, b.highlight, b.tilt]);
  });

  it('draws visibly different covers across a real category-filtered board', () => {
    const examPrep = SEED_MEETUPS.filter((m) => m.categorySlug === 'exam-prep');
    expect(examPrep.length).toBeGreaterThan(1);

    const compositions = examPrep.map((m) => {
      const c = generatedCover(m.categorySlug, m.slug);
      return `${c.angle}|${c.highlight}|${c.tilt}`;
    });
    // Not every one need be unique, but they must not all collapse to one.
    expect(new Set(compositions).size).toBeGreaterThan(1);
  });

  it('still returns a usable cover for a category outside the table', () => {
    const cover = generatedCover('some-future-category');
    expect(cover.from).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(cover.to).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe('PHOTO_COVERS', () => {
  it('only lists hosts that next.config.ts allowlists', () => {
    // A URL on any other host renders nothing and silently falls back, which
    // is the kind of failure nobody notices until it is in production.
    const allowed = [/^https:\/\/images\.unsplash\.com\//, /^https:\/\/plus\.unsplash\.com\//, /^https:\/\/[^/]+\.supabase\.co\//];
    for (const url of allPhotoCovers()) {
      expect(allowed.some((pattern) => pattern.test(url)), `${url} is not an allowlisted host`).toBe(true);
    }
  });

  it('only keys categories that exist', () => {
    const slugs = new Set(CATEGORIES.map((c) => c.slug));
    for (const slug of Object.keys(PHOTO_COVERS)) {
      expect(slugs.has(slug), `${slug} is not a category`).toBe(true);
    }
  });
});

describe('seeded feedback', () => {
  it('never quotes the same review twice on one meetup', () => {
    // The board shows a meetup's top-rated review as its snippet. When the
    // copy pool is walked with a stride sharing a factor with its length the
    // cycle is short and a page fills with the same sentence.
    for (const meetup of SEED_MEETUPS) {
      const bodies = SEED_VOUCHES.filter((v) => v.meetupId === meetup.id).map((v) => v.body);
      expect(new Set(bodies).size, `${meetup.slug} repeats a review`).toBe(bodies.length);
    }
  });

  it('does not quote the same line on two meetups in a row', () => {
    const topBodies = SEED_MEETUPS.map((meetup) => {
      const mine = SEED_VOUCHES.filter((v) => v.meetupId === meetup.id);
      // Same rule the browse page uses: the highest-rated piece of feedback.
      return [...mine].sort((a, b) => b.rating - a.rating)[0]?.body;
    });

    for (let i = 1; i < topBodies.length; i++) {
      expect(topBodies[i], `meetups ${i - 1} and ${i} quote the same line`).not.toBe(topBodies[i - 1]);
    }
  });
});
