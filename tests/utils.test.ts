import { describe, expect, it } from 'vitest';
import {
  distanceKm,
  formatMoneyForCity,
  hashIndex,
  initials,
  isOpenNow,
  nextOpening,
  pluralize,
  priceLabel,
  slugify,
  to12h,
} from '@/lib/utils';
import type { WeekHours } from '@/types';

const h = (open: string | null, close: string | null) => ({ open, close });
const weekdayHours: WeekHours = [
  h('09:00', '17:00'), // Mon
  h('09:00', '17:00'),
  h('09:00', '17:00'),
  h('09:00', '17:00'),
  h('09:00', '17:00'), // Fri
  h(null, null), // Sat
  h(null, null), // Sun
];

const lateBar: WeekHours = Array.from({ length: 7 }, () => h('18:00', '02:00')) as WeekHours;

describe('slugify', () => {
  it('produces url-safe slugs', () => {
    expect(slugify('Third Wave Filter Room')).toBe('third-wave-filter-room');
    expect(slugify('  Café  &  Bar!  ')).toBe('caf-bar');
  });
});

describe('isOpenNow', () => {
  it('is open inside the window', () => {
    // Wednesday 12:00
    expect(isOpenNow(weekdayHours, new Date('2026-09-02T12:00:00'))).toBe(true);
  });

  it('is closed outside the window', () => {
    expect(isOpenNow(weekdayHours, new Date('2026-09-02T18:30:00'))).toBe(false);
  });

  it('is closed on a day with no hours', () => {
    // Saturday
    expect(isOpenNow(weekdayHours, new Date('2026-09-05T12:00:00'))).toBe(false);
  });

  it('handles windows that spill past midnight', () => {
    expect(isOpenNow(lateBar, new Date('2026-09-02T01:00:00'))).toBe(true);
    expect(isOpenNow(lateBar, new Date('2026-09-02T15:00:00'))).toBe(false);
  });
});

describe('nextOpening', () => {
  it('skips closed days to find the next opening', () => {
    // Saturday → next opening is Monday
    const next = nextOpening(weekdayHours, new Date('2026-09-05T12:00:00'));
    expect(next).toEqual({ dayIndex: 0, open: '09:00', offset: 2 });
  });
});

describe('money and price tiers', () => {
  it('formats in the currency of the city', () => {
    expect(formatMoneyForCity(129900, 'Bengaluru')).toContain('₹');
    expect(formatMoneyForCity(349900, 'London')).toContain('£');
    expect(formatMoneyForCity(399900, 'New York')).toContain('$');
  });

  it('renders price tiers with the local symbol', () => {
    expect(priceLabel(3, 'New York')).toBe('$$$');
    expect(priceLabel(2, 'Bengaluru')).toBe('₹₹');
    expect(priceLabel(9, 'London')).toBe('££££'); // clamped
  });
});

describe('misc helpers', () => {
  it('converts 24h to 12h', () => {
    expect(to12h('09:00')).toBe('9:00 AM');
    expect(to12h('00:30')).toBe('12:30 AM');
    expect(to12h('13:45')).toBe('1:45 PM');
  });

  it('measures distance between two points', () => {
    const km = distanceKm({ lat: 12.9719, lng: 77.6412 }, { lat: 12.9345, lng: 77.6266 });
    expect(km).toBeGreaterThan(3);
    expect(km).toBeLessThan(6);
  });

  it('buckets deterministically', () => {
    expect(hashIndex('abc', 6)).toBe(hashIndex('abc', 6));
    expect(hashIndex('abc', 6)).toBeLessThan(6);
  });

  it('pluralises and initials', () => {
    expect(pluralize(1, 'review')).toBe('1 review');
    expect(pluralize(4, 'review')).toBe('4 reviews');
    expect(initials('Priya Nair')).toBe('PN');
  });
});
