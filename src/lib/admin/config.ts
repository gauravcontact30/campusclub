import type { UserProfile } from '@/types';

/**
 * Who can open /admin.
 *
 * An email allowlist rather than a role column, deliberately: the set is tiny,
 * it must survive a database being rebuilt from `baseline.sql`, and a role
 * column is one bad UPDATE away from granting the whole dashboard to somebody
 * else. Override with SUPER_ADMIN_EMAILS (comma-separated) when the owner
 * changes; the default is the account that owns this deployment.
 */
const DEFAULT_SUPER_ADMINS = ['garvcontact30@gmail.com'];

export const SUPER_ADMIN_EMAILS: string[] = (
  process.env.SUPER_ADMIN_EMAILS
    ? process.env.SUPER_ADMIN_EMAILS.split(',')
    : DEFAULT_SUPER_ADMINS
)
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isSuperAdmin(user: Pick<UserProfile, 'email'> | null | undefined): boolean {
  if (!user?.email) return false;
  return SUPER_ADMIN_EMAILS.includes(user.email.trim().toLowerCase());
}

/**
 * Routes that never generate telemetry.
 *
 * The dashboard's own traffic is excluded because an admin reading the log
 * would otherwise fill the log, and polling the live figures would show mostly
 * itself. Next's internals and the telemetry endpoint are excluded because
 * they are not features anybody visited.
 */
const IGNORED_PREFIXES = ['/admin', '/api/telemetry', '/_next', '/favicon', '/logo.svg'];

export function isTrackablePath(path: string): boolean {
  return !IGNORED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * Turns a URL into the feature it belongs to, so the dashboard reports "Meetup
 * detail" rather than thirty separate slugs. Ordered: the first match wins, so
 * the more specific patterns come first.
 */
const LABELS: [RegExp, string][] = [
  [/^\/$/, 'Home'],
  [/^\/meetups\/[^/]+\/feedback$/, 'Leave feedback'],
  [/^\/meetups\/[^/]+$/, 'Meetup detail'],
  [/^\/meetups$/, 'Browse the board'],
  [/^\/cities\/[^/]+$/, 'City page'],
  [/^\/cities$/, 'Cities index'],
  [/^\/stories\/[^/]+$/, 'Story'],
  [/^\/stories$/, 'Stories'],
  [/^\/passes$/, 'Passes & pricing'],
  [/^\/host$/, 'Host a meetup'],
  [/^\/my-meetups$/, 'Your meetups'],
  [/^\/saved$/, 'Saved meetups'],
  [/^\/profile\/interests$/, 'Pick interests'],
  [/^\/profile$/, 'Profile'],
  [/^\/login$/, 'Sign in'],
  [/^\/signup$/, 'Sign up'],
  [/^\/how-it-works$/, 'How it works'],
  [/^\/help$/, 'Help centre'],
  [/^\/safety$/, 'Trust & safety'],
  [/^\/legal/, 'Legal'],
  [/^\/api\/chat$/, 'Assistant'],
  [/^\/api\/meetups$/, 'Meetups API'],
  [/^\/api\/payments\/razorpay\/webhook$/, 'Payment webhook'],
  [/^\/api\/admin\/seed$/, 'Seed API'],
];

export function labelForPath(path: string): string {
  for (const [pattern, label] of LABELS) {
    if (pattern.test(path)) return label;
  }
  return path.startsWith('/api/') ? 'API' : 'Other page';
}

/**
 * Recorded against calls that arrive with no visitor cookie — a webhook, a
 * curl, a health check. Not a person, and must not be rendered as one.
 */
export const SERVER_VISITOR = 'server';

/**
 * The visitor id as shown in the dashboard: a short prefix, enough to tell two
 * anonymous sessions apart and useless for anything else. Slicing the sentinel
 * blindly produced "rver", which reads as a corrupted id rather than as what
 * it is.
 */
export function shortVisitor(visitorId: string): string {
  if (visitorId === SERVER_VISITOR) return 'no session';
  return visitorId.startsWith('v-') ? visitorId.slice(2, 10) : visitorId.slice(0, 8);
}

/** A visitor counts as "here now" if they did anything in this window. */
export const ACTIVE_WINDOW_MINUTES = 5;

/** Anything slower than this is worth an admin's attention even if it worked. */
export const SLOW_REQUEST_MS = 2000;
