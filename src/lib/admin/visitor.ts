import { cookies } from 'next/headers';

export const VISITOR_COOKIE = 'cc_visitor';

export const VISITOR_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 180,
  secure: process.env.NODE_ENV === 'production',
};

/**
 * A random, opaque id in a first-party cookie.
 *
 * It exists so the dashboard can say "one person read four pages" instead of
 * "four page views". It is not derived from anything about the person — no IP
 * hash, no fingerprint — so on its own it identifies nobody, and clearing
 * cookies genuinely resets it. httpOnly, so page scripts cannot read it back
 * out and correlate it with anything else.
 */
export function newVisitorId(): string {
  return `v-${crypto.randomUUID()}`;
}

/** Reads the current visitor id, or null before the proxy has issued one. */
export async function readVisitorId(): Promise<string | null> {
  return (await cookies()).get(VISITOR_COOKIE)?.value ?? null;
}
