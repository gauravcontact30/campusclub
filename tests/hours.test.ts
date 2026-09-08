import { describe, expect, it } from 'vitest';
import { parseOpeningHours } from '../scripts/lib/hours.mjs';
import { isOpenAt } from '@/lib/directory/hours';

/** 2026-09-07 is a Monday. Local time, which is what the parser works in. */
const mon = (h: number, m = 0) => new Date(2026, 8, 7, h, m);
const sat = (h: number, m = 0) => new Date(2026, 8, 12, h, m);
const sun = (h: number, m = 0) => new Date(2026, 8, 13, h, m);

describe('parseOpeningHours', () => {
  it('parses a simple weekday range', () => {
    expect(parseOpeningHours('Mo-Fr 09:00-17:00').mon).toEqual([{ open: 540, close: 1020 }]);
  });

  it('parses 24/7 as every day, all day', () => {
    const hours = parseOpeningHours('24/7');
    expect(hours.mon).toEqual([{ open: 0, close: 1440 }]);
    expect(hours.sun).toEqual([{ open: 0, close: 1440 }]);
  });

  it('keeps a shift crossing midnight as one interval past 1440', () => {
    expect(parseOpeningHours('Mo 18:00-02:00').mon).toEqual([{ open: 1080, close: 1560 }]);
  });

  it('parses split shifts on one day', () => {
    expect(parseOpeningHours('Mo 09:00-13:00,17:00-21:00').mon).toEqual([
      { open: 540, close: 780 },
      { open: 1020, close: 1260 },
    ]);
  });

  it('parses several rules separated by semicolons', () => {
    const hours = parseOpeningHours('Mo-Fr 09:00-18:00; Sa 10:00-14:00');
    expect(hours.fri).toEqual([{ open: 540, close: 1080 }]);
    expect(hours.sat).toEqual([{ open: 600, close: 840 }]);
    expect(hours.sun).toBeUndefined();
  });

  it('records an explicit closed day as no intervals', () => {
    const hours = parseOpeningHours('Mo-Sa 09:00-18:00; Su off');
    expect(hours.sun).toEqual([]);
  });

  it('returns an empty object for junk rather than throwing', () => {
    expect(parseOpeningHours('by appointment')).toEqual({});
    expect(parseOpeningHours('')).toEqual({});
  });
});

describe('isOpenAt', () => {
  const office = parseOpeningHours('Mo-Fr 09:00-17:00');

  it('is open inside the interval and closed outside it', () => {
    expect(isOpenAt(office, mon(12))).toBe(true);
    expect(isOpenAt(office, mon(8, 59))).toBe(false);
    expect(isOpenAt(office, sat(12))).toBe(false);
  });

  it('treats the closing minute as closed', () => {
    expect(isOpenAt(office, mon(17))).toBe(false);
    expect(isOpenAt(office, mon(16, 59))).toBe(true);
  });

  it('stays open after midnight for a shift that began the day before', () => {
    const bar = parseOpeningHours('Sa 18:00-02:00');
    expect(isOpenAt(bar, sat(23))).toBe(true);
    expect(isOpenAt(bar, sun(1))).toBe(true);   // still Saturday's shift
    expect(isOpenAt(bar, sun(3))).toBe(false);
  });

  it('is always open for 24/7 and never open with no hours', () => {
    expect(isOpenAt(parseOpeningHours('24/7'), sun(4))).toBe(true);
    expect(isOpenAt({}, mon(12))).toBe(false);
  });
});
