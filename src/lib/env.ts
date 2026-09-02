/**
 * The app has two interchangeable backends:
 *
 *  • Supabase  — used whenever NEXT_PUBLIC_SUPABASE_URL + ANON_KEY are present.
 *  • Demo mode — a seeded in-memory store, so `npm run dev` gives you a fully
 *    clickable product (search, auth, reviews, bookings) with no setup at all.
 *
 * Every repository function branches on `isSupabaseConfigured()`, which keeps
 * the decision in one place instead of scattered across pages.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const BACKEND_MODE = isSupabaseConfigured() ? 'supabase' : 'demo';
