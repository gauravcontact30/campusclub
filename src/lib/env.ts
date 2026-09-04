/**
 * The app has two backends, but they are not interchangeable everywhere:
 *
 *  • Supabase  — used whenever NEXT_PUBLIC_SUPABASE_URL + ANON_KEY are present.
 *  • Demo mode — a seeded in-memory store, so `npm run dev` gives you a
 *    clickable catalogue (browse, search, meetup pages, the assistant) with no
 *    setup at all.
 *
 * Authentication is the deliberate exception. There is no demo sign-in: with
 * no Supabase project the auth pages say so rather than minting a session that
 * looks real and owns nothing. Anything behind sign-in is therefore
 * unreachable in demo mode, which is the honest behaviour.
 *
 * Every repository function branches on `isSupabaseConfigured()`, which keeps
 * the decision in one place instead of scattered across pages.
 */

/**
 * Supabase hands out two URLs on the same settings page, and the wrong one is
 * easy to copy: the *Project URL* (`https://xxx.supabase.co`) and the REST
 * endpoint (`.../rest/v1/`). The client libraries append their own paths, so a
 * REST-suffixed value produces requests to `/rest/v1/auth/v1/token` — a 404
 * that surfaces as "invalid credentials" and sends you hunting through the
 * wrong half of the stack. Normalising here costs nothing and removes a whole
 * class of deployment support question.
 */
export function normaliseSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.replace(/\/(rest|auth|storage|realtime)\/v\d+$/, '');
}

export const SUPABASE_URL = normaliseSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
export const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const BACKEND_MODE = isSupabaseConfigured() ? 'supabase' : 'demo';
