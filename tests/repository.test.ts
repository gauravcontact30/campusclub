import { beforeEach, describe, expect, it } from 'vitest';
import { countMeetupsByCity, getMeetupBySlug, getMeetupsHostedBy, searchMeetups, whenRange } from '@/lib/data/meetups';
import { cancelJoin, commitJoin, getJoin, getUpcomingJoins, isRefundable, passCoversJoin, spendCredit } from '@/lib/data/joins';
import { getVouches, ratingBreakdown, topHighlights } from '@/lib/data/vouches';
import { getSavedMeetupIds, toggleSave } from '@/lib/data/saves';
import { db, resetDb } from '@/lib/data/store';
import { DIRECTORY_PER_PAGE, escapePostgrestFilter, getBusiness, listBusinesses, topBusinesses } from '@/lib/data/businesses';
import { parseBusinessQuery } from '@/lib/directory/query';
import { CATEGORY_GROUPS, categoriesInGroup } from '@/lib/constants';

// No Supabase env in tests, so every call exercises the demo adapter.
beforeEach(() => {
  resetDb();
});

describe('searchMeetups', () => {
  it('paginates', async () => {
    const page1 = await searchMeetups({ perPage: 5, page: 1 });
    const page2 = await searchMeetups({ perPage: 5, page: 2 });

    expect(page1.items).toHaveLength(5);
    expect(page1.pages).toBe(Math.ceil(page1.total / 5));
    expect(page1.items[0].id).not.toBe(page2.items[0].id);
  });

  it('only ever returns meetups that have not started', async () => {
    const { items } = await searchMeetups({ perPage: 100 });
    for (const item of items) {
      expect(+new Date(item.startsAt)).toBeGreaterThanOrEqual(Date.now() - 1000);
    }
  });

  it('matches a free-text term across title, description, area and tags', async () => {
    const { items } = await searchMeetups({ term: 'badminton', perPage: 50 });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const haystack = [item.title, item.description, item.area, item.city, item.categorySlug, ...item.tags]
        .join(' ')
        .toLowerCase();
      expect(haystack).toContain('badminton');
    }
  });

  it('requires every word of a multi-word term, not just one', async () => {
    const { total } = await searchMeetups({ term: 'badminton zeppelin', perPage: 50 });
    expect(total).toBe(0);
  });

  it('filters by city, category and fee ceiling together', async () => {
    const { items } = await searchMeetups({
      city: 'bengaluru',
      category: 'group-study',
      maxFeeCents: 14900,
      perPage: 50,
    });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.city).toBe('Bengaluru');
      expect(item.categorySlug).toBe('group-study');
      expect(item.joinFeeCents).toBeLessThanOrEqual(14900);
    }
  });

  it('filters by a whole category group when no specific category is set', async () => {
    const { items } = await searchMeetups({ group: 'study', perPage: 100 });
    expect(items.length).toBeGreaterThan(0);
    const studySlugs = categoriesInGroup(CATEGORY_GROUPS.find((g) => g.id === 'study')!).map((c) => c.slug);
    for (const item of items) {
      expect(studySlugs).toContain(item.categorySlug);
    }
  });

  it('lets a specific category narrow further than its group', async () => {
    const { items } = await searchMeetups({ group: 'study', category: 'group-study', perPage: 100 });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.categorySlug).toBe('group-study');
    }
  });

  it('hides full meetups when asked', async () => {
    const { items } = await searchMeetups({ hasSpots: true, perPage: 100 });
    for (const item of items) expect(item.spotsTaken).toBeLessThan(item.spotsTotal);

    const all = await searchMeetups({ perPage: 100 });
    expect(all.total).toBeGreaterThan(items.length);
  });

  it('sorts cheapest by fee and soonest by start time', async () => {
    const cheap = await searchMeetups({ sort: 'cheapest', perPage: 100 });
    const fees = cheap.items.map((m) => m.joinFeeCents);
    expect([...fees].sort((a, b) => a - b)).toEqual(fees);

    const soon = await searchMeetups({ sort: 'soonest', perPage: 100 });
    const times = soon.items.map((m) => +new Date(m.startsAt));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('sorts "filling" by proportion, so a 7/8 beats a 12/20', async () => {
    const { items } = await searchMeetups({ sort: 'filling', perPage: 100 });
    const ratios = items.map((m) => m.spotsTaken / m.spotsTotal);
    expect([...ratios].sort((a, b) => b - a)).toEqual(ratios);
  });

  it('attaches the host to every result', async () => {
    const { items } = await searchMeetups({ perPage: 5 });
    for (const item of items) {
      expect(item.host.id).toBe(item.hostId);
      expect(item.host.name).not.toBe('');
    }
  });

  it('adds a distance only when coordinates were supplied', async () => {
    const plain = await searchMeetups({ perPage: 3 });
    expect(plain.items[0].distanceKm).toBeUndefined();

    const near = await searchMeetups({ perPage: 3, near: { lat: 12.9716, lng: 77.5946 }, sort: 'nearest' });
    expect(near.items[0].distanceKm).toBeGreaterThanOrEqual(0);
    const distances = near.items.map((m) => m.distanceKm!);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
  });
});

describe('whenRange', () => {
  it('bounds "today" to the end of the day, not 24 hours out', () => {
    const now = new Date(2026, 8, 3, 14, 0);
    const { to } = whenRange('today', now);
    expect(to.getDate()).toBe(3);
    expect(to.getHours()).toBe(23);
  });

  it('puts "tomorrow" on the next calendar day only', () => {
    const now = new Date(2026, 8, 3, 23, 30);
    const { from, to } = whenRange('tomorrow', now);
    expect(from.getDate()).toBe(4);
    expect(to.getDate()).toBe(4);
  });

  it('finds the coming Saturday and Sunday from midweek', () => {
    // 2026-09-03 is a Thursday.
    const { from, to } = whenRange('weekend', new Date(2026, 8, 3, 10, 0));
    expect(from.getDay()).toBe(6);
    expect(to.getDay()).toBe(0);
  });
});

describe('getMeetupBySlug', () => {
  it('resolves the host and the derived rating', async () => {
    const { items } = await searchMeetups({ perPage: 1 });
    const meetup = await getMeetupBySlug(items[0].slug);

    expect(meetup).not.toBeNull();
    expect(meetup!.host.name).not.toBe('');
    const vouches = await getVouches(meetup!.id);
    const average = vouches.reduce((sum, v) => sum + v.rating, 0) / vouches.length;
    expect(meetup!.rating).toBeCloseTo(Math.round(average * 10) / 10, 5);
  });

  it('returns null for a slug that does not exist', async () => {
    expect(await getMeetupBySlug('no-such-meetup')).toBeNull();
  });
});

describe('joining', () => {
  const user = 'u004';

  async function firstOpenMeetup() {
    const { items } = await searchMeetups({ hasSpots: true, perPage: 1 });
    return items[0];
  }

  it('takes a spot and decrements what is left', async () => {
    const meetup = await firstOpenMeetup();
    const before = meetup.spotsTaken;

    const join = await commitJoin({ userId: user, meetupId: meetup.id, amountCents: meetup.joinFeeCents, paymentId: 'pay-1' });

    expect(join.status).toBe('confirmed');
    expect(db().meetups.find((m) => m.id === meetup.id)!.spotsTaken).toBe(before + 1);
  });

  it('is idempotent — a double submit does not buy two spots', async () => {
    const meetup = await firstOpenMeetup();
    const before = db().meetups.find((m) => m.id === meetup.id)!.spotsTaken;

    const a = await commitJoin({ userId: user, meetupId: meetup.id, amountCents: 100, paymentId: 'p1' });
    const b = await commitJoin({ userId: user, meetupId: meetup.id, amountCents: 100, paymentId: 'p2' });

    expect(b.id).toBe(a.id);
    expect(db().meetups.find((m) => m.id === meetup.id)!.spotsTaken).toBe(before + 1);
  });

  it('waitlists on a full meetup, and charges nothing for it', async () => {
    const full = db().meetups.find((m) => m.spotsTaken >= m.spotsTotal)!;
    const join = await commitJoin({ userId: user, meetupId: full.id, amountCents: full.joinFeeCents, paymentId: 'p3' });

    expect(join.status).toBe('waitlisted');
    expect(join.amountCents).toBe(0);
    expect(join.paymentId).toBeNull();
  });

  it('refuses a meetup that has already started', async () => {
    const meetup = db().meetups[0];
    meetup.startsAt = new Date(Date.now() - 3_600_000).toISOString();

    await expect(
      commitJoin({ userId: user, meetupId: meetup.id, amountCents: 0, paymentId: null }),
    ).rejects.toThrow(/already started/);
  });

  it('frees the spot again on cancellation', async () => {
    const meetup = await firstOpenMeetup();
    const before = db().meetups.find((m) => m.id === meetup.id)!.spotsTaken;

    const join = await commitJoin({ userId: user, meetupId: meetup.id, amountCents: 100, paymentId: 'p4' });
    await cancelJoin(user, join.id);

    expect(db().meetups.find((m) => m.id === meetup.id)!.spotsTaken).toBe(before);
    expect(await getJoin(user, meetup.id)).toBeNull();
  });

  it('drops a cancelled join out of the upcoming list', async () => {
    const meetup = await firstOpenMeetup();
    const join = await commitJoin({ userId: user, meetupId: meetup.id, amountCents: 100, paymentId: 'p5' });

    expect((await getUpcomingJoins(user)).map((j) => j.id)).toContain(join.id);
    await cancelJoin(user, join.id);
    expect((await getUpcomingJoins(user)).map((j) => j.id)).not.toContain(join.id);
  });

  it('returns a credit to the balance when a credit-covered join is cancelled', async () => {
    const member = db().users.find((u) => u.id === 'u002')!;
    member.credits = 3;

    const meetup = await firstOpenMeetup();
    const join = await commitJoin({ userId: member.id, meetupId: meetup.id, amountCents: 0, paymentId: 'credit' });
    await cancelJoin(member.id, join.id);

    expect(member.credits).toBe(4);
  });
});

describe('refund window', () => {
  it('refunds outside the window and not inside it', () => {
    const now = new Date(2026, 8, 3, 12, 0);
    const tomorrow = new Date(2026, 8, 4, 12, 0).toISOString();
    const inTwoHours = new Date(2026, 8, 3, 14, 0).toISOString();

    expect(isRefundable(tomorrow, now)).toBe(true);
    expect(isRefundable(inTwoHours, now)).toBe(false);
  });
});

describe('passes and credits', () => {
  it('unlimited always covers a join and never spends a credit', async () => {
    const member = db().users.find((u) => u.id === 'u003')!;
    member.pass = 'unlimited';
    member.credits = 0;

    expect(passCoversJoin(member)).toBe(true);
    expect(await spendCredit(member.id)).toBe(true);
    expect(member.credits).toBe(0);
  });

  it('spends one credit at a time and refuses at zero', async () => {
    const member = db().users.find((u) => u.id === 'u003')!;
    member.pass = 'starter';
    member.credits = 1;

    expect(await spendCredit(member.id)).toBe(true);
    expect(member.credits).toBe(0);
    expect(await spendCredit(member.id)).toBe(false);
    expect(passCoversJoin(member)).toBe(false);
  });
});

describe('vouches', () => {
  it('breaks a rating down into a histogram that adds up', async () => {
    const { items } = await searchMeetups({ perPage: 1 });
    const vouches = await getVouches(items[0].id);
    const rows = ratingBreakdown(vouches);

    expect(rows).toHaveLength(5);
    expect(rows.reduce((sum, row) => sum + row.count, 0)).toBe(vouches.length);
    expect(rows.reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(1, 5);
  });

  it('ranks the highlights attendees ticked most often', async () => {
    const { items } = await searchMeetups({ perPage: 1 });
    const top = topHighlights(await getVouches(items[0].id));
    const counts = top.map((h) => h.count);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it('sorts by recency by default', async () => {
    const { items } = await searchMeetups({ perPage: 1 });
    const vouches = await getVouches(items[0].id);
    const times = vouches.map((v) => +new Date(v.createdAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});

describe('saves', () => {
  it('toggles on and off', async () => {
    const { items } = await searchMeetups({ perPage: 1 });
    const id = items[0].id;

    expect(await toggleSave('u005', id)).toBe(true);
    expect(await getSavedMeetupIds('u005')).toContain(id);

    expect(await toggleSave('u005', id)).toBe(false);
    expect(await getSavedMeetupIds('u005')).not.toContain(id);
  });
});

describe('aggregates', () => {
  it('counts upcoming meetups per city', async () => {
    const counts = await countMeetupsByCity();
    const { total } = await searchMeetups({ perPage: 1000 });
    expect(Object.values(counts).reduce((sum, n) => sum + n, 0)).toBe(total);
  });

  it('lists what a member hosts, and nobody else', async () => {
    const hosted = await getMeetupsHostedBy('u003');
    expect(hosted.length).toBeGreaterThan(0);
    for (const meetup of hosted) expect(meetup.hostId).toBe('u003');
  });
});

describe('business repository (demo mode)', () => {
  it('lists every seeded business by default', async () => {
    const page = await listBusinesses(parseBusinessQuery({}));
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.total).toBe(page.items.length <= DIRECTORY_PER_PAGE ? page.items.length : page.total);
    expect(page.page).toBe(1);
    expect(page.perPage).toBe(DIRECTORY_PER_PAGE);
  });

  it('filters by city', async () => {
    const page = await listBusinesses(parseBusinessQuery({ city: 'pune' }));
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((b) => b.citySlug === 'pune')).toBe(true);
  });

  it('filters by category', async () => {
    const page = await listBusinesses(parseBusinessQuery({ cat: 'cafes' }));
    expect(page.items.every((b) => b.categorySlug === 'cafes')).toBe(true);
  });

  it('matches a term against the name case-insensitively', async () => {
    const page = await listBusinesses(parseBusinessQuery({ q: 'vaishali' }));
    expect(page.items.map((b) => b.slug)).toContain('vaishali-fergusson-road-pune');
  });

  it('resolves a term that names a category rather than a business', async () => {
    const page = await listBusinesses(parseBusinessQuery({ q: 'cafe' }));
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.some((b) => b.categorySlug === 'cafes')).toBe(true);
  });

  it('resolves a term that only appears in a category blurb, not any name or slug', async () => {
    // The cafes category's blurb is "Coffee, and a table you can sit at for
    // three hours." A query for "coffee" alone would pass even without blurb
    // matching, because the seeded cafe is literally named "Third Wave
    // Coffee" — that would be a false-positive regression test. "sit at"
    // appears only in the blurb: not in the cafes name or slug, and not in
    // any seeded business name, so this only passes if blurb text is part of
    // the match surface.
    const page = await listBusinesses(parseBusinessQuery({ q: 'sit at' }));
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((b) => b.categorySlug === 'cafes')).toBe(true);
  });

  it('returns an empty page rather than throwing for a term nothing matches', async () => {
    const page = await listBusinesses(parseBusinessQuery({ q: 'zzzznotathing' }));
    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.pages).toBe(0);
  });

  it('defaults to the Recommended order — best-documented first', async () => {
    const page = await listBusinesses(parseBusinessQuery({}));
    const scores = page.items.map((b) => b.completeness);
    expect([...scores]).toEqual([...scores].sort((a, b) => b - a));
  });

  it('paginates', async () => {
    const all = await listBusinesses(parseBusinessQuery({}));
    const second = await listBusinesses({ ...parseBusinessQuery({}), perPage: 2, page: 2 });
    expect(second.page).toBe(2);
    expect(second.perPage).toBe(2);
    expect(second.items[0]?.id).not.toBe(all.items[0]?.id);
  });

  it('finds a business by slug and returns null for one that does not exist', async () => {
    expect((await getBusiness('vaishali-fergusson-road-pune'))?.name).toBe('Vaishali');
    expect(await getBusiness('no-such-place')).toBeNull();
  });

  it('returns the strongest listings for a city', async () => {
    const top = await topBusinesses('pune', 3);
    expect(top.length).toBeLessThanOrEqual(3);
    expect(top.every((b) => b.citySlug === 'pune')).toBe(true);
  });

  it('does not throw on a term containing PostgREST filter metacharacters', async () => {
    // Demo mode doesn't build a PostgREST filter string, so it can't exercise
    // the escaping path itself — but a search box has to survive whatever a
    // person types regardless of backend, so this guards that baseline.
    const page = await listBusinesses(parseBusinessQuery({ q: 'cafe, tea (best)' }));
    expect(Array.isArray(page.items)).toBe(true);
  });

  describe('escapePostgrestFilter', () => {
    it('escapes the characters PostgREST treats as filter syntax', () => {
      // `,` separates `.or()` branches, `()` groups/marks `in.()`, and `%`/`*`
      // are ilike/like wildcards — each has to be escaped or a term like
      // "cafe, tea" breaks out of the ilike clause it's meant to sit inside.
      expect(escapePostgrestFilter('cafe, tea')).toBe('cafe\\, tea');
      expect(escapePostgrestFilter('shop (best)')).toBe('shop \\(best\\)');
      expect(escapePostgrestFilter('50% off')).toBe('50\\% off');
      expect(escapePostgrestFilter('a*b')).toBe('a\\*b');
      expect(escapePostgrestFilter('vaishali')).toBe('vaishali');
    });

    it('escapes a literal backslash before escaping special characters, so a pre-existing backslash cannot neutralise the escape it inserts', () => {
      // Input is the four characters a \ , b. If the special-character pass
      // ran first (or in the same pass), the pre-existing `\` would sit next
      // to the `\` this function inserts before the comma; PostgREST reads
      // `\\` as one escaped literal backslash, consuming both and leaving
      // the comma unescaped again — the injection this function exists to
      // close. Escaping backslashes first means the original `\` becomes
      // `\\` on its own, and the comma still gets its own separate `\`.
      const input = 'a\\,b';
      expect([...input]).toEqual(['a', '\\', ',', 'b']);

      const output = escapePostgrestFilter(input);
      expect([...output]).toEqual(['a', '\\', '\\', '\\', ',', 'b']);
      expect(output).toBe('a\\\\\\,b');
    });
  });
});
