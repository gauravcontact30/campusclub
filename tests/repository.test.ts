import { beforeEach, describe, expect, it } from 'vitest';
import { claimBusiness, getBusinessBySlug, getBusinessesOwnedBy, searchBusinesses } from '@/lib/data/businesses';
import { getReviews, ratingBreakdown, setOwnerResponse, toggleHelpful, upsertReview } from '@/lib/data/reviews';
import { bookSeat, cancelBooking, getBookingsForUser, getDinners } from '@/lib/data/dinners';
import { getSavedBusinessIds, toggleSave } from '@/lib/data/saves';
import { db, resetDb } from '@/lib/data/store';

// No Supabase env in tests, so every call exercises the demo adapter.
beforeEach(() => {
  resetDb();
});

describe('searchBusinesses', () => {
  it('paginates', async () => {
    const page1 = await searchBusinesses({ perPage: 5, page: 1 });
    const page2 = await searchBusinesses({ perPage: 5, page: 2 });

    expect(page1.items).toHaveLength(5);
    expect(page1.pages).toBe(Math.ceil(page1.total / 5));
    expect(page1.items[0].id).not.toBe(page2.items[0].id);
  });

  it('filters by free-text term across name, tags and neighbourhood', async () => {
    const { items } = await searchBusinesses({ term: 'coffee', perPage: 50 });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const haystack = [item.name, item.description, item.categorySlug, item.neighborhood, ...item.tags].join(' ').toLowerCase();
      expect(haystack).toContain('coffee');
    }
  });

  it('filters by city, category and price together', async () => {
    const { items } = await searchBusinesses({ city: 'london', category: 'cafes', price: [2], perPage: 50 });
    for (const item of items) {
      expect(item.city).toBe('London');
      expect(item.categorySlug).toBe('cafes');
      expect(item.priceLevel).toBe(2);
    }
  });

  it('sorts by rating descending', async () => {
    const { items } = await searchBusinesses({ sort: 'rating', perPage: 10 });
    const ratings = items.map((i) => i.rating);
    expect([...ratings].sort((a, b) => b - a)).toEqual(ratings);
  });

  it('derives rating and review count from reviews', async () => {
    const business = await getBusinessBySlug('third-wave-filter-room-bengaluru');
    const reviews = await getReviews(business!.id);
    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    expect(business!.reviewCount).toBe(reviews.length);
    expect(business!.rating).toBeCloseTo(Math.round(average * 10) / 10, 1);
  });
});

describe('reviews', () => {
  it('upserts one review per user and recomputes the rating', async () => {
    const business = (await getBusinessBySlug('nandini-dosa-camp-bengaluru'))!;
    const before = business.reviewCount;

    await upsertReview({
      businessId: business.id,
      userId: 'test-user',
      authorName: 'Test User',
      authorAvatar: null,
      rating: 5,
      title: 'Excellent',
      body: 'A very long and detailed review body that easily clears the minimum length.',
    });

    const afterFirst = (await getBusinessBySlug('nandini-dosa-camp-bengaluru'))!;
    expect(afterFirst.reviewCount).toBe(before + 1);

    // Second submission edits rather than duplicates.
    await upsertReview({
      businessId: business.id,
      userId: 'test-user',
      authorName: 'Test User',
      authorAvatar: null,
      rating: 2,
      title: 'Changed my mind',
      body: 'A very long and detailed review body that easily clears the minimum length.',
    });

    const afterSecond = (await getBusinessBySlug('nandini-dosa-camp-bengaluru'))!;
    expect(afterSecond.reviewCount).toBe(before + 1);
    expect(afterSecond.rating).toBeLessThan(afterFirst.rating);
  });

  it('toggles a helpful vote on and off', async () => {
    const business = (await getBusinessBySlug('copper-rye-bengaluru'))!;
    const [review] = await getReviews(business.id);

    const up = await toggleHelpful(review.id, 'voter-1');
    expect(up).toBe(review.helpfulCount + 1);

    const down = await toggleHelpful(review.id, 'voter-1');
    expect(down).toBe(review.helpfulCount);
  });

  it('builds a five-row rating breakdown', async () => {
    const business = (await getBusinessBySlug('copper-rye-bengaluru'))!;
    const breakdown = ratingBreakdown(await getReviews(business.id));

    expect(breakdown).toHaveLength(5);
    expect(breakdown[0].star).toBe(5);
    expect(breakdown.reduce((sum, row) => sum + row.count, 0)).toBe(business.reviewCount);
  });

  it('sorts reviews by the requested order', async () => {
    const business = (await getBusinessBySlug('copper-rye-bengaluru'))!;
    const helpful = await getReviews(business.id, 'helpful');
    const counts = helpful.map((r) => r.helpfulCount);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });
});

describe('saves', () => {
  it('toggles a bookmark for one user only', async () => {
    const business = (await getBusinessBySlug('peckham-roasters-london'))!;

    expect(await toggleSave('u002', business.id)).toBe(true);
    expect(await getSavedBusinessIds('u002')).toContain(business.id);
    expect(await getSavedBusinessIds('u003')).not.toContain(business.id);

    expect(await toggleSave('u002', business.id)).toBe(false);
    expect(await getSavedBusinessIds('u002')).not.toContain(business.id);
  });
});

describe('dinner bookings', () => {
  it('confirms a seat and increments the counter', async () => {
    const [event] = await getDinners();
    const before = event.seatsTaken;

    const booking = await bookSeat('u003', event.id);
    expect(booking.status).toBe('confirmed');

    const [after] = await getDinners();
    expect(after.seatsTaken).toBe(before + 1);
  });

  it('waitlists once the table is full', async () => {
    const events = await getDinners();
    const full = events.find((e) => e.seatsTaken >= e.seatsTotal)!;

    const booking = await bookSeat('u004', full.id);
    expect(booking.status).toBe('waitlisted');
  });

  it('is idempotent — booking twice keeps one seat', async () => {
    const [event] = await getDinners();
    const first = await bookSeat('u005', event.id);
    const second = await bookSeat('u005', event.id);

    expect(second.id).toBe(first.id);
    const bookings = await getBookingsForUser('u005');
    expect(bookings).toHaveLength(1);
  });

  it('releases the seat on cancellation', async () => {
    const [event] = await getDinners();
    const booking = await bookSeat('u006', event.id);
    const taken = (await getDinners())[0].seatsTaken;

    await cancelBooking('u006', booking.id);

    expect((await getDinners())[0].seatsTaken).toBe(taken - 1);
    const live = (await getBookingsForUser('u006')).filter((b) => b.status !== 'cancelled');
    expect(live).toHaveLength(0);
  });
});

describe('claiming a listing', () => {
  it('hands an unclaimed listing to the claimant and files the claim', async () => {
    const business = (await getBusinessBySlug('nandini-dosa-camp-bengaluru'))!;
    expect(business.ownerId).toBeNull();

    const claimed = await claimBusiness({
      businessId: business.id,
      userId: 'u007',
      role: 'Owner',
      contactEmail: 'owner@dosa.example',
      phone: '+91 80 1234 5678',
      note: '',
    });

    expect(claimed?.ownerId).toBe('u007');
    expect(claimed?.isClaimed).toBe(true);
    expect(db().claims).toHaveLength(1);
    expect((await getBusinessesOwnedBy('u007')).map((b) => b.id)).toContain(business.id);
  });

  it('refuses a listing that already has an owner', async () => {
    const business = (await getBusinessBySlug('copper-rye-bengaluru'))!;
    expect(business.ownerId).not.toBeNull();

    const claimed = await claimBusiness({
      businessId: business.id,
      userId: 'u007',
      role: 'Manager',
      contactEmail: 'someone@else.example',
      phone: '+91 80 0000 0000',
      note: '',
    });

    expect(claimed).toBeNull();
    expect((await getBusinessBySlug('copper-rye-bengaluru'))!.ownerId).toBe(business.ownerId);
  });
});

describe('owner replies', () => {
  it('publishes and withdraws a public response', async () => {
    const business = (await getBusinessBySlug('peckham-roasters-london'))!;
    const [review] = await getReviews(business.id);

    const replied = await setOwnerResponse(review.id, 'Thanks — the second grinder lands next week.');
    expect(replied?.ownerResponse).toContain('second grinder');
    expect(replied?.ownerResponseAt).toBeTruthy();

    const withdrawn = await setOwnerResponse(review.id, null);
    expect(withdrawn?.ownerResponse).toBeNull();
    expect(withdrawn?.ownerResponseAt).toBeNull();
  });

  it('leaves the review itself untouched', async () => {
    const business = (await getBusinessBySlug('peckham-roasters-london'))!;
    const [review] = await getReviews(business.id);

    const replied = await setOwnerResponse(review.id, 'A reply that is comfortably long enough.');

    expect(replied?.rating).toBe(review.rating);
    expect(replied?.title).toBe(review.title);
    expect(replied?.body).toBe(review.body);
  });
});

describe('searching near a location', () => {
  // Indiranagar, Bengaluru
  const near = { lat: 12.9719, lng: 77.6412 };

  it('tags every result with a distance', async () => {
    const { items } = await searchBusinesses({ near, perPage: 5 });
    for (const item of items) expect(typeof item.distanceKm).toBe('number');
  });

  it('orders by proximity and puts the local café first', async () => {
    const { items } = await searchBusinesses({ near, sort: 'distance', perPage: 50 });
    const distances = items.map((i) => i.distanceKm!);

    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
    expect(items[0].city).toBe('Bengaluru');
    expect(distances[0]).toBeLessThan(1);
  });

  it('omits distance when no coordinates are given', async () => {
    const { items } = await searchBusinesses({ perPage: 3 });
    for (const item of items) expect(item.distanceKm).toBeUndefined();
  });
});
