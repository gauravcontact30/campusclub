#!/usr/bin/env node
/**
 * campusclub_db doctor.
 *
 * Answers one question: is this Supabase project ready for the app to run
 * against, and if not, exactly what is missing?
 *
 *   npm run db:check
 *
 * Checks, in order:
 *   1. the three keys are present in .env.local
 *   2. the project answers at all (URL + anon key are valid)
 *   3. every table and view the repository layer reads exists
 *   4. every RPC the join/credit flows call exists
 *   5. the 24 categories are loaded
 *   6. row-level security is actually on (anon cannot read payments)
 *
 * Exits non-zero when anything is missing, so it can gate a deploy.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ */
/* Env                                                                 */
/* ------------------------------------------------------------------ */

/** Minimal .env reader — avoids adding dotenv just for this script. */
function loadEnvFile(name) {
  const path = resolve(ROOT, name);
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    out[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

const fileEnv = { ...loadEnvFile('.env.local'), ...loadEnvFile('.env') };
const env = (key) => process.env[key] || fileEnv[key] || '';

const URL = env('NEXT_PUBLIC_SUPABASE_URL');
const ANON = env('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const SERVICE = env('SUPABASE_SERVICE_ROLE_KEY');

/* ------------------------------------------------------------------ */
/* Reporting                                                           */
/* ------------------------------------------------------------------ */

const results = [];
const ok = (label, note = '') => results.push({ state: 'ok', label, note });
const bad = (label, note = '') => results.push({ state: 'fail', label, note });
const warn = (label, note = '') => results.push({ state: 'warn', label, note });

function report() {
  const icon = { ok: '✓', fail: '✗', warn: '!' };
  const colour = { ok: '\x1b[32m', fail: '\x1b[31m', warn: '\x1b[33m' };
  console.log('');
  for (const r of results) {
    console.log(`  ${colour[r.state]}${icon[r.state]}\x1b[0m ${r.label}${r.note ? `\n      ${r.note}` : ''}`);
  }
  const failed = results.filter((r) => r.state === 'fail').length;
  console.log('');
  if (failed) {
    console.log(`\x1b[31m${failed} check${failed === 1 ? '' : 's'} failed.\x1b[0m`);
    console.log('Run supabase/baseline.sql against the project, then try again.\n');
  } else {
    console.log('\x1b[32mcampusclub_db is ready.\x1b[0m\n');
  }
  process.exit(failed ? 1 : 0);
}

/* ------------------------------------------------------------------ */
/* What the app needs                                                  */
/* ------------------------------------------------------------------ */

// Every relation the repository layer in src/lib/data/* selects from.
const RELATIONS = [
  'profiles',
  'categories',
  'meetups',
  'joins',
  'payments',
  'vouches',
  'saves',
  'meetups_with_stats',
  'profiles_with_host_stats',
  'vouches_with_author',
  'joins_with_member',
];

// RPCs called by the join, cancel and pass-credit flows. Each is probed with
// arguments that are well-formed but match nothing, so a successful call is
// proof the function exists without mutating a row.
const RPCS = [
  ['increment_spots_taken', { p_meetup_id: '00000000-0000-0000-0000-000000000000' }],
  ['decrement_spots_taken', { p_meetup_id: '00000000-0000-0000-0000-000000000000' }],
  ['spend_join_credit', { p_user_id: '00000000-0000-0000-0000-000000000000' }],
  ['reply_to_vouch', {
    p_vouch_id: '00000000-0000-0000-0000-000000000000',
    p_host_id: '00000000-0000-0000-0000-000000000000',
    p_body: '',
  }],
];

const EXPECTED_CATEGORIES = 24;

/* ------------------------------------------------------------------ */
/* Run                                                                 */
/* ------------------------------------------------------------------ */

async function main() {
  console.log('\n\x1b[1mcampusclub_db\x1b[0m — checking Supabase setup');

  /* 1. keys ------------------------------------------------------- */
  if (!URL) bad('NEXT_PUBLIC_SUPABASE_URL', 'Missing. Project Settings → API → Project URL.');
  else ok('NEXT_PUBLIC_SUPABASE_URL', URL);

  if (!ANON) bad('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Missing. Project Settings → API → anon public key.');
  else ok('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'set');

  if (!SERVICE) {
    warn(
      'SUPABASE_SERVICE_ROLE_KEY',
      'Missing. The app still runs, but /api/admin/seed and the payment webhook need it.',
    );
  } else {
    ok('SUPABASE_SERVICE_ROLE_KEY', 'set');
  }

  if (!URL || !ANON) {
    warn('Skipped the remaining checks', 'The app is in demo mode until both keys are set.');
    report();
  }

  // Prefer the service-role key so a missing table is reported as missing
  // rather than being masked by row-level security.
  const key = SERVICE || ANON;
  const supabase = createClient(URL, key, { auth: { persistSession: false } });

  /* 2. reachable -------------------------------------------------- */
  const { error: reachError } = await supabase.from('categories').select('slug').limit(1);
  if (reachError && /fetch failed|ENOTFOUND|ECONNREFUSED/i.test(reachError.message)) {
    bad('Project reachable', `${reachError.message} — is NEXT_PUBLIC_SUPABASE_URL right?`);
    report();
  }
  ok('Project reachable');

  /* 3. relations -------------------------------------------------- */
  for (const relation of RELATIONS) {
    const { error } = await supabase.from(relation).select('*').limit(1);
    // PGRST205 = relation absent from the schema cache; 42P01 = undefined table.
    if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
      bad(`relation ${relation}`, 'Not found. Apply supabase/baseline.sql.');
    } else if (error) {
      warn(`relation ${relation}`, error.message);
    } else {
      ok(`relation ${relation}`);
    }
  }

  /* 4. RPCs ------------------------------------------------------- */
  for (const [name, args] of RPCS) {
    const { error } = await supabase.rpc(name, args);
    if (error && (error.code === 'PGRST202' || /could not find the function/i.test(error.message))) {
      bad(`function ${name}()`, 'Not found. Apply supabase/baseline.sql.');
    } else if (error) {
      warn(`function ${name}()`, error.message);
    } else {
      ok(`function ${name}()`);
    }
  }

  /* 5. catalogue -------------------------------------------------- */
  const { count, error: countError } = await supabase
    .from('categories')
    .select('slug', { count: 'exact', head: true });
  if (countError) {
    warn('categories seeded', countError.message);
  } else if ((count ?? 0) < EXPECTED_CATEGORIES) {
    bad(
      'categories seeded',
      `${count ?? 0} of ${EXPECTED_CATEGORIES} present. Re-run the category block in supabase/baseline.sql.`,
    );
  } else {
    ok('categories seeded', `${count} categories`);
  }

  /* 6. RLS -------------------------------------------------------- */
  // With the anon key and no session, `payments` must return nothing. Rows
  // coming back would mean RLS is off and everyone's payments are public.
  if (ANON) {
    const anonClient = createClient(URL, ANON, { auth: { persistSession: false } });
    const { data, error } = await anonClient.from('payments').select('id').limit(1);
    if (error) {
      ok('RLS on payments', 'anon blocked');
    } else if ((data ?? []).length > 0) {
      bad('RLS on payments', 'Anonymous clients can read payment rows. Re-run the RLS block in supabase/baseline.sql.');
    } else {
      ok('RLS on payments', 'anon sees no rows');
    }
  }

  /* 7. content ---------------------------------------------------- */
  const { count: meetupCount } = await supabase
    .from('meetups')
    .select('id', { count: 'exact', head: true });
  if (!meetupCount) {
    warn(
      'meetups loaded',
      'Empty. Sign up one account, then: curl -X POST $NEXT_PUBLIC_SITE_URL/api/admin/seed -H "x-seed-key: $SUPABASE_SERVICE_ROLE_KEY"',
    );
  } else {
    ok('meetups loaded', `${meetupCount} meetups`);
  }

  report();
}

main().catch((error) => {
  console.error(`\n\x1b[31mdb:check crashed\x1b[0m — ${error.message}\n`);
  process.exit(1);
});
