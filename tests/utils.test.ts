import { describe, expect, it } from 'vitest';
import {
  dayLabel,
  durationLabel,
  formatDistance,
  formatFee,
  formatMoney,
  hasStarted,
  initials,
  pluralize,
  slugify,
  spotsState,
} from '@/lib/utils';

describe('money', () => {
  it('formats whole rupees without decimals', () => {
    expect(formatMoney(14900)).toBe('₹149');
  });

  it('keeps paise when an amount actually has them', () => {
    expect(formatMoney(14950)).toBe('₹149.50');
  });

  it('says "Free" rather than ₹0, because that is the word on the card', () => {
    expect(formatFee(0)).toBe('Free');
    expect(formatFee(4900)).toBe('₹49');
  });
});

describe('spotsState', () => {
  it('reports what is left and reads out loud', () => {
    const s = spotsState(6, 8);
    expect(s.left).toBe(2);
    expect(s.label).toBe('2 spots left');
    expect(s.full).toBe(false);
  });

  it('drops the plural at one', () => {
    expect(spotsState(7, 8).label).toBe('1 spot left');
  });

  it('marks a full meetup as a waitlist rather than an error', () => {
    const s = spotsState(8, 8);
    expect(s.full).toBe(true);
    expect(s.left).toBe(0);
    expect(s.label).toMatch(/waitlist/i);
  });

  it('calls it scarce only when a quarter or less is left', () => {
    expect(spotsState(6, 8).scarce).toBe(true);
    expect(spotsState(4, 8).scarce).toBe(false);
    // Nothing sold yet is not scarcity, however small the meetup.
    expect(spotsState(0, 2).scarce).toBe(false);
  });

  it('never goes negative or divides by zero on bad data', () => {
    expect(spotsState(12, 8).left).toBe(0);
    expect(spotsState(0, 0).fraction).toBe(0);
  });
});

describe('time', () => {
  const iso = (d: Date) => d.toISOString();

  it('names today and tomorrow by calendar day, not elapsed hours', () => {
    const now = new Date(2026, 8, 3, 23, 30);
    const lateTonight = new Date(2026, 8, 3, 23, 45);
    const earlyTomorrow = new Date(2026, 8, 4, 1, 0);

    // Only 15 and 90 minutes apart, but different days — which is what a
    // person reading a card actually cares about.
    expect(dayLabel(iso(lateTonight), now)).toBe('Today');
    expect(dayLabel(iso(earlyTomorrow), now)).toBe('Tomorrow');
  });

  it('falls back to a date further out', () => {
    const now = new Date(2026, 8, 3, 10, 0);
    expect(dayLabel(iso(new Date(2026, 8, 10, 10, 0)), now)).toMatch(/Sep/);
  });

  it('describes a duration in hours and minutes', () => {
    const start = new Date(2026, 8, 3, 9, 0);
    expect(durationLabel(iso(start), iso(new Date(2026, 8, 3, 10, 30)))).toBe('1 hr 30 min');
    expect(durationLabel(iso(start), iso(new Date(2026, 8, 3, 11, 0)))).toBe('2 hr');
    expect(durationLabel(iso(start), iso(new Date(2026, 8, 3, 9, 45)))).toBe('45 min');
  });

  it('knows whether a meetup has already begun', () => {
    const now = new Date(2026, 8, 3, 12, 0);
    expect(hasStarted(iso(new Date(2026, 8, 3, 11, 0)), now)).toBe(true);
    expect(hasStarted(iso(new Date(2026, 8, 3, 13, 0)), now)).toBe(false);
  });
});

describe('formatting odds and ends', () => {
  it('shortens distances the way a person would say them', () => {
    expect(formatDistance(0.02)).toBe('Nearby');
    expect(formatDistance(0.6)).toBe('600 m');
    expect(formatDistance(4.24)).toBe('4.2 km');
    expect(formatDistance(23.6)).toBe('24 km');
  });

  it('slugifies titles into something linkable', () => {
    expect(slugify('Deep work table — 3 hours, phones in the box')).toBe(
      'deep-work-table-3-hours-phones-in-the-box',
    );
  });

  it('takes at most two initials', () => {
    expect(initials('Ananya Rao')).toBe('AR');
    expect(initials('Arjun Kumar Reddy')).toBe('AK');
  });

  it('pluralises', () => {
    expect(pluralize(1, 'credit')).toBe('1 credit');
    expect(pluralize(4, 'credit')).toBe('4 credits');
  });
});
