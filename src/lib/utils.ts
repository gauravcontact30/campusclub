import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { WeekHours } from '@/types';
import { CITY_CURRENCY, DEFAULT_CURRENCY } from '@/lib/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatMoney(cents: number, currency = 'INR', locale = 'en-IN') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Same amount, formatted in the currency the city actually charges in. */
export function formatMoneyForCity(cents: number, city: string) {
  const currency = CITY_CURRENCY[city] ?? DEFAULT_CURRENCY;
  return formatMoney(cents, currency.code, currency.locale);
}

/** "$$$" / "₹₹" — the price tier in the local currency symbol. */
export function priceLabel(level: number, city?: string) {
  const symbol = (city && CITY_CURRENCY[city]?.symbol) ?? DEFAULT_CURRENCY.symbol;
  return symbol.repeat(Math.max(1, Math.min(4, level)));
}

export function formatCount(n: number) {
  return new Intl.NumberFormat('en-US', { notation: n >= 10000 ? 'compact' : 'standard' }).format(n);
}

/** "3 Sep, 8:00 PM" */
export function formatDateTime(iso: string, locale = 'en-GB') {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(mins) < 60) return rtf.format(-mins, 'minute');
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(-days, 'day');
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return rtf.format(-months, 'month');
  return rtf.format(-Math.round(months / 12), 'year');
}

/** Monday-first index for JS getDay() (0 = Sunday) */
export function weekIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

/** Minutes-since-midnight window for a day, unfolded past midnight when needed. */
function dayWindow(day: WeekHours[number] | undefined) {
  if (!day?.open || !day?.close) return null;
  const [oh, om] = day.open.split(':').map(Number);
  const [ch, cm] = day.close.split(':').map(Number);
  const start = oh * 60 + om;
  let end = ch * 60 + cm;
  if (end <= start) end += 24 * 60; // spills past midnight
  return { start, end };
}

/**
 * The window a venue is currently inside, or null when it is shut.
 * Checks yesterday too, so a bar that opened at 18:00 and closes at 02:00 still
 * reads as open at one in the morning.
 */
export function currentOpenWindow(hours: WeekHours, now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const todayIndex = weekIndex(now);

  const today = dayWindow(hours[todayIndex]);
  if (today && minutes >= today.start && minutes <= today.end) {
    return { dayIndex: todayIndex, closesAt: hours[todayIndex].close! };
  }

  const yesterdayIndex = (todayIndex + 6) % 7;
  const yesterday = dayWindow(hours[yesterdayIndex]);
  const carried = minutes + 24 * 60;
  if (yesterday && carried >= yesterday.start && carried <= yesterday.end) {
    return { dayIndex: yesterdayIndex, closesAt: hours[yesterdayIndex].close! };
  }

  return null;
}

export function isOpenNow(hours: WeekHours, now = new Date()) {
  return currentOpenWindow(hours, now) !== null;
}

/** "Open until 9:00 PM" / "Opens Mon 9:00 AM" — one primitive, safe to snapshot. */
export function openStatusLabel(hours: WeekHours, now = new Date()) {
  const open = currentOpenWindow(hours, now);
  if (open) return `Open until ${to12h(open.closesAt)}`;

  const next = nextOpening(hours, now);
  if (!next) return 'Temporarily closed';
  if (next.offset === 0) return `Opens ${to12h(next.open)}`;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return `Opens ${days[next.dayIndex]} ${to12h(next.open)}`;
}

export function nextOpening(hours: WeekHours, now = new Date()) {
  for (let offset = 0; offset < 7; offset++) {
    const idx = (weekIndex(now) + offset) % 7;
    const day = hours[idx];
    if (day?.open) return { dayIndex: idx, open: day.open, offset };
  }
  return null;
}

export function to12h(time: string) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Haversine distance in km — powers the "x km away" chips */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** Deterministic 0..n-1 bucket from a string — used for placeholder gradients */
export function hashIndex(seed: string, buckets: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % buckets;
}

export function pluralize(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
