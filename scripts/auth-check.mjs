#!/usr/bin/env node
/**
 * Proves the sign-up and sign-in flow works against the configured Supabase
 * project — or says precisely which of the several possible causes is stopping
 * it.
 *
 *   npm run auth:check
 *
 * This exists because "sign-up does not work" has at least five distinct
 * causes here, four of which are configuration rather than code, and they all
 * surface in the UI as the same shrug:
 *
 *   • the env vars are set under the wrong names, so the app is quietly in
 *     demo mode and never talked to Supabase at all
 *   • the project is unreachable or the anon key is wrong
 *   • the schema was never applied, so there is nothing for the sign-up
 *     trigger to write into
 *   • "Confirm email" is on with no custom SMTP, so every sign-up tries to
 *     send mail and dies on the built-in quota after two attempts
 *   • the trigger is missing, so accounts are created with no profile row
 *
 * It creates one throwaway account per run against a unique address. With a
 * service_role key present it deletes that account afterwards; without one it
 * says so and leaves it, since it cannot.
 *
 * Reads .env.local itself — this runs outside Next, so nothing has loaded it.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const c = {
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  bad: (s) => `\x1b[31m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

/** Values already in the environment win, matching how Next resolves them. */
function loadEnv() {
  const env = {};
  for (const file of ['.env.local', '.env']) {
    let raw;
    try {
      raw = readFileSync(resolve(ROOT, file), 'utf8');
    } catch {
      continue;
    }
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!(match[1] in env)) env[match[1]] = value;
    }
  }
  for (const key of Object.keys(env)) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return env;
}

const env = loadEnv();
const URL_RAW = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Same normalisation the app does, so a REST-suffixed URL is not reported as a
// different failure here than it produces there.
const SUPABASE_URL = URL_RAW.trim()
  .replace(/\/+$/, '')
  .replace(/\/(rest|auth|storage|realtime)\/v\d+$/, '');

const problems = [];
const notes = [];

function fail(headline, detail) {
  problems.push({ headline, detail });
  console.log(`  ${c.bad('x')} ${headline}`);
  if (detail) console.log(`      ${c.dim(detail)}`);
}
function pass(headline, detail) {
  console.log(`  ${c.ok('/')} ${headline}`);
  if (detail) console.log(`      ${c.dim(detail)}`);
}
function warn(headline, detail) {
  notes.push({ headline, detail });
  console.log(`  ${c.warn('!')} ${headline}`);
  if (detail) console.log(`      ${c.dim(detail)}`);
}

async function json(url, init) {
  const response = await fetch(url, init);
  let body = null;
  try {
    body = await response.json();
  } catch {
    /* empty or non-JSON body is fine; the status carries the meaning */
  }
  return { status: response.status, ok: response.ok, body };
}

/* ------------------------------------------------------------------ 1. env */

console.log(`\n${c.bold('1. Environment')}`);

if (!SUPABASE_URL || !ANON) {
  fail(
    'Supabase is not configured — the app is in demo mode.',
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local. ' +
      'The NEXT_PUBLIC_ prefix is required: a value under SUPABASE_URL is invisible to the app.',
  );
  console.log(`\n${c.bad('Cannot continue without a project to talk to.')}\n`);
  process.exit(1);
}

pass(`Project URL: ${SUPABASE_URL}`);
if (URL_RAW.trim() !== SUPABASE_URL) {
  warn('The URL had a REST/auth suffix and was normalised.', `Stored as ${URL_RAW.trim()} — store the bare project URL.`);
}
if (!SERVICE) warn('No SUPABASE_SERVICE_ROLE_KEY set.', 'The throwaway account cannot be cleaned up afterwards.');

/* -------------------------------------------------------------- 2. reach */

console.log(`\n${c.bold('2. Reachability and keys')}`);

const health = await json(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: ANON } });
if (health.ok) pass('Auth service reachable.');
else fail(`Auth service returned ${health.status}.`, 'Check the project URL and that the project is not paused.');

const restProbe = await json(`${SUPABASE_URL}/rest/v1/categories?select=slug&limit=1`, {
  headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
});
if (restProbe.ok) pass('Anon key accepted by PostgREST.');
else fail(`Anon key rejected by PostgREST (${restProbe.status}).`, JSON.stringify(restProbe.body));

if (SERVICE) {
  const admin = await json(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1`, {
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
  });
  if (admin.ok) pass('Service-role key accepted.');
  else
    fail(
      `Service-role key rejected (${admin.status}).`,
      `${admin.body?.message ?? ''} — copy it again from Project Settings → API. ` +
        'Anything that bypasses row-level security (seeding, admin user creation) is blocked until this works.',
    );
}

/* ------------------------------------------------------------- 3. schema */

console.log(`\n${c.bold('3. Schema')}`);

const categories = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=slug`, {
  headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Prefer: 'count=exact', Range: '0-0' },
});
const categoryCount = Number(categories.headers.get('content-range')?.split('/')[1] ?? 0);
if (categoryCount >= 24) pass(`${categoryCount} categories present.`);
else if (categoryCount > 0) warn(`Only ${categoryCount} categories.`, 'Re-run supabase/seed.sql.');
else fail('No categories.', 'The schema was never applied — run supabase/baseline.sql.');

const profilesProbe = await json(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
  headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
});
if (profilesProbe.ok) {
  pass('`profiles` exists.', 'It is the users table: one row per auth.users row, holding the sign-up details.');
} else {
  fail(`\`profiles\` not readable (${profilesProbe.status}).`, JSON.stringify(profilesProbe.body));
}

/* -------------------------------------------------------- 4. auth config */

console.log(`\n${c.bold('4. Auth configuration')}`);

const settings = await json(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: ANON } });
const autoconfirm = settings.body?.mailer_autoconfirm;
const signupDisabled = settings.body?.disable_signup;

if (signupDisabled) fail('Sign-ups are disabled for this project.', 'Authentication → Sign In / Providers → Allow new users.');
else pass('Sign-ups are allowed.');

if (autoconfirm) {
  pass('Email confirmation is off — sign-up returns a session immediately.');
} else {
  warn(
    'Email confirmation is ON.',
    'Every sign-up sends a confirmation email. Supabase’s built-in mailer allows only a couple per hour, ' +
      'so sign-ups start failing with over_email_send_rate_limit almost immediately. For development turn it off ' +
      '(Authentication → Sign In / Providers → Email → Confirm email); for production configure custom SMTP.',
  );
}

/* ------------------------------------------------------- 5. the real flow */

console.log(`\n${c.bold('5. Sign-up and sign-in')}`);

const email = `authcheck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}@example.com`;
const password = `check-${Math.random().toString(36).slice(2, 12)}A1!`;

const signup = await json(`${SUPABASE_URL}/auth/v1/signup`, {
  method: 'POST',
  headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, data: { full_name: 'Auth Check', city: 'Bengaluru' } }),
});

let userId = null;
let accessToken = null;

if (signup.status === 429 || signup.body?.error_code === 'over_email_send_rate_limit') {
  fail(
    'Sign-up rejected: the confirmation-email quota is exhausted.',
    'This is the "Confirm email is ON" consequence above, not a code fault. Turn confirmation off, ' +
      'or configure SMTP, then run this again.',
  );
} else if (!signup.ok) {
  fail(`Sign-up failed (${signup.status}).`, JSON.stringify(signup.body));
} else {
  userId = signup.body?.user?.id ?? signup.body?.id ?? null;
  accessToken = signup.body?.access_token ?? null;

  if (signup.body?.user?.identities?.length === 0) {
    fail('Sign-up returned an existing account.', 'That address is already registered.');
  } else if (accessToken) {
    pass('Sign-up succeeded and returned a session.');
  } else {
    warn('Sign-up created the account but returned no session.', 'Expected while email confirmation is on.');
  }
}

// The trigger writes the profile row, and RLS lets a member read only their
// own — so this needs the new account's own token, not the anon key.
if (accessToken) {
  const profile = await json(`${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,city&id=eq.${userId}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${accessToken}` },
  });
  const row = Array.isArray(profile.body) ? profile.body[0] : null;

  if (row) {
    const named = row.full_name === 'Auth Check' && row.city === 'Bengaluru';
    if (named) pass('The on_auth_user_created trigger wrote the profile row with the sign-up details.');
    else
      warn(
        'A profile row exists but did not carry the sign-up metadata.',
        `Got full_name=${JSON.stringify(row.full_name)}, city=${JSON.stringify(row.city)}. ` +
          'handle_new_user swallows its own exceptions, so check the Postgres logs for its warning.',
      );
  } else {
    fail(
      'No profile row was created for the new account.',
      'The on_auth_user_created trigger is missing or failed. Re-run supabase/baseline.sql; it is idempotent.',
    );
  }

  const signin = await json(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (signin.ok && signin.body?.access_token) pass('Sign-in with the same credentials returned a session.');
  else fail(`Sign-in failed (${signin.status}).`, JSON.stringify(signin.body));
}

/* ------------------------------------------------------------- 6. cleanup */

if (userId && SERVICE) {
  const deleted = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
  });
  console.log(`\n${c.bold('6. Cleanup')}`);
  if (deleted.ok) pass(`Removed the throwaway account ${email}.`);
  else warn(`Could not remove ${email} (${deleted.status}).`, 'Delete it by hand in Authentication → Users.');
} else if (userId) {
  console.log(`\n${c.bold('6. Cleanup')}`);
  warn(`Left the throwaway account ${email} behind.`, 'No usable service-role key to delete it with.');
}

/* -------------------------------------------------------------- verdict */

console.log('');
if (problems.length === 0 && notes.length === 0) {
  console.log(c.ok('Sign-up and sign-in both work against this project.\n'));
  process.exit(0);
}
if (problems.length === 0) {
  console.log(c.warn(`Working, with ${notes.length} thing(s) worth knowing about.\n`));
  process.exit(0);
}
console.log(c.bad(`${problems.length} problem(s) found:`));
for (const p of problems) console.log(`  - ${p.headline}`);
console.log('');
process.exit(1);
