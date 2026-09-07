import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { BUSINESS_CATEGORIES } from '@/lib/constants';

// We cannot execute this migration against a real Postgres instance here (no
// Docker, no psql, no authenticated Supabase MCP). This test is the
// substitute: it parses the seed `insert` block straight out of the SQL file
// and checks it against BUSINESS_CATEGORIES, the source of truth from Task 1,
// row for row. If the migration's seed data ever drifts from constants.ts —
// a typo'd icon, a swapped parent, a missing category — this fails loudly
// instead of quietly shipping a directory whose categories don't match the
// app's own catalogue.

const MIGRATION_PATH = path.resolve(__dirname, '../supabase/migrations/0009_directory.sql');

interface ParsedCategoryRow {
  slug: string;
  name: string;
  icon: string;
  parentSlug: string | null;
  blurb: string;
}

/**
 * Splits a SQL values-row's comma-separated fields, respecting single-quoted
 * strings that may themselves contain a doubled `''` (the SQL escape for a
 * literal apostrophe) and commas.
 */
function splitSqlValues(row: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < row.length) {
    // Skip leading whitespace before a field.
    while (i < row.length && /\s/.test(row[i])) i++;
    if (i >= row.length) break;

    if (row[i] === "'") {
      // Quoted string literal: consume until an unescaped closing quote.
      let j = i + 1;
      let value = '';
      while (j < row.length) {
        if (row[j] === "'" && row[j + 1] === "'") {
          value += "'";
          j += 2;
          continue;
        }
        if (row[j] === "'") break;
        value += row[j];
        j++;
      }
      fields.push(value);
      i = j + 1;
      // Skip past the trailing comma (and any whitespace) if present.
      while (i < row.length && /\s/.test(row[i])) i++;
      if (row[i] === ',') i++;
    } else {
      // Bare literal (e.g. `null`) up to the next comma.
      let j = i;
      while (j < row.length && row[j] !== ',') j++;
      fields.push(row.slice(i, j).trim());
      i = j + 1;
    }
  }
  return fields;
}

function parseSeedRows(sql: string): ParsedCategoryRow[] {
  const insertMatch = sql.match(
    /insert into public\.business_categories \(slug, name, icon, parent_slug, blurb\) values\s*([\s\S]*?)\son conflict \(slug\) do update/,
  );
  if (!insertMatch) {
    throw new Error('Could not locate the business_categories seed insert block in the migration.');
  }
  const valuesBlock = insertMatch[1];

  // Each row is a parenthesised tuple. Match balanced-ish top-level
  // parens — fine here because field values never contain unescaped parens.
  const rowMatches = [...valuesBlock.matchAll(/\(([^()]*)\)/g)];
  if (rowMatches.length === 0) {
    throw new Error('Found no seed rows inside the business_categories values block.');
  }

  return rowMatches.map((m) => {
    const fields = splitSqlValues(m[1]);
    if (fields.length !== 5) {
      throw new Error(`Expected 5 fields per row, got ${fields.length} in: ${m[0]}`);
    }
    const [slug, name, icon, parentRaw, blurb] = fields;
    return {
      slug,
      name,
      icon,
      parentSlug: parentRaw === 'null' ? null : parentRaw,
      blurb,
    };
  });
}

describe('0009_directory.sql — business_categories seed', () => {
  const sql = readFileSync(MIGRATION_PATH, 'utf8');
  const rows = parseSeedRows(sql);

  it('seeds exactly the 39 categories in BUSINESS_CATEGORIES', () => {
    expect(rows).toHaveLength(BUSINESS_CATEGORIES.length);
    expect(rows).toHaveLength(39);
  });

  it('seeds the same set of slugs as BUSINESS_CATEGORIES, order notwithstanding', () => {
    const seededSlugs = rows.map((r) => r.slug).sort();
    const constantSlugs = BUSINESS_CATEGORIES.map((c) => c.slug).sort();
    expect(seededSlugs).toEqual(constantSlugs);
    // No duplicate slugs snuck into the migration.
    expect(new Set(seededSlugs).size).toBe(seededSlugs.length);
  });

  it('matches name, icon, parentSlug and blurb exactly for every category', () => {
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    for (const cat of BUSINESS_CATEGORIES) {
      const seeded = bySlug.get(cat.slug);
      expect(seeded, `missing seed row for slug "${cat.slug}"`).toBeDefined();
      expect(seeded!.name).toBe(cat.name);
      expect(seeded!.icon).toBe(cat.icon);
      expect(seeded!.parentSlug).toBe(cat.parentSlug);
      expect(seeded!.blurb).toBe(cat.blurb);
    }
  });

  it('resolves every non-null parent slug to a seeded slug', () => {
    const seededSlugs = new Set(rows.map((r) => r.slug));
    for (const row of rows) {
      if (row.parentSlug !== null) {
        expect(seededSlugs.has(row.parentSlug), `parent "${row.parentSlug}" of "${row.slug}" is not a seeded slug`).toBe(true);
      }
    }
  });

  it('uses the exact OSM attribution default string on the businesses table', () => {
    expect(sql).toContain("attribution   text not null default 'OpenStreetMap contributors, ODbL'");
  });

  it('is additive only: never mentions passes, payments or joins tables', () => {
    expect(sql).not.toMatch(/\bpublic\.passes\b/);
    expect(sql).not.toMatch(/\bpublic\.payments\b/);
    expect(sql).not.toMatch(/\bpublic\.joins\b/);
  });

  it('every guarded statement is re-runnable (if not exists / or replace / drop policy first)', () => {
    // create table statements
    const createTables = [...sql.matchAll(/create table\s+(if not exists\s+)?public\.\w+/gi)];
    for (const m of createTables) {
      expect(m[0].toLowerCase(), `"${m[0]}" is missing "if not exists"`).toMatch(/if not exists/);
    }

    // every `create policy` must be preceded by a `drop policy if exists` for
    // the same policy name somewhere earlier in the file.
    const policyNames = [...sql.matchAll(/create policy "([^"]+)"/g)].map((m) => m[1]);
    for (const name of policyNames) {
      expect(sql, `no "drop policy if exists" found for "${name}"`).toContain(`drop policy if exists "${name}"`);
    }
  });

  // Fix round 1 findings: a row-level UPDATE policy cannot be scoped to a
  // single column, so a business-owner reply policy would also let the owner
  // rewrite a review's rating/body/user_id — the exact thing a review system
  // exists to prevent. Owner replies must go exclusively through the
  // security-definer function below, with the reviewer's own update access
  // narrowed to the three columns they actually own via a column grant.
  it('never grants business owners a row-level UPDATE policy on reviews', () => {
    expect(sql).not.toContain('owners reply to reviews on a claimed business');
  });

  it('defines reply_to_business_review as a security definer function', () => {
    const fnMatch = sql.match(/create or replace function public\.reply_to_business_review\s*\(([\s\S]*?)\$\$;/);
    expect(fnMatch, 'reply_to_business_review function not found').toBeTruthy();
    const body = fnMatch![0];
    expect(body).toMatch(/security definer/);
    expect(body).toMatch(/language plpgsql/);
    expect(body).toMatch(/set search_path = public/);
    expect(body).toMatch(/returns boolean/);
    expect(body).toMatch(/return found;/);
  });

  it('revokes column-unrestricted update and grants only rating/body/photos to authenticated', () => {
    expect(sql).toContain('revoke update on public.business_reviews from authenticated;');
    expect(sql).toContain('grant update (rating, body, photos) on public.business_reviews to authenticated;');
  });

  it('recomputes both the old and new business on refresh_business_rating', () => {
    const fnMatch = sql.match(/create or replace function public\.refresh_business_rating\s*\(\)[\s\S]*?\$\$;/);
    expect(fnMatch, 'refresh_business_rating function not found').toBeTruthy();
    const body = fnMatch![0];
    expect(body).toMatch(/old\.business_id/);
    expect(body).toMatch(/new\.business_id/);
  });
});
