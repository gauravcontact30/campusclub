import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CURRENCY } from '@/lib/constants';

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

/* ------------------------------------------------------------------ */
/* Money — everything is stored in paise, formatted once, here         */
/* ------------------------------------------------------------------ */

export function formatMoney(cents: number) {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** "Free" reads better than "₹0" on a card, and it is the honest word. */
export function formatFee(cents: number) {
  return cents === 0 ? 'Free' : formatMoney(cents);
}

export function formatCount(n: number) {
  return new Intl.NumberFormat('en-IN', { notation: n >= 10000 ? 'compact' : 'standard' }).format(n);
}

/* ------------------------------------------------------------------ */
/* Time                                                                */
/* ------------------------------------------------------------------ */

/** "Thu 4 Sep, 8:00 PM" */
export function formatDateTime(iso: string, locale = 'en-IN') {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** "8:00 PM" */
export function formatTime(iso: string, locale = 'en-IN') {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

/** "Thu 4 Sep" */
export function formatDay(iso: string, locale = 'en-IN') {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(iso),
  );
}

/**
 * "Today" / "Tomorrow" / "Thu 4 Sep" — the label on a meetup card's date chip.
 * Compared on calendar days, not on elapsed hours, so 11pm tonight and 1am
 * tomorrow do not both read as "in 2 hours' time, today".
 */
export function dayLabel(iso: string, now = new Date()) {
  const target = new Date(iso);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(target) - startOfDay(now)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return formatDay(iso);
}

/** "1 hr 30 min" from two ISO timestamps. */
export function durationLabel(startsAt: string, endsAt: string) {
  const mins = Math.max(0, Math.round((+new Date(endsAt) - +new Date(startsAt)) / 60_000));
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (!hours) return `${rest} min`;
  if (!rest) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
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

export function hasStarted(iso: string, now = new Date()) {
  return new Date(iso) <= now;
}

/* ------------------------------------------------------------------ */
/* Spots                                                               */
/* ------------------------------------------------------------------ */

export interface SpotsState {
  left: number;
  taken: number;
  total: number;
  full: boolean;
  /** Under a quarter of the spots left, and at least one gone. */
  scarce: boolean;
  label: string;
  fraction: number;
}

export function spotsState(taken: number, total: number): SpotsState {
  const safeTotal = Math.max(1, total);
  const left = Math.max(0, safeTotal - taken);
  const full = left === 0;
  const scarce = !full && taken > 0 && left / safeTotal <= 0.25;
  return {
    left,
    taken,
    total: safeTotal,
    full,
    scarce,
    fraction: Math.min(1, taken / safeTotal),
    label: full ? 'Full — join the waitlist' : left === 1 ? '1 spot left' : `${left} spots left`,
  };
}

/* ------------------------------------------------------------------ */
/* Geography                                                           */
/* ------------------------------------------------------------------ */

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

/** "Nearby" on the doorstep, "600 m" under a kilometre, "4.2 km" above it. */
export function formatDistance(km: number) {
  if (km < 0.05) return 'Nearby';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/* ------------------------------------------------------------------ */
/* Odds and ends                                                       */
/* ------------------------------------------------------------------ */

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** Deterministic 0..n-1 bucket from a string — used for generated artwork */
export function hashIndex(seed: string, buckets: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % buckets;
}

export function pluralize(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
