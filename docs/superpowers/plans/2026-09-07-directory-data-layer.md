# Directory Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete data layer for the CampusClub business directory — schema, domain types, pure ranking/hours logic, the dual-adapter repository, and the OpenStreetMap import pipeline — with no UI.

**Architecture:** Listings live in Supabase Postgres, imported from OpenStreetMap Overpass by a Node script. Every repository function branches on `isSupabaseConfigured()`, exactly as `src/lib/data/meetups.ts` does, with a committed demo seed on the other side. All ranking and hours logic is pure and unit-tested independently of both backends.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (`@supabase/ssr`), Vitest + Testing Library, Node `.mjs` scripts, Tailwind 3.

**Spec:** `docs/superpowers/specs/2026-09-07-directory-foundation-design.md`

**Plan 1 of 2.** This plan produces a working, testable data layer and a runnable importer. Plan 2 (`directory-ui`) builds `/places`, the density scope, the shared review components, and the i18n pass on top of the interfaces defined here.

## Global Constraints

- **Directory taxonomy is separate from the meetup taxonomy.** Never add directory categories to `CATEGORIES` in `src/lib/constants.ts`. They go in a new `BUSINESS_CATEGORIES` export.
- **Migration `0009_directory.sql` is additive only.** It must not touch `passes`, `payments`, `joins`, or any subscription table. The production passes schema is currently broken; that fix belongs to a different milestone and must not entangle with this one.
- **Every repository function branches on `isSupabaseConfigured()`** and returns identical shapes from both branches.
- **A re-import must never overwrite** `rating`, `review_count`, `claimed_by`, or `claimed_at`.
- **Unmapped OSM tags are skipped and counted, never bucketed into a catch-all.**
- **Businesses without an OSM `name` tag are dropped.**
- **Attribution string is exactly** `OpenStreetMap contributors, ODbL`.
- **Bayesian prior:** `m = 5`, `C = 3.5`.
- **Money is in paise** (`*Cents` naming), consistent with `src/lib/economics.ts`.
- Scripts are `.mjs` and cannot import `.ts`. Anything both a script and a test need lives in `scripts/lib/*.mjs`.
- Run `npm test`, `npm run lint`, `npm run typecheck` before every commit.

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `supabase/migrations/0009_directory.sql` | Tables, generated columns, indexes, rating trigger, RLS |
| `src/lib/directory/hours.ts` | OSM `opening_hours` parsing, open-now evaluation |
| `src/lib/directory/ranking.ts` | Completeness, Bayesian rating, sort comparators |
| `src/lib/directory/query.ts` | URL search params ↔ `BusinessQuery` |
| `src/lib/data/businesses.ts` | Business repository (Supabase + demo) |
| `src/lib/data/business-reviews.ts` | Review repository (Supabase + demo) |
| `src/lib/data/seed-businesses.ts` | Committed demo listings |
| `src/app/actions/reviews.ts` | Server action for writing a review |
| `scripts/lib/osm-categories.mjs` | OSM tag → category slug whitelist, shared by script and tests |
| `scripts/lib/city-boxes.mjs` | City slug → bounding box, shared by script and tests |
| `scripts/directory-import.mjs` | Overpass import CLI |
| `scripts/directory-check.mjs` | Post-import database verification CLI |
| `tests/hours.test.ts`, `tests/directory-ranking.test.ts`, `tests/directory-query.test.ts`, `tests/osm-mapping.test.ts` | Unit tests |

**Modified:**

| File | Change |
|---|---|
| `src/types/index.ts` | Add `Business`, `BusinessCategory`, `BusinessReview`, `BusinessQuery`, `BusinessSort`, `PriceBand`, `OpeningHours`, `DayKey` |
| `src/lib/constants.ts` | Add `BUSINESS_CATEGORIES`, `BUSINESS_CATEGORY_SLUGS`, `BUSINESS_SORT_OPTIONS` |
| `src/lib/data/store.ts` | Add `businesses` and `businessReviews` to `DemoDb` |
| `src/lib/validators.ts` | Add `businessReviewSchema` |
| `package.json` | Add `directory:import` and `directory:check` scripts |
| `tests/repository.test.ts` | Business repository coverage |

---

### Task 1: Domain types and the business category catalogue

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/constants.ts`
- Test: `tests/categories.test.ts` (existing file, add cases)

**Interfaces:**
- Consumes: nothing.
- Produces: `Business`, `BusinessCategory`, `BusinessReview`, `BusinessQuery`, `BusinessSort`, `PriceBand`, `OpeningHours`, `DayKey` from `@/types`; `BUSINESS_CATEGORIES: BusinessCategory[]`, `BUSINESS_CATEGORY_SLUGS: string[]`, `BUSINESS_SORT_OPTIONS: { value: BusinessSort; label: string }[]` from `@/lib/constants`.

- [ ] **Step 1: Write the failing test**

Append to `tests/categories.test.ts`:

```ts
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_SLUGS, CATEGORY_SLUGS } from '@/lib/constants';

describe('business categories', () => {
  it('has a unique slug for every entry', () => {
    expect(new Set(BUSINESS_CATEGORY_SLUGS).size).toBe(BUSINESS_CATEGORIES.length);
  });

  it('resolves every parent slug to a real top-level category', () => {
    const tops = new Set(BUSINESS_CATEGORIES.filter((c) => c.parentSlug === null).map((c) => c.slug));
    for (const cat of BUSINESS_CATEGORIES) {
      if (cat.parentSlug !== null) expect(tops.has(cat.parentSlug)).toBe(true);
    }
  });

  it('keeps the directory taxonomy disjoint from the meetup taxonomy', () => {
    const overlap = BUSINESS_CATEGORY_SLUGS.filter((s) => CATEGORY_SLUGS.includes(s));
    expect(overlap).toEqual([]);
  });

  it('offers at least six top-level categories for the tile grid', () => {
    expect(BUSINESS_CATEGORIES.filter((c) => c.parentSlug === null).length).toBeGreaterThanOrEqual(6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/categories.test.ts`
Expected: FAIL — `BUSINESS_CATEGORIES` is not exported from `@/lib/constants`.

- [ ] **Step 3: Add the types**

Append to `src/types/index.ts`, after the `Vouch` interface (around line 273):

```ts
/* ------------------------------------------------------------------ */
/* Directory                                                           */
/* ------------------------------------------------------------------ */

/** Roughly what a visit costs: ₹ through ₹₹₹₹. */
export type PriceBand = 1 | 2 | 3 | 4;

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/**
 * Opening times as minutes from local midnight.
 *
 * `close` may exceed 1440 to express a shift running past midnight — a bar
 * open 18:00–02:00 is `{ open: 1080, close: 1560 }` on the day it starts,
 * not two rows. Keeping the interval whole is what lets "open now" be a
 * comparison instead of a special case.
 */
export type OpeningHours = Partial<Record<DayKey, { open: number; close: number }[]>>;

/**
 * A business type — "Restaurants", "Beauty & Spas". Deliberately a different
 * tree from `Category`, which is what people *do* together rather than what a
 * place *is*.
 */
export interface BusinessCategory {
  slug: string;
  name: string;
  /** lucide-react icon name, resolved in category-icon.tsx */
  icon: string;
  /** null for the top-level categories that make up the tile grid. */
  parentSlug: string | null;
  blurb: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  citySlug: string;
  categorySlug: string;
  address: string;
  locality: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  hours: OpeningHours;
  priceBand: PriceBand | null;
  /** The licence credit this row is shown under. Never empty. */
  attribution: string;
  rating: number;
  reviewCount: number;
  /** 0–5: how many of hours, phone, website, address, locality are present. */
  completeness: number;
  claimedBy: string | null;
  createdAt: string;
}

export interface BusinessReview {
  id: string;
  businessId: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  body: string;
  photos: string[];
  createdAt: string;
  ownerReply: string | null;
  ownerReplyAt: string | null;
}

export type BusinessSort = 'recommended' | 'rating' | 'reviewed' | 'nearest' | 'name';

export interface BusinessQuery {
  term?: string;
  city?: string;
  category?: string;
  priceBand?: PriceBand;
  /** Post-filter on the fetched page, not an indexed predicate. */
  openNow?: boolean;
  sort?: BusinessSort;
  page?: number;
  perPage?: number;
  near?: { lat: number; lng: number };
}
```

- [ ] **Step 4: Add the catalogue**

Append to `src/lib/constants.ts`. Import `BusinessCategory` and `BusinessSort` in the existing type import at the top of the file.

```ts
/* ------------------------------------------------------------------ */
/* The directory taxonomy                                              */
/* ------------------------------------------------------------------ */

/**
 * What a place *is*, as opposed to `CATEGORIES`, which is what people do
 * together. Two trees on purpose: "Restaurants" is not an activity and
 * "Exam prep" is not a business type, and collapsing them would make the
 * directory unbrowsable and the board incoherent.
 *
 * The eight parentless entries are the tile grid on `/places`. Children exist
 * to be mapped onto from OSM tags — see `scripts/lib/osm-categories.mjs`.
 */
export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  /* ------------------------------- top level ------------------------------ */
  { slug: 'food-drink',    name: 'Food & drink',   icon: 'UtensilsCrossed', parentSlug: null, blurb: 'Restaurants, cafes, bakeries and the chai stall on the corner.' },
  { slug: 'active-life',   name: 'Active life',    icon: 'Dumbbell',        parentSlug: null, blurb: 'Gyms, courts, pools and parks.' },
  { slug: 'study-work',    name: 'Study & work',   icon: 'BookOpen',        parentSlug: null, blurb: 'Libraries, reading rooms, coaching centres, coworking desks.' },
  { slug: 'beauty-spas',   name: 'Beauty & spas',  icon: 'Scissors',        parentSlug: null, blurb: 'Salons, barbers, spas.' },
  { slug: 'shopping',      name: 'Shopping',       icon: 'ShoppingBag',     parentSlug: null, blurb: 'Books, clothes, electronics, groceries.' },
  { slug: 'nightlife',     name: 'Nightlife',      icon: 'Martini',         parentSlug: null, blurb: 'Bars, pubs and places open late.' },
  { slug: 'home-services', name: 'Home services',  icon: 'Wrench',          parentSlug: null, blurb: 'Repairs, laundry, movers.' },
  { slug: 'health',        name: 'Health',         icon: 'Stethoscope',     parentSlug: null, blurb: 'Clinics, pharmacies, dentists.' },

  /* --------------------------------- food -------------------------------- */
  { slug: 'restaurants', name: 'Restaurants', icon: 'UtensilsCrossed', parentSlug: 'food-drink', blurb: 'Sit-down meals.' },
  { slug: 'cafes',       name: 'Cafes',       icon: 'Coffee',          parentSlug: 'food-drink', blurb: 'Coffee, and a table you can sit at for three hours.' },
  { slug: 'bakeries',    name: 'Bakeries',    icon: 'Croissant',       parentSlug: 'food-drink', blurb: 'Bread, cake, puffs.' },
  { slug: 'fast-food',   name: 'Fast food',   icon: 'Sandwich',        parentSlug: 'food-drink', blurb: 'Quick, cheap, standing room.' },
  { slug: 'ice-cream',   name: 'Ice cream',   icon: 'IceCreamCone',    parentSlug: 'food-drink', blurb: 'Cones and kulfi.' },

  /* ------------------------------- active -------------------------------- */
  { slug: 'gyms',          name: 'Gyms',          icon: 'Dumbbell',   parentSlug: 'active-life', blurb: 'Weights and machines.' },
  { slug: 'sports-venues', name: 'Sports venues', icon: 'Volleyball', parentSlug: 'active-life', blurb: 'Courts, turf and grounds.' },
  { slug: 'swimming',      name: 'Swimming',      icon: 'Waves',      parentSlug: 'active-life', blurb: 'Pools.' },
  { slug: 'parks',         name: 'Parks',         icon: 'Trees',      parentSlug: 'active-life', blurb: 'Green space to run or sit in.' },
  { slug: 'yoga-studios',  name: 'Yoga studios',  icon: 'Flower2',    parentSlug: 'active-life', blurb: 'Mats and morning classes.' },

  /* ----------------------------- study & work ---------------------------- */
  { slug: 'libraries',        name: 'Libraries',        icon: 'Library',    parentSlug: 'study-work', blurb: 'Quiet, free, and usually full by nine.' },
  { slug: 'coaching-centres', name: 'Coaching centres', icon: 'GraduationCap', parentSlug: 'study-work', blurb: 'CAT, GATE, UPSC, NEET.' },
  { slug: 'coworking',        name: 'Coworking',        icon: 'Briefcase',  parentSlug: 'study-work', blurb: 'A desk by the day.' },
  { slug: 'colleges',         name: 'Colleges',         icon: 'School',     parentSlug: 'study-work', blurb: 'Campuses and institutes.' },

  /* ------------------------------- beauty -------------------------------- */
  { slug: 'salons',  name: 'Salons',  icon: 'Scissors',  parentSlug: 'beauty-spas', blurb: 'Hair and grooming.' },
  { slug: 'spas',    name: 'Spas',    icon: 'Flower',    parentSlug: 'beauty-spas', blurb: 'Massage and treatments.' },
  { slug: 'barbers', name: 'Barbers', icon: 'Scissors',  parentSlug: 'beauty-spas', blurb: 'A chair and a cut.' },

  /* ------------------------------ shopping ------------------------------- */
  { slug: 'bookshops',   name: 'Bookshops',   icon: 'BookMarked',  parentSlug: 'shopping', blurb: 'New, second-hand and exam guides.' },
  { slug: 'clothing',    name: 'Clothing',    icon: 'Shirt',       parentSlug: 'shopping', blurb: 'Clothes and shoes.' },
  { slug: 'electronics', name: 'Electronics', icon: 'Smartphone',  parentSlug: 'shopping', blurb: 'Phones, laptops, repairs.' },
  { slug: 'groceries',   name: 'Groceries',   icon: 'ShoppingCart',parentSlug: 'shopping', blurb: 'Supermarkets and kirana.' },
  { slug: 'stationery',  name: 'Stationery',  icon: 'PenLine',     parentSlug: 'shopping', blurb: 'Notebooks, printing, photocopies.' },

  /* ------------------------------ nightlife ------------------------------ */
  { slug: 'bars',  name: 'Bars',  icon: 'Martini',    parentSlug: 'nightlife', blurb: 'Drinks and a late close.' },
  { slug: 'pubs',  name: 'Pubs',  icon: 'Beer',       parentSlug: 'nightlife', blurb: 'Beer and a television.' },
  { slug: 'clubs', name: 'Clubs', icon: 'Disc3',      parentSlug: 'nightlife', blurb: 'Music, and a cover charge.' },

  /* --------------------------- home services ----------------------------- */
  { slug: 'laundry',    name: 'Laundry',    icon: 'WashingMachine', parentSlug: 'home-services', blurb: 'Wash, iron, dry-clean.' },
  { slug: 'repairs',    name: 'Repairs',    icon: 'Wrench',         parentSlug: 'home-services', blurb: 'Electricians, plumbers, hardware.' },
  { slug: 'car-repair', name: 'Car repair', icon: 'Car',            parentSlug: 'home-services', blurb: 'Garages and service centres.' },

  /* -------------------------------- health ------------------------------- */
  { slug: 'clinics',    name: 'Clinics',    icon: 'Stethoscope', parentSlug: 'health', blurb: 'Doctors and small hospitals.' },
  { slug: 'pharmacies', name: 'Pharmacies', icon: 'Pill',        parentSlug: 'health', blurb: 'Chemists.' },
  { slug: 'dentists',   name: 'Dentists',   icon: 'Smile',       parentSlug: 'health', blurb: 'Teeth.' },
];

export const BUSINESS_CATEGORY_SLUGS = BUSINESS_CATEGORIES.map((c) => c.slug);

export const TOP_BUSINESS_CATEGORIES = BUSINESS_CATEGORIES.filter((c) => c.parentSlug === null);

export function businessCategoryBySlug(slug: string): BusinessCategory | undefined {
  return BUSINESS_CATEGORIES.find((c) => c.slug === slug);
}

/**
 * Sort options for the directory. "Recommended" leads because on a board with
 * no reviews yet it is the only ordering that is not arbitrary — see
 * `src/lib/directory/ranking.ts`.
 */
export const BUSINESS_SORT_OPTIONS: { value: BusinessSort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating',      label: 'Highest rated' },
  { value: 'reviewed',    label: 'Most reviewed' },
  { value: 'nearest',     label: 'Nearest' },
  { value: 'name',        label: 'A–Z' },
];
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/categories.test.ts && npm run typecheck`
Expected: PASS, and typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/lib/constants.ts tests/categories.test.ts
git commit -m "Add the directory taxonomy as a second tree beside the activity categories"
```

---

### Task 2: Migration 0009 — schema, generated columns, trigger, RLS

**Files:**
- Create: `supabase/migrations/0009_directory.sql`

**Interfaces:**
- Consumes: `BUSINESS_CATEGORIES` slugs from Task 1 (the seed insert must match them exactly).
- Produces: tables `business_categories`, `businesses`, `business_reviews`; view `business_reviews_with_author`; column `meetups.venue_business_id`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0009_directory.sql`:

```sql
-- ===========================================================================
-- 0009 — the directory
--
-- Additive only. Touches no passes, payments or join table: the production
-- subscription schema is mid-repair and the two must not entangle.
--
-- The taxonomy here is deliberately NOT public.categories. That table holds
-- the 24 things people do together; this one holds what a place is. A cafe is
-- not an activity and "Exam prep" is not a business type.
-- ===========================================================================

create extension if not exists pg_trgm;

-- ================================================= business_categories ======
create table if not exists public.business_categories (
  slug        text primary key,
  name        text not null,
  icon        text not null default 'Store',
  parent_slug text references public.business_categories (slug),
  blurb       text not null default ''
);

insert into public.business_categories (slug, name, icon, parent_slug, blurb) values
  ('food-drink',    'Food & drink',  'UtensilsCrossed', null, 'Restaurants, cafes, bakeries and the chai stall on the corner.'),
  ('active-life',   'Active life',   'Dumbbell',        null, 'Gyms, courts, pools and parks.'),
  ('study-work',    'Study & work',  'BookOpen',        null, 'Libraries, reading rooms, coaching centres, coworking desks.'),
  ('beauty-spas',   'Beauty & spas', 'Scissors',        null, 'Salons, barbers, spas.'),
  ('shopping',      'Shopping',      'ShoppingBag',     null, 'Books, clothes, electronics, groceries.'),
  ('nightlife',     'Nightlife',     'Martini',         null, 'Bars, pubs and places open late.'),
  ('home-services', 'Home services', 'Wrench',          null, 'Repairs, laundry, movers.'),
  ('health',        'Health',        'Stethoscope',     null, 'Clinics, pharmacies, dentists.'),

  ('restaurants',       'Restaurants',       'UtensilsCrossed', 'food-drink',    'Sit-down meals.'),
  ('cafes',             'Cafes',             'Coffee',          'food-drink',    'Coffee, and a table you can sit at for three hours.'),
  ('bakeries',          'Bakeries',          'Croissant',       'food-drink',    'Bread, cake, puffs.'),
  ('fast-food',         'Fast food',         'Sandwich',        'food-drink',    'Quick, cheap, standing room.'),
  ('ice-cream',         'Ice cream',         'IceCreamCone',    'food-drink',    'Cones and kulfi.'),
  ('gyms',              'Gyms',              'Dumbbell',        'active-life',   'Weights and machines.'),
  ('sports-venues',     'Sports venues',     'Volleyball',      'active-life',   'Courts, turf and grounds.'),
  ('swimming',          'Swimming',          'Waves',           'active-life',   'Pools.'),
  ('parks',             'Parks',             'Trees',           'active-life',   'Green space to run or sit in.'),
  ('yoga-studios',      'Yoga studios',      'Flower2',         'active-life',   'Mats and morning classes.'),
  ('libraries',         'Libraries',         'Library',         'study-work',    'Quiet, free, and usually full by nine.'),
  ('coaching-centres',  'Coaching centres',  'GraduationCap',   'study-work',    'CAT, GATE, UPSC, NEET.'),
  ('coworking',         'Coworking',         'Briefcase',       'study-work',    'A desk by the day.'),
  ('colleges',          'Colleges',          'School',          'study-work',    'Campuses and institutes.'),
  ('salons',            'Salons',            'Scissors',        'beauty-spas',   'Hair and grooming.'),
  ('spas',              'Spas',              'Flower',          'beauty-spas',   'Massage and treatments.'),
  ('barbers',           'Barbers',           'Scissors',        'beauty-spas',   'A chair and a cut.'),
  ('bookshops',         'Bookshops',         'BookMarked',      'shopping',      'New, second-hand and exam guides.'),
  ('clothing',          'Clothing',          'Shirt',           'shopping',      'Clothes and shoes.'),
  ('electronics',       'Electronics',       'Smartphone',      'shopping',      'Phones, laptops, repairs.'),
  ('groceries',         'Groceries',         'ShoppingCart',    'shopping',      'Supermarkets and kirana.'),
  ('stationery',        'Stationery',        'PenLine',         'shopping',      'Notebooks, printing, photocopies.'),
  ('bars',              'Bars',              'Martini',         'nightlife',     'Drinks and a late close.'),
  ('pubs',              'Pubs',              'Beer',            'nightlife',     'Beer and a television.'),
  ('clubs',             'Clubs',             'Disc3',           'nightlife',     'Music, and a cover charge.'),
  ('laundry',           'Laundry',           'WashingMachine',  'home-services', 'Wash, iron, dry-clean.'),
  ('repairs',           'Repairs',           'Wrench',          'home-services', 'Electricians, plumbers, hardware.'),
  ('car-repair',        'Car repair',        'Car',             'home-services', 'Garages and service centres.'),
  ('clinics',           'Clinics',           'Stethoscope',     'health',        'Doctors and small hospitals.'),
  ('pharmacies',        'Pharmacies',        'Pill',            'health',        'Chemists.'),
  ('dentists',          'Dentists',          'Smile',           'health',        'Teeth.')
on conflict (slug) do update
  set name = excluded.name, icon = excluded.icon,
      parent_slug = excluded.parent_slug, blurb = excluded.blurb;

-- ========================================================== businesses ======
create table if not exists public.businesses (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  city_slug     text not null,
  category_slug text not null references public.business_categories (slug),
  address       text not null default '',
  locality      text not null default '',
  lat           double precision not null,
  lng           double precision not null,
  phone         text,
  website       text,
  hours         jsonb  not null default '{}',
  price_band    smallint check (price_band between 1 and 4),
  osm_type      text,
  osm_id        bigint,
  attribution   text not null default 'OpenStreetMap contributors, ODbL',

  -- Maintained by the trigger below, not derived per request. Deriving is
  -- right for hundreds of meetups (see withAggregates in store.ts) and wrong
  -- at directory scale, where a city page would aggregate the whole review
  -- table on every load.
  rating        numeric(2,1) not null default 0,
  review_count  integer      not null default 0,

  claimed_by    uuid references public.profiles (id) on delete set null,
  claimed_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- The default-sort key. Stored generated so the Recommended ordering is one
  -- index scan: on import day every row has no reviews, and sorting by rating
  -- would be arbitrary.
  completeness smallint generated always as (
    (case when hours <> '{}'::jsonb then 1 else 0 end) +
    (case when phone    is not null and phone    <> '' then 1 else 0 end) +
    (case when website  is not null and website  <> '' then 1 else 0 end) +
    (case when address  <> '' then 1 else 0 end) +
    (case when locality <> '' then 1 else 0 end)
  ) stored,

  search_vector tsvector generated always as (
    to_tsvector('simple',
      coalesce(name, '') || ' ' || coalesce(locality, '') || ' ' || coalesce(address, ''))
  ) stored,

  unique (osm_type, osm_id)
);

create index if not exists businesses_city_cat_idx on public.businesses (city_slug, category_slug);
create index if not exists businesses_name_trgm    on public.businesses using gin (name gin_trgm_ops);
create index if not exists businesses_search_idx   on public.businesses using gin (search_vector);
create index if not exists businesses_rank_idx     on public.businesses (city_slug, rating desc, review_count desc);
create index if not exists businesses_reco_idx     on public.businesses (city_slug, completeness desc, rating desc, name);

-- ==================================================== business_reviews ======
create table if not exists public.business_reviews (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  rating         integer not null check (rating between 1 and 5),
  body           text not null,
  photos         text[] not null default '{}',
  owner_reply    text,
  owner_reply_at timestamptz,
  created_at     timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists business_reviews_business_idx on public.business_reviews (business_id, created_at desc);

-- The single writer that keeps businesses.rating honest.
create or replace function public.refresh_business_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  target := coalesce(new.business_id, old.business_id);
  update public.businesses b
     set rating       = coalesce((select round(avg(r.rating)::numeric, 1) from public.business_reviews r where r.business_id = target), 0),
         review_count = (select count(*) from public.business_reviews r where r.business_id = target),
         updated_at   = now()
   where b.id = target;
  return null;
end;
$$;

drop trigger if exists business_reviews_rating on public.business_reviews;
create trigger business_reviews_rating
  after insert or update or delete on public.business_reviews
  for each row execute function public.refresh_business_rating();

-- Author name/avatar alongside the review, mirroring vouches_with_author.
create or replace view public.business_reviews_with_author as
  select r.*, p.full_name as author_name, p.avatar_url as author_avatar
    from public.business_reviews r
    join public.profiles p on p.id = r.user_id;

-- ============================================== meetups.venue_business ======
alter table public.meetups
  add column if not exists venue_business_id uuid references public.businesses (id) on delete set null;

create index if not exists meetups_venue_idx on public.meetups (venue_business_id);

-- =============================================================== RLS ========
alter table public.business_categories enable row level security;
alter table public.businesses          enable row level security;
alter table public.business_reviews    enable row level security;

drop policy if exists "business categories are public" on public.business_categories;
create policy "business categories are public" on public.business_categories for select using (true);

-- Read-only to everyone. Writes belong to the importer, which uses the service
-- role and bypasses RLS entirely — there is deliberately no insert policy.
drop policy if exists "businesses are public" on public.businesses;
create policy "businesses are public" on public.businesses for select using (true);

drop policy if exists "business reviews are public" on public.business_reviews;
create policy "business reviews are public" on public.business_reviews for select using (true);

drop policy if exists "members write their own business reviews" on public.business_reviews;
create policy "members write their own business reviews" on public.business_reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "authors edit their own business reviews" on public.business_reviews;
create policy "authors edit their own business reviews" on public.business_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Written now, inert until the claims milestone: nothing sets claimed_by yet.
drop policy if exists "owners reply to reviews on a claimed business" on public.business_reviews;
create policy "owners reply to reviews on a claimed business" on public.business_reviews
  for update using (
    exists (select 1 from public.businesses b
             where b.id = business_reviews.business_id and b.claimed_by = auth.uid())
  );
```

- [ ] **Step 2: Verify the SQL parses against a scratch database**

Run: `npx supabase db reset --linked=false` if a local stack is available; otherwise apply through the Supabase SQL editor against a **branch or scratch project, never production**, and confirm no errors.
Expected: all statements succeed; re-running the file is a no-op.

- [ ] **Step 3: Verify idempotency**

Apply the file a second time.
Expected: no errors — every statement is `if not exists`, `on conflict do update`, `create or replace`, or `drop policy if exists` first.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0009_directory.sql
git commit -m "Add the directory schema, with a stored completeness key for the cold-start sort"
```

---

### Task 3: OSM opening_hours parsing and open-now

**Files:**
- Create: `scripts/lib/hours.mjs`
- Create: `src/lib/directory/hours.ts`
- Test: `tests/hours.test.ts`

**Interfaces:**
- Consumes: `OpeningHours`, `DayKey` from `@/types`.
- Produces: `parseOpeningHours(raw): OpeningHours` and `DAY_KEYS` from `scripts/lib/hours.mjs`; `isOpenAt(hours, at): boolean` and `DAY_KEYS` from `@/lib/directory/hours`.

> **Why the split.** Parsing happens **once, at import time**, in a `.mjs` script that cannot import TypeScript — so the parser lives in `scripts/lib/hours.mjs`. What the app does at request time is only *evaluate* already-parsed hours, so `isOpenAt` lives in TypeScript under `src/`. Neither file imports the other, there is no duplicated logic, and `src/` never reaches outside itself into `scripts/` (which would break the Vercel build). The database therefore stores the **parsed** shape, which is also what makes the generated `completeness` column meaningful.

- [ ] **Step 1: Write the failing test**

Create `tests/hours.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/hours.test.ts`
Expected: FAIL — cannot resolve `../scripts/lib/hours.mjs`.

- [ ] **Step 3: Write the parser**

Create `scripts/lib/hours.mjs`. This is the whole implementation below **minus** the `isOpenAt` export and the type annotations — plain JavaScript, since the import script is `.mjs`:

```js
/**
 * A deliberately partial reader for OSM `opening_hours`.
 *
 * The full grammar has public holidays, sunset offsets, week numbers and
 * month ranges, and implementing it would be a library rather than a file.
 * This handles the four shapes that cover almost every Indian POI — a weekday
 * range, a list of days, split shifts, and 24/7 — and returns `{}` for
 * anything it does not recognise. An empty result costs a business one point
 * of completeness and hides it from the "open now" filter, which is the
 * honest outcome: we do not know when it is open.
 */

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_INDEX = {
  mo: 0, tu: 1, we: 2, th: 3, fr: 4, sa: 5, su: 6,
};

function minutesOf(clock) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(clock.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 24 || mins > 59) return null;
  return hours * 60 + mins;
}

/** "Mo-Fr", "Sa,Su", "Mo" → indices into DAY_KEYS. */
function daysOf(spec) {
  const out = new Set();

  for (const part of spec.split(',')) {
    const range = /^([A-Za-z]{2})\s*-\s*([A-Za-z]{2})$/.exec(part.trim());
    if (range) {
      const from = DAY_INDEX[range[1].toLowerCase()];
      const to = DAY_INDEX[range[2].toLowerCase()];
      if (from === undefined || to === undefined) continue;
      // Wraps across the end of the week: "Fr-Mo" is Fri, Sat, Sun, Mon.
      for (let i = from; ; i = (i + 1) % 7) {
        out.add(i);
        if (i === to) break;
      }
      continue;
    }
    const single = DAY_INDEX[part.trim().toLowerCase()];
    if (single !== undefined) out.add(single);
  }

  return [...out];
}

export function parseOpeningHours(raw) {
  const value = (raw ?? '').trim();
  if (!value) return {};

  if (/^24\s*\/\s*7$/.test(value)) {
    return Object.fromEntries(DAY_KEYS.map((d) => [d, [{ open: 0, close: 1440 }]]));
  }

  const hours = {};

  for (const rule of value.split(';')) {
    const trimmed = rule.trim();
    if (!trimmed) continue;

    const match = /^([A-Za-z]{2}(?:\s*[-,]\s*[A-Za-z]{2})*)\s+(.+)$/.exec(trimmed);
    if (!match) continue;

    const days = daysOf(match[1]);
    if (!days.length) continue;
    const rest = match[2].trim();

    // "Su off" / "Su closed" is information, not absence: record the empty day
    // so the UI can say "closed Sunday" rather than "hours unknown".
    if (/^(off|closed)$/i.test(rest)) {
      for (const d of days) hours[DAY_KEYS[d]] = [];
      continue;
    }

    const intervals = [];
    for (const span of rest.split(',')) {
      const parts = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.exec(span.trim());
      if (!parts) continue;
      const open = minutesOf(parts[1]);
      let close = minutesOf(parts[2]);
      if (open === null || close === null) continue;
      // 18:00-02:00 closes the next day. Keeping it as one interval past 1440
      // means "open now" stays a comparison rather than a special case.
      if (close <= open) close += 1440;
      intervals.push({ open, close });
    }

    if (intervals.length) {
      for (const d of days) hours[DAY_KEYS[d]] = intervals;
    }
  }

  return hours;
}

```

- [ ] **Step 4: Write the open-now evaluator**

Create `src/lib/directory/hours.ts`. This is what the app calls at request time; it never parses, because the database already holds the parsed shape:

```ts
import type { DayKey, OpeningHours } from '@/types';

/**
 * Is this place open right now?
 *
 * The parser that produced these intervals lives in `scripts/lib/hours.mjs`,
 * because parsing happens once at import time in a Node script that cannot
 * read TypeScript. This half runs on every request, so it lives in `src` and
 * stays typed. Neither imports the other; there is no shared logic to drift.
 */

export const DAY_KEYS: readonly DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** JS getDay() is Sunday-first; DAY_KEYS is Monday-first. */
function dayKeyOf(date: Date): DayKey {
  return DAY_KEYS[(date.getDay() + 6) % 7];
}

export function isOpenAt(hours: OpeningHours, at: Date): boolean {
  const minutes = at.getHours() * 60 + at.getMinutes();

  const today = hours[dayKeyOf(at)];
  if (today?.some((i) => minutes >= i.open && minutes < i.close)) return true;

  // A shift that started yesterday and runs past midnight: 01:00 on Sunday is
  // minute 1440 + 60 of Saturday's timeline.
  const yesterday = new Date(at);
  yesterday.setDate(yesterday.getDate() - 1);
  const previous = hours[dayKeyOf(yesterday)];
  return Boolean(previous?.some((i) => i.close > 1440 && minutes + 1440 >= i.open && minutes + 1440 < i.close));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/hours.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/hours.mjs src/lib/directory/hours.ts tests/hours.test.ts
git commit -m "Parse OSM opening hours at import, and evaluate open-now at request"
```

---

### Task 4: Ranking — completeness, Bayesian rating, sort comparators

**Files:**
- Create: `src/lib/directory/ranking.ts`
- Test: `tests/directory-ranking.test.ts`

**Interfaces:**
- Consumes: `Business`, `BusinessSort` from `@/types`; `distanceKm` from `@/lib/utils`.
- Produces: `BAYESIAN_PRIOR_COUNT`, `BAYESIAN_PRIOR_RATING`, `bayesianRating(rating, reviewCount)`, `completenessOf(business)`, `sortBusinesses(items, sort, near?)`.

- [ ] **Step 1: Write the failing test**

Create `tests/directory-ranking.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Business } from '@/types';
import { bayesianRating, completenessOf, sortBusinesses } from '@/lib/directory/ranking';

function make(over: Partial<Business> = {}): Business {
  return {
    id: 'b1', slug: 'b1', name: 'B1', citySlug: 'pune', categorySlug: 'cafes',
    address: '', locality: '', lat: 18.52, lng: 73.85,
    phone: null, website: null, hours: {}, priceBand: null,
    attribution: 'OpenStreetMap contributors, ODbL',
    rating: 0, reviewCount: 0, completeness: 0, claimedBy: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('completenessOf', () => {
  it('scores nothing for a bare row and five for a fully documented one', () => {
    expect(completenessOf(make())).toBe(0);
    expect(completenessOf(make({
      hours: { mon: [{ open: 540, close: 1020 }] },
      phone: '+912012345678', website: 'https://x.test',
      address: '12 Main St', locality: 'Kothrud',
    }))).toBe(5);
  });

  it('ignores empty strings, which OSM produces freely', () => {
    expect(completenessOf(make({ phone: '', website: '', address: '', locality: '' }))).toBe(0);
  });
});

describe('bayesianRating', () => {
  it('pulls a single glowing review towards the prior', () => {
    expect(bayesianRating(5, 1)).toBeCloseTo((1 / 6) * 5 + (5 / 6) * 3.5, 5);
  });

  it('barely moves a heavily reviewed average', () => {
    expect(bayesianRating(4.6, 200)).toBeGreaterThan(4.5);
  });

  it('ranks a well-reviewed 4.6 above a single 5', () => {
    expect(bayesianRating(4.6, 200)).toBeGreaterThan(bayesianRating(5, 1));
  });

  it('returns the prior when there are no reviews at all', () => {
    expect(bayesianRating(0, 0)).toBe(3.5);
  });
});

describe('sortBusinesses', () => {
  it('orders Recommended by completeness, then rating, then name', () => {
    const items = [
      make({ id: 'a', name: 'Anna', completeness: 1 }),
      make({ id: 'b', name: 'Bela', completeness: 5 }),
      make({ id: 'c', name: 'Cyrus', completeness: 5, rating: 4.8, reviewCount: 30 }),
    ];
    expect(sortBusinesses(items, 'recommended').map((b) => b.id)).toEqual(['c', 'b', 'a']);
  });

  // The cold-start case: on import day nothing has a review, and the order
  // must still be deterministic and meaningful rather than arbitrary.
  it('stays stable and completeness-led when every row has no reviews', () => {
    const items = [
      make({ id: 'z', name: 'Zoya', completeness: 3 }),
      make({ id: 'a', name: 'Anna', completeness: 3 }),
      make({ id: 'm', name: 'Mira', completeness: 5 }),
    ];
    const once = sortBusinesses(items, 'recommended').map((b) => b.id);
    const twice = sortBusinesses([...items].reverse(), 'recommended').map((b) => b.id);
    expect(once).toEqual(['m', 'a', 'z']);
    expect(twice).toEqual(once);
  });

  it('orders rating by the Bayesian average, not the raw one', () => {
    const items = [
      make({ id: 'raw5', name: 'Raw', rating: 5, reviewCount: 1 }),
      make({ id: 'solid', name: 'Solid', rating: 4.6, reviewCount: 200 }),
    ];
    expect(sortBusinesses(items, 'rating').map((b) => b.id)).toEqual(['solid', 'raw5']);
  });

  it('orders most-reviewed by review count', () => {
    const items = [make({ id: 'few', reviewCount: 2 }), make({ id: 'many', reviewCount: 90 })];
    expect(sortBusinesses(items, 'reviewed').map((b) => b.id)).toEqual(['many', 'few']);
  });

  it('orders nearest by distance from the given point', () => {
    const items = [
      make({ id: 'far', lat: 19.5, lng: 73.85 }),
      make({ id: 'near', lat: 18.53, lng: 73.85 }),
    ];
    const sorted = sortBusinesses(items, 'nearest', { lat: 18.52, lng: 73.85 });
    expect(sorted.map((b) => b.id)).toEqual(['near', 'far']);
  });

  it('falls back to Recommended when nearest is asked for without a point', () => {
    const items = [make({ id: 'a', completeness: 1 }), make({ id: 'b', completeness: 4 })];
    expect(sortBusinesses(items, 'nearest').map((b) => b.id)).toEqual(['b', 'a']);
  });

  it('orders A–Z case-insensitively', () => {
    const items = [make({ id: '1', name: 'zebra' }), make({ id: '2', name: 'Apple' })];
    expect(sortBusinesses(items, 'name').map((b) => b.name)).toEqual(['Apple', 'zebra']);
  });

  it('does not mutate the array it is given', () => {
    const items = [make({ id: 'a', completeness: 1 }), make({ id: 'b', completeness: 4 })];
    sortBusinesses(items, 'recommended');
    expect(items.map((b) => b.id)).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/directory-ranking.test.ts`
Expected: FAIL — cannot resolve `@/lib/directory/ranking`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/directory/ranking.ts`:

```ts
import type { Business, BusinessSort } from '@/types';
import { distanceKm } from '@/lib/utils';

/**
 * How the directory decides what to show first.
 *
 * The problem this file exists to solve is the first day. Every row arrives
 * from OpenStreetMap with no reviews, so a rating sort would order ~10^5
 * businesses by a column that is zero everywhere — which is to say, at random.
 * A directory that looks random on the day it launches is a directory nobody
 * comes back to.
 *
 * So the default is completeness: how much OSM actually knows about the place.
 * It is a real quality signal — a shop somebody bothered to add hours, a phone
 * number and a website for is a shop that exists and is maintained — and it
 * degrades into rating order by itself as reviews arrive.
 */

/** Prior strength: how many reviews it takes to outweigh the prior. */
export const BAYESIAN_PRIOR_COUNT = 5;
/** Prior mean: what we assume about a place we know nothing about. */
export const BAYESIAN_PRIOR_RATING = 3.5;

/**
 * A rating that cannot be gamed by a single five-star review.
 *
 * `(v/(v+m))·R + (m/(v+m))·C` — the raw average pulled towards the prior in
 * proportion to how little evidence there is behind it.
 */
export function bayesianRating(rating: number, reviewCount: number): number {
  const v = Math.max(0, reviewCount);
  const m = BAYESIAN_PRIOR_COUNT;
  return (v / (v + m)) * rating + (m / (v + m)) * BAYESIAN_PRIOR_RATING;
}

/**
 * Mirrors the `completeness` generated column in `0009_directory.sql`.
 *
 * Duplicated deliberately: Postgres computes it for the Supabase adapter and
 * this computes it for demo mode, and the two must agree. The test above is
 * what holds them together.
 */
export function completenessOf(business: Business): number {
  return [
    Object.keys(business.hours).length > 0,
    Boolean(business.phone),
    Boolean(business.website),
    Boolean(business.address),
    Boolean(business.locality),
  ].filter(Boolean).length;
}

function byRecommended(a: Business, b: Business): number {
  return (
    b.completeness - a.completeness ||
    bayesianRating(b.rating, b.reviewCount) - bayesianRating(a.rating, a.reviewCount) ||
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}

export function sortBusinesses(
  items: Business[],
  sort: BusinessSort = 'recommended',
  near?: { lat: number; lng: number },
): Business[] {
  const rows = [...items];

  switch (sort) {
    case 'rating':
      return rows.sort(
        (a, b) =>
          bayesianRating(b.rating, b.reviewCount) - bayesianRating(a.rating, a.reviewCount) ||
          byRecommended(a, b),
      );

    case 'reviewed':
      return rows.sort((a, b) => b.reviewCount - a.reviewCount || byRecommended(a, b));

    case 'nearest':
      // Without a point there is no "near", so rather than inventing an order
      // this falls back to the default rather than returning the input order.
      if (!near) return rows.sort(byRecommended);
      return rows.sort(
        (a, b) =>
          distanceKm(near.lat, near.lng, a.lat, a.lng) - distanceKm(near.lat, near.lng, b.lat, b.lng),
      );

    case 'name':
      return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    default:
      return rows.sort(byRecommended);
  }
}
```

- [ ] **Step 4: Verify `distanceKm` has the signature this assumes**

Run: `grep -n "export function distanceKm" -A3 src/lib/utils.ts`
Expected: `distanceKm(lat1, lng1, lat2, lng2)`. If the real signature takes objects, adapt the two call sites in `sortBusinesses` and nothing else.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/directory-ranking.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/directory/ranking.ts tests/directory-ranking.test.ts
git commit -m "Rank the directory by how much we know, not by a rating nothing has yet"
```

---

### Task 5: The OSM category whitelist

**Files:**
- Create: `scripts/lib/osm-categories.mjs`
- Test: `tests/osm-mapping.test.ts`

**Interfaces:**
- Consumes: `BUSINESS_CATEGORY_SLUGS` from `@/lib/constants` (test only).
- Produces: `OSM_CATEGORY_MAP` (Record<string, string>), `CATEGORY_GROUPS` (`{ group: string; tags: string[] }[]`), `categoryForTags(tags)`, `priceBandForTags(tags)` — all from `scripts/lib/osm-categories.mjs`.

> **Why `.mjs` and not `.ts`:** `scripts/directory-import.mjs` needs this map and cannot import TypeScript. Vitest *can* import `.mjs`, so one `.mjs` module is imported by both the script and the test — which is how the map stays single-sourced instead of drifting in two copies.

- [ ] **Step 1: Write the failing test**

Create `tests/osm-mapping.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BUSINESS_CATEGORY_SLUGS } from '@/lib/constants';
import { CATEGORY_GROUPS, OSM_CATEGORY_MAP, categoryForTags, priceBandForTags } from '../scripts/lib/osm-categories.mjs';

describe('OSM category map', () => {
  it('maps every tag to a category that actually exists', () => {
    const unknown = Object.entries(OSM_CATEGORY_MAP)
      .filter(([, slug]) => !BUSINESS_CATEGORY_SLUGS.includes(slug))
      .map(([tag, slug]) => `${tag} -> ${slug}`);
    expect(unknown).toEqual([]);
  });

  it('maps every tag exactly once', () => {
    const tags = Object.keys(OSM_CATEGORY_MAP);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('uses key=value tag syntax throughout', () => {
    for (const tag of Object.keys(OSM_CATEGORY_MAP)) expect(tag).toMatch(/^[a-z_]+=[a-z_:]+$/);
  });

  it('lists every mapped tag in exactly one query group', () => {
    const grouped = CATEGORY_GROUPS.flatMap((g) => g.tags);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual(Object.keys(OSM_CATEGORY_MAP).sort());
  });

  it('never maps to a top-level category — imports land on a leaf', () => {
    const parents = ['food-drink', 'active-life', 'study-work', 'beauty-spas', 'shopping', 'nightlife', 'home-services', 'health'];
    const bad = Object.entries(OSM_CATEGORY_MAP).filter(([, slug]) => parents.includes(slug));
    expect(bad).toEqual([]);
  });
});

describe('categoryForTags', () => {
  it('resolves a known tag', () => {
    expect(categoryForTags({ amenity: 'restaurant', name: 'Anna' })).toBe('restaurants');
    expect(categoryForTags({ shop: 'hairdresser', name: 'Cut' })).toBe('barbers');
    expect(categoryForTags({ leisure: 'fitness_centre', name: 'Iron' })).toBe('gyms');
  });

  it('returns null for anything unmapped rather than guessing a bucket', () => {
    expect(categoryForTags({ amenity: 'bench' })).toBeNull();
    expect(categoryForTags({ name: 'No tags' })).toBeNull();
  });
});

describe('priceBandForTags', () => {
  it('reads an explicit OSM price level', () => {
    expect(priceBandForTags({ 'price:level': '2' })).toBe(2);
  });

  it('clamps out-of-range values and ignores junk', () => {
    expect(priceBandForTags({ 'price:level': '9' })).toBe(4);
    expect(priceBandForTags({ 'price:level': 'cheap' })).toBeNull();
    expect(priceBandForTags({})).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/osm-mapping.test.ts`
Expected: FAIL — cannot resolve `../scripts/lib/osm-categories.mjs`.

- [ ] **Step 3: Write the implementation**

Create `scripts/lib/osm-categories.mjs`:

```js
/**
 * Which OpenStreetMap tags become which directory category.
 *
 * A whitelist, not a classifier. Anything not named here is skipped and
 * counted rather than swept into a "More" bucket: a directory that files a
 * bus shelter under Shopping is worse than one that admits it has not mapped
 * bus shelters. `npm run directory:check` reports the commonest skipped tags,
 * so this map grows from evidence rather than imagination.
 *
 * Imported by both `scripts/directory-import.mjs` and `tests/osm-mapping.test.ts`
 * — hence .mjs, which both a Node script and Vitest can read. The test is what
 * stops a typo here from silently dropping a whole category.
 */

export const OSM_CATEGORY_MAP = {
  /* food & drink */
  'amenity=restaurant':      'restaurants',
  'amenity=cafe':            'cafes',
  'amenity=fast_food':       'fast-food',
  'amenity=ice_cream':       'ice-cream',
  'amenity=food_court':      'fast-food',
  'shop=bakery':             'bakeries',
  'shop=pastry':             'bakeries',

  /* nightlife */
  'amenity=bar':             'bars',
  'amenity=pub':             'pubs',
  'amenity=nightclub':       'clubs',

  /* active life */
  'leisure=fitness_centre':  'gyms',
  'leisure=sports_centre':   'sports-venues',
  'leisure=pitch':           'sports-venues',
  'leisure=stadium':         'sports-venues',
  'leisure=swimming_pool':   'swimming',
  'leisure=park':            'parks',
  'leisure=garden':          'parks',
  'sport=yoga':              'yoga-studios',

  /* study & work */
  'amenity=library':         'libraries',
  'amenity=college':         'colleges',
  'amenity=university':      'colleges',
  'amenity=coworking_space': 'coworking',
  'office=coworking':        'coworking',
  'amenity=training':        'coaching-centres',
  'office=educational_institution': 'coaching-centres',

  /* beauty & spas */
  'shop=hairdresser':        'barbers',
  'shop=beauty':             'salons',
  'leisure=spa':             'spas',
  'shop=massage':            'spas',

  /* shopping */
  'shop=books':              'bookshops',
  'shop=clothes':            'clothing',
  'shop=shoes':              'clothing',
  'shop=electronics':        'electronics',
  'shop=mobile_phone':       'electronics',
  'shop=computer':           'electronics',
  'shop=supermarket':        'groceries',
  'shop=convenience':        'groceries',
  'shop=greengrocer':        'groceries',
  'shop=stationery':         'stationery',
  'shop=copyshop':           'stationery',

  /* home services */
  'shop=laundry':            'laundry',
  'shop=dry_cleaning':       'laundry',
  'shop=hardware':           'repairs',
  'shop=doityourself':       'repairs',
  'craft=electrician':       'repairs',
  'craft=plumber':           'repairs',
  'shop=car_repair':         'car-repair',

  /* health */
  'amenity=clinic':          'clinics',
  'amenity=doctors':         'clinics',
  'amenity=hospital':        'clinics',
  'amenity=pharmacy':        'pharmacies',
  'amenity=dentist':         'dentists',
};

/**
 * How the tags are batched into Overpass queries.
 *
 * One request per city per group rather than per tag: ~8 requests a city
 * instead of ~50, which is the difference between a half-hour run and a
 * rate-limited afternoon. Groups follow the top-level categories so a failure
 * is legible ("nightlife failed for Indore") rather than opaque.
 */
export const CATEGORY_GROUPS = [
  { group: 'food-drink',    tags: ['amenity=restaurant', 'amenity=cafe', 'amenity=fast_food', 'amenity=ice_cream', 'amenity=food_court', 'shop=bakery', 'shop=pastry'] },
  { group: 'nightlife',     tags: ['amenity=bar', 'amenity=pub', 'amenity=nightclub'] },
  { group: 'active-life',   tags: ['leisure=fitness_centre', 'leisure=sports_centre', 'leisure=pitch', 'leisure=stadium', 'leisure=swimming_pool', 'leisure=park', 'leisure=garden', 'sport=yoga'] },
  { group: 'study-work',    tags: ['amenity=library', 'amenity=college', 'amenity=university', 'amenity=coworking_space', 'office=coworking', 'amenity=training', 'office=educational_institution'] },
  { group: 'beauty-spas',   tags: ['shop=hairdresser', 'shop=beauty', 'leisure=spa', 'shop=massage'] },
  { group: 'shopping',      tags: ['shop=books', 'shop=clothes', 'shop=shoes', 'shop=electronics', 'shop=mobile_phone', 'shop=computer', 'shop=supermarket', 'shop=convenience', 'shop=greengrocer', 'shop=stationery', 'shop=copyshop'] },
  { group: 'home-services', tags: ['shop=laundry', 'shop=dry_cleaning', 'shop=hardware', 'shop=doityourself', 'craft=electrician', 'craft=plumber', 'shop=car_repair'] },
  { group: 'health',        tags: ['amenity=clinic', 'amenity=doctors', 'amenity=hospital', 'amenity=pharmacy', 'amenity=dentist'] },
];

/**
 * The first tag on the element that we recognise wins. Order matters only for
 * elements carrying two mapped tags (a cafe inside a bookshop), where the
 * more specific key is checked first.
 */
export function categoryForTags(tags = {}) {
  for (const key of ['amenity', 'shop', 'leisure', 'craft', 'office', 'sport']) {
    const value = tags[key];
    if (!value) continue;
    const slug = OSM_CATEGORY_MAP[`${key}=${value}`];
    if (slug) return slug;
  }
  return null;
}

/** OSM's `price:level` is 1–4 where it exists at all, which is rarely. */
export function priceBandForTags(tags = {}) {
  const raw = tags['price:level'];
  if (raw === undefined) return null;
  const value = Number(raw);
  if (!Number.isInteger(value)) return null;
  return Math.min(4, Math.max(1, value));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/osm-mapping.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/osm-categories.mjs tests/osm-mapping.test.ts
git commit -m "Whitelist the OSM tags we understand, and count the ones we do not"
```

---

### Task 6: Directory query parsing

**Files:**
- Create: `src/lib/directory/query.ts`
- Test: `tests/directory-query.test.ts`

**Interfaces:**
- Consumes: `BusinessQuery`, `BusinessSort`, `PriceBand` from `@/types`; `BUSINESS_CATEGORY_SLUGS`, `BUSINESS_SORT_OPTIONS` from `@/lib/constants`.
- Produces: `parseBusinessQuery(params)`, `toBusinessSearchParams(query)`, `activeDirectoryFilterCount(query)`.

- [ ] **Step 1: Write the failing test**

Create `tests/directory-query.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { activeDirectoryFilterCount, parseBusinessQuery, toBusinessSearchParams } from '@/lib/directory/query';

describe('parseBusinessQuery', () => {
  it('falls back to a sane empty query', () => {
    expect(parseBusinessQuery({})).toEqual({
      term: '', city: '', category: '', priceBand: undefined,
      openNow: false, sort: 'recommended', page: 1, near: undefined,
    });
  });

  it('keeps a category that exists in the catalogue', () => {
    expect(parseBusinessQuery({ cat: 'cafes' }).category).toBe('cafes');
  });

  it('drops a category that does not, so a hand-edited URL cannot show an empty page', () => {
    expect(parseBusinessQuery({ cat: 'unicorns' }).category).toBe('');
  });

  it('drops a meetup category — the two taxonomies are separate', () => {
    expect(parseBusinessQuery({ cat: 'exam-prep' }).category).toBe('');
  });

  it('takes the first value when a param repeats', () => {
    expect(parseBusinessQuery({ q: ['tea', 'coffee'] }).term).toBe('tea');
  });

  it('accepts a valid sort and rejects an invalid one', () => {
    expect(parseBusinessQuery({ sort: 'rating' }).sort).toBe('rating');
    expect(parseBusinessQuery({ sort: 'cheapest' }).sort).toBe('recommended');
  });

  it('accepts price bands 1 to 4 only', () => {
    expect(parseBusinessQuery({ price: '3' }).priceBand).toBe(3);
    expect(parseBusinessQuery({ price: '0' }).priceBand).toBeUndefined();
    expect(parseBusinessQuery({ price: '5' }).priceBand).toBeUndefined();
    expect(parseBusinessQuery({ price: 'free' }).priceBand).toBeUndefined();
  });

  it('reads open=true as a flag', () => {
    expect(parseBusinessQuery({ open: 'true' }).openNow).toBe(true);
    expect(parseBusinessQuery({ open: 'yes' }).openNow).toBe(false);
  });

  it('clamps a nonsense page to 1', () => {
    expect(parseBusinessQuery({ page: '0' }).page).toBe(1);
    expect(parseBusinessQuery({ page: '-4' }).page).toBe(1);
    expect(parseBusinessQuery({ page: 'x' }).page).toBe(1);
    expect(parseBusinessQuery({ page: '3' }).page).toBe(3);
  });

  it('takes coordinates only when both halves are on the globe', () => {
    expect(parseBusinessQuery({ lat: '18.52', lng: '73.85' }).near).toEqual({ lat: 18.52, lng: 73.85 });
    expect(parseBusinessQuery({ lat: '18.52' }).near).toBeUndefined();
    expect(parseBusinessQuery({ lat: '99', lng: '73.85' }).near).toBeUndefined();
  });
});

describe('toBusinessSearchParams', () => {
  it('round-trips a full query', () => {
    const query = parseBusinessQuery({ q: 'chai', city: 'pune', cat: 'cafes', sort: 'rating', price: '2', open: 'true', page: '2' });
    expect(parseBusinessQuery(Object.fromEntries(toBusinessSearchParams(query)))).toEqual(query);
  });

  it('omits defaults so a clean URL stays clean', () => {
    expect(toBusinessSearchParams(parseBusinessQuery({})).toString()).toBe('');
  });
});

describe('activeDirectoryFilterCount', () => {
  it('counts only the filters that narrow the list', () => {
    expect(activeDirectoryFilterCount(parseBusinessQuery({}))).toBe(0);
    expect(activeDirectoryFilterCount(parseBusinessQuery({ city: 'pune', cat: 'cafes', open: 'true' }))).toBe(3);
    // Sort and page reorder or paginate; they do not filter.
    expect(activeDirectoryFilterCount(parseBusinessQuery({ sort: 'rating', page: '4' }))).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/directory-query.test.ts`
Expected: FAIL — cannot resolve `@/lib/directory/query`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/directory/query.ts`:

```ts
import type { BusinessQuery, BusinessSort, PriceBand } from '@/types';
import { BUSINESS_CATEGORY_SLUGS, BUSINESS_SORT_OPTIONS } from '@/lib/constants';

/**
 * URL search params ↔ typed directory query, shared by the server page and the
 * client filter rail — the same split `src/lib/query-string.ts` makes for the
 * meetup board, and deliberately a separate file: the two share no parameter
 * names and merging them would mean one function full of "if directory".
 *
 * Anything unrecognised is dropped rather than passed through, so a
 * hand-edited or stale URL degrades to a broader page instead of an
 * unexplained empty one.
 */

const SORT_VALUES = BUSINESS_SORT_OPTIONS.map((s) => s.value);

export function parseBusinessQuery(
  params: Record<string, string | string[] | undefined>,
): BusinessQuery {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const category = get('cat');
  const sort = get('sort');
  const price = Number(get('price'));
  const page = Number(get('page'));

  return {
    term: get('q') ?? '',
    city: get('city') ?? '',
    category: category && BUSINESS_CATEGORY_SLUGS.includes(category) ? category : '',
    priceBand: Number.isInteger(price) && price >= 1 && price <= 4 ? (price as PriceBand) : undefined,
    openNow: get('open') === 'true',
    sort: sort && SORT_VALUES.includes(sort as BusinessSort) ? (sort as BusinessSort) : 'recommended',
    page: Number.isInteger(page) && page > 0 ? page : 1,
    near: coordsFrom(get('lat'), get('lng')),
  };
}

function coordsFrom(lat?: string, lng?: string) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!lat || !lng || Number.isNaN(latitude) || Number.isNaN(longitude)) return undefined;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return undefined;
  return { lat: latitude, lng: longitude };
}

export function toBusinessSearchParams(query: BusinessQuery) {
  const params = new URLSearchParams();
  if (query.term) params.set('q', query.term);
  if (query.city) params.set('city', query.city);
  if (query.category) params.set('cat', query.category);
  if (query.priceBand) params.set('price', String(query.priceBand));
  if (query.openNow) params.set('open', 'true');
  if (query.sort && query.sort !== 'recommended') params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.near) {
    params.set('lat', query.near.lat.toFixed(5));
    params.set('lng', query.near.lng.toFixed(5));
  }
  return params;
}

/** Drives the count badge on the Filters button. Sort and page are not filters. */
export function activeDirectoryFilterCount(query: BusinessQuery) {
  return [query.city, query.category, query.priceBand, query.openNow ? 'open' : '']
    .filter(Boolean).length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/directory-query.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/directory/query.ts tests/directory-query.test.ts
git commit -m "Parse directory search params, dropping anything the catalogue does not know"
```

---

### Task 7: Demo seed and store wiring

**Files:**
- Create: `src/lib/data/seed-businesses.ts`
- Modify: `src/lib/data/store.ts`

**Interfaces:**
- Consumes: `Business`, `BusinessReview` from `@/types`; `completenessOf` from `@/lib/directory/ranking`; `parseOpeningHours` from `@/lib/directory/hours`.
- Produces: `SEED_BUSINESSES: Business[]`, `SEED_BUSINESS_REVIEWS: BusinessReview[]`; `DemoDb.businesses`, `DemoDb.businessReviews`.

> This is the hand-written starter seed so the repository and the UI are buildable before the importer exists. Task 10's `--sample` flag replaces this file wholesale with real OSM rows.

- [ ] **Step 1: Write the seed**

Create `src/lib/data/seed-businesses.ts` exactly as below — three rows, no more. They are deliberately the minimum that exercises every repository test in Task 8: two cities, three categories, and a completeness spread of 5 / 4 / 0 so the Recommended sort has something to order. Task 10's `--sample` replaces this file with real OSM rows, so hand-writing a larger fixture would be work thrown away.

Hours are written as the parsed shape rather than parsed at module load, because that is exactly what the database stores.

```ts
import type { Business, BusinessReview } from '@/types';
import { completenessOf } from '@/lib/directory/ranking';

/**
 * Demo-mode listings.
 *
 * Hand-written for now so the repository and the pages are buildable before
 * the importer runs; `node scripts/directory-import.mjs --sample` overwrites
 * this file with real OpenStreetMap rows once it exists.
 *
 * Completeness is computed rather than typed out, for the same reason
 * Postgres generates it rather than storing a literal: two hand-maintained
 * copies of a derived number drift, and the drift is invisible.
 */
function business(row: Omit<Business, 'completeness' | 'attribution'>): Business {
  const full = { ...row, attribution: 'OpenStreetMap contributors, ODbL', completeness: 0 };
  return { ...full, completeness: completenessOf(full) };
}

export const SEED_BUSINESSES: Business[] = [
  business({
    id: 'biz-001',
    slug: 'vaishali-fergusson-road-pune',
    name: 'Vaishali',
    citySlug: 'pune',
    categorySlug: 'restaurants',
    address: '1218/1 Fergusson College Road',
    locality: 'Shivajinagar',
    lat: 18.5236, lng: 73.8407,
    phone: '+912025533636',
    website: null,
    hours: { mon: [{ open: 420, close: 1350 }], tue: [{ open: 420, close: 1350 }], wed: [{ open: 420, close: 1350 }], thu: [{ open: 420, close: 1350 }], fri: [{ open: 420, close: 1350 }], sat: [{ open: 420, close: 1350 }], sun: [{ open: 420, close: 1350 }] },
    priceBand: 2,
    rating: 0, reviewCount: 0,
    claimedBy: null,
    createdAt: '2026-01-04T05:00:00.000Z',
  }),
  business({
    id: 'biz-002',
    slug: 'third-wave-coffee-koramangala-bengaluru',
    name: 'Third Wave Coffee',
    citySlug: 'bengaluru',
    categorySlug: 'cafes',
    address: '80 Feet Road, 4th Block',
    locality: 'Koramangala',
    lat: 12.9345, lng: 77.6265,
    phone: '+918041234567',
    website: 'https://thirdwavecoffee.in',
    hours: { mon: [{ open: 480, close: 1380 }], tue: [{ open: 480, close: 1380 }], wed: [{ open: 480, close: 1380 }], thu: [{ open: 480, close: 1380 }], fri: [{ open: 480, close: 1380 }], sat: [{ open: 480, close: 1380 }], sun: [{ open: 480, close: 1380 }] },
    priceBand: 2,
    rating: 0, reviewCount: 0,
    claimedBy: null,
    createdAt: '2026-01-04T05:00:00.000Z',
  }),
  business({
    id: 'biz-003',
    slug: 'cult-fit-indore-vijay-nagar',
    name: 'Cult.fit Vijay Nagar',
    citySlug: 'indore',
    categorySlug: 'gyms',
    address: 'Scheme 54, Vijay Nagar',
    locality: 'Vijay Nagar',
    lat: 22.7533, lng: 75.8937,
    phone: null,
    website: null,
    hours: {},
    priceBand: null,
    rating: 0, reviewCount: 0,
    claimedBy: null,
    createdAt: '2026-01-04T05:00:00.000Z',
  }),
];

/**
 * Two reviews, on one business only.
 *
 * Deliberately sparse: the interesting demo state is a directory where almost
 * nothing has been reviewed, because that is the real state on launch day and
 * the state the Recommended sort exists to handle.
 */
export const SEED_BUSINESS_REVIEWS: BusinessReview[] = [
  {
    id: 'br-001',
    businessId: 'biz-001',
    userId: 'u001',
    authorName: 'Aditi Rao',
    authorAvatar: null,
    rating: 5,
    body: 'The sambar has not changed in thirty years and that is the entire point. Go before nine or queue.',
    photos: [],
    createdAt: '2026-02-11T04:30:00.000Z',
    ownerReply: null,
    ownerReplyAt: null,
  },
  {
    id: 'br-002',
    businessId: 'biz-001',
    userId: 'u002',
    authorName: 'Rohan Mehta',
    authorAvatar: null,
    rating: 4,
    body: 'Good for a study break, bad for studying — nobody will let you keep a table for three hours at lunch.',
    photos: [],
    createdAt: '2026-02-19T11:15:00.000Z',
    ownerReply: null,
    ownerReplyAt: null,
  },
];
```

> **Before writing the two reviews:** `SEED_USERS` in `src/lib/data/seed.ts:70` generates ids as `u001`, `u002`, … from the `people` array above it. `u001` and `u002` therefore exist, but their real `fullName` values are whatever `people[0]` and `people[1]` hold — **not** the placeholder names above. Read them out and use the real ones, so the denormalised `authorName` matches the profile it points at.

- [ ] **Step 2: Wire the seed into the demo store**

In `src/lib/data/store.ts`:

Add to the imports:
```ts
import { SEED_BUSINESSES, SEED_BUSINESS_REVIEWS } from './seed-businesses';
import type { Business, BusinessReview } from '@/types';
```

Add to the `DemoDb` interface, after `saves`:
```ts
  /** Directory listings. In Supabase mode these live in `businesses`. */
  businesses: Business[];
  businessReviews: BusinessReview[];
```

Add to the object returned by `createDb()`, after `saves`:
```ts
    businesses: SEED_BUSINESSES.map((b) => ({ ...b })),
    businessReviews: SEED_BUSINESS_REVIEWS.map((r) => ({ ...r })),
```

- [ ] **Step 3: Add a rating helper beside `withAggregates`**

Append to `src/lib/data/store.ts`:

```ts
/**
 * The demo-mode counterpart of the `business_reviews_rating` trigger.
 *
 * Supabase keeps `businesses.rating` current with a trigger; in demo mode
 * nothing does, so this recomputes the two columns for one business after a
 * write. Same contract, different machinery.
 */
export function refreshBusinessRating(businessId: string) {
  const store = db();
  const business = store.businesses.find((b) => b.id === businessId);
  if (!business) return;
  const mine = store.businessReviews.filter((r) => r.businessId === businessId);
  business.reviewCount = mine.length;
  business.rating = mine.length
    ? Math.round((mine.reduce((sum, r) => sum + r.rating, 0) / mine.length) * 10) / 10
    : 0;
}
```

- [ ] **Step 4: Verify it compiles and nothing regressed**

Run: `npm run typecheck && npx vitest run`
Expected: typecheck clean, existing suite still green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/seed-businesses.ts src/lib/data/store.ts
git commit -m "Seed demo mode with a sparse directory, which is the real launch-day state"
```

---

### Task 8: The business repository

**Files:**
- Create: `src/lib/data/businesses.ts`
- Modify: `tests/repository.test.ts`

**Interfaces:**
- Consumes: `isSupabaseConfigured` from `@/lib/env`; `createSupabaseServerClient` from `@/lib/supabase/server`; `db` from `./store`; `sortBusinesses` from `@/lib/directory/ranking`; `isOpenAt` from `@/lib/directory/hours`.
- Produces: `listBusinesses(query: BusinessQuery): Promise<Paginated<Business>>`, `getBusiness(slug: string): Promise<Business | null>`, `getBusinessById(id: string): Promise<Business | null>`, `topBusinesses(citySlug: string, limit?: number): Promise<Business[]>`, `businessCountByCity(citySlug: string): Promise<number>`, `DIRECTORY_PER_PAGE`, `THIN_CITY_THRESHOLD`.

- [ ] **Step 1: Write the failing test**

Append to `tests/repository.test.ts`:

```ts
import { DIRECTORY_PER_PAGE, getBusiness, listBusinesses, topBusinesses } from '@/lib/data/businesses';
import { parseBusinessQuery } from '@/lib/directory/query';

describe('business repository (demo mode)', () => {
  it('lists every seeded business by default', async () => {
    const page = await listBusinesses(parseBusinessQuery({}));
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.total).toBe(page.items.length <= DIRECTORY_PER_PAGE ? page.items.length : page.total);
    expect(page.page).toBe(1);
    expect(page.perPage).toBe(DIRECTORY_PER_PAGE);
  });

  it('filters by city', async () => {
    const page = await listBusinesses(parseBusinessQuery({ city: 'pune' }));
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((b) => b.citySlug === 'pune')).toBe(true);
  });

  it('filters by category', async () => {
    const page = await listBusinesses(parseBusinessQuery({ cat: 'cafes' }));
    expect(page.items.every((b) => b.categorySlug === 'cafes')).toBe(true);
  });

  it('matches a term against the name case-insensitively', async () => {
    const page = await listBusinesses(parseBusinessQuery({ q: 'vaishali' }));
    expect(page.items.map((b) => b.slug)).toContain('vaishali-fergusson-road-pune');
  });

  it('resolves a term that names a category rather than a business', async () => {
    const page = await listBusinesses(parseBusinessQuery({ q: 'cafe' }));
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.some((b) => b.categorySlug === 'cafes')).toBe(true);
  });

  it('returns an empty page rather than throwing for a term nothing matches', async () => {
    const page = await listBusinesses(parseBusinessQuery({ q: 'zzzznotathing' }));
    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.pages).toBe(0);
  });

  it('defaults to the Recommended order — best-documented first', async () => {
    const page = await listBusinesses(parseBusinessQuery({}));
    const scores = page.items.map((b) => b.completeness);
    expect([...scores]).toEqual([...scores].sort((a, b) => b - a));
  });

  it('paginates', async () => {
    const all = await listBusinesses(parseBusinessQuery({}));
    const second = await listBusinesses({ ...parseBusinessQuery({}), perPage: 2, page: 2 });
    expect(second.page).toBe(2);
    expect(second.perPage).toBe(2);
    expect(second.items[0]?.id).not.toBe(all.items[0]?.id);
  });

  it('finds a business by slug and returns null for one that does not exist', async () => {
    expect((await getBusiness('vaishali-fergusson-road-pune'))?.name).toBe('Vaishali');
    expect(await getBusiness('no-such-place')).toBeNull();
  });

  it('returns the strongest listings for a city', async () => {
    const top = await topBusinesses('pune', 3);
    expect(top.length).toBeLessThanOrEqual(3);
    expect(top.every((b) => b.citySlug === 'pune')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/repository.test.ts`
Expected: FAIL — cannot resolve `@/lib/data/businesses`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/data/businesses.ts`:

```ts
import type { Business, BusinessQuery, OpeningHours, Paginated, PriceBand } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BUSINESS_CATEGORIES } from '@/lib/constants';
import { isOpenAt } from '@/lib/directory/hours';
import { sortBusinesses } from '@/lib/directory/ranking';
import { db } from './store';

export const DIRECTORY_PER_PAGE = 20;

/**
 * Below this many listings a city page reads as broken rather than sparse, so
 * the page shows that city's meetup board instead. Better to show the thing we
 * do have than a directory with four entries in it.
 */
export const THIN_CITY_THRESHOLD = 12;

type Row = Record<string, unknown>;

function fromRow(row: Row): Business {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    citySlug: String(row.city_slug),
    categorySlug: String(row.category_slug),
    address: String(row.address ?? ''),
    locality: String(row.locality ?? ''),
    lat: Number(row.lat),
    lng: Number(row.lng),
    phone: (row.phone as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    hours: (row.hours as OpeningHours) ?? {},
    priceBand: (row.price_band as PriceBand | null) ?? null,
    attribution: String(row.attribution ?? 'OpenStreetMap contributors, ODbL'),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    completeness: Number(row.completeness ?? 0),
    claimedBy: (row.claimed_by as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

/**
 * A search term can name a business or a kind of business.
 *
 * "coffee" should find cafes, not only places with Coffee in the name, so the
 * term is resolved against the catalogue first and the resulting slugs widen
 * the match. Without this the commonest possible query returns almost nothing,
 * which is the sort of failure people do not report — they just leave.
 */
function categorySlugsMatching(term: string): string[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  return BUSINESS_CATEGORIES
    .filter((c) => c.name.toLowerCase().includes(needle) || c.slug.includes(needle))
    .map((c) => c.slug);
}

function emptyPage(page: number, perPage: number): Paginated<Business> {
  return { items: [], total: 0, page, perPage, pages: 0 };
}

export async function listBusinesses(query: BusinessQuery): Promise<Paginated<Business>> {
  const perPage = query.perPage ?? DIRECTORY_PER_PAGE;
  const page = Math.max(1, query.page ?? 1);
  const term = (query.term ?? '').trim();
  const categoryHits = categorySlugsMatching(term);

  let rows: Business[];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return emptyPage(page, perPage);

    let builder = supabase.from('businesses').select('*');
    if (query.city) builder = builder.eq('city_slug', query.city);
    if (query.category) builder = builder.eq('category_slug', query.category);
    if (query.priceBand) builder = builder.eq('price_band', query.priceBand);
    if (term) {
      // Name match OR a category the term names. `or` takes a filter string,
      // and an empty `in.()` is a syntax error, hence the conditional.
      const clauses = [`name.ilike.%${term}%`];
      if (categoryHits.length) clauses.push(`category_slug.in.(${categoryHits.join(',')})`);
      builder = builder.or(clauses.join(','));
    }

    const { data, error } = await builder;
    if (error) return emptyPage(page, perPage);
    rows = (data ?? []).map(fromRow);
  } else {
    rows = db().businesses.filter((b) => {
      if (query.city && b.citySlug !== query.city) return false;
      if (query.category && b.categorySlug !== query.category) return false;
      if (query.priceBand && b.priceBand !== query.priceBand) return false;
      if (term) {
        const named = b.name.toLowerCase().includes(term.toLowerCase());
        if (!named && !categoryHits.includes(b.categorySlug)) return false;
      }
      return true;
    });
  }

  // "Open now" cannot be an indexed predicate — it depends on the visitor's
  // clock — so it filters what came back. A page can therefore hold fewer than
  // `perPage` rows while it is on. See the spec's Known limitation.
  if (query.openNow) {
    const now = new Date();
    rows = rows.filter((b) => isOpenAt(b.hours, now));
  }

  const sorted = sortBusinesses(rows, query.sort ?? 'recommended', query.near);
  const start = (page - 1) * perPage;

  return {
    items: sorted.slice(start, start + perPage),
    total: sorted.length,
    page,
    perPage,
    pages: Math.ceil(sorted.length / perPage),
  };
}

export async function getBusiness(slug: string): Promise<Business | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.from('businesses').select('*').eq('slug', slug).maybeSingle();
    return data ? fromRow(data) : null;
  }
  return db().businesses.find((b) => b.slug === slug) ?? null;
}

/**
 * By id rather than slug, for the review form — which posts against the id it
 * was rendered with, not a slug that could have been re-pointed underneath it.
 */
export async function getBusinessById(id: string): Promise<Business | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.from('businesses').select('*').eq('id', id).maybeSingle();
    return data ? fromRow(data) : null;
  }
  return db().businesses.find((b) => b.id === id) ?? null;
}

/** The strip of strongest listings on a city page. */
export async function topBusinesses(citySlug: string, limit = 6): Promise<Business[]> {
  const page = await listBusinesses({ city: citySlug, sort: 'recommended', perPage: limit, page: 1 });
  return page.items;
}

export async function businessCountByCity(citySlug: string): Promise<number> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return 0;
    const { count } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('city_slug', citySlug);
    return count ?? 0;
  }
  return db().businesses.filter((b) => b.citySlug === citySlug).length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/repository.test.ts`
Expected: PASS. If the category-term test fails, confirm the seed from Task 7 contains at least one `cafes` row.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/businesses.ts tests/repository.test.ts
git commit -m "Add the business repository, resolving a search term against the catalogue too"
```

---

### Task 9: Review repository, validator and server action

**Files:**
- Create: `src/lib/data/business-reviews.ts`
- Create: `src/app/actions/reviews.ts`
- Modify: `src/lib/validators.ts`

**Interfaces:**
- Consumes: `getBusiness` from `@/lib/data/businesses`; `refreshBusinessRating` from `@/lib/data/store`; `getCurrentUser` from `@/lib/auth/session`; `fieldErrors` from `@/lib/form`; `ActionResult` from `@/types`.
- Produces: `getBusinessReviews(businessId, sort?)`, `addBusinessReview(input)`, `businessReviewSchema`, `addBusinessReviewAction(businessId, prev, formData)`.

- [ ] **Step 1: Add the validator**

Append to `src/lib/validators.ts`, following the shape of the existing `vouchSchema` (open it first and match its style exactly):

```ts
/**
 * A directory review. No attendance check, unlike a vouch — anybody who has
 * been to a shop can say so, and requiring proof of a visit to a chemist would
 * mean no reviews at all. The floor is a real sentence rather than a rating
 * with no words, which is the shape spam takes.
 */
export const businessReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Pick a rating.').max(5),
  body: z
    .string()
    .trim()
    .min(30, 'Say a little more — thirty characters at least.')
    .max(2000, 'That is longer than we can show.'),
});
```

- [ ] **Step 2: Write the repository**

Create `src/lib/data/business-reviews.ts`:

```ts
import type { BusinessReview } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db, nextId, refreshBusinessRating } from './store';

type Row = Record<string, unknown>;

function fromRow(row: Row): BusinessReview {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    userId: String(row.user_id),
    authorName: String(row.author_name ?? 'A CampusClub member'),
    authorAvatar: (row.author_avatar as string | null) ?? null,
    rating: Number(row.rating ?? 0),
    body: String(row.body ?? ''),
    photos: (row.photos as string[]) ?? [],
    createdAt: String(row.created_at),
    ownerReply: (row.owner_reply as string | null) ?? null,
    ownerReplyAt: (row.owner_reply_at as string | null) ?? null,
  };
}

export type BusinessReviewSort = 'recent' | 'rating';

export async function getBusinessReviews(
  businessId: string,
  sort: BusinessReviewSort = 'recent',
): Promise<BusinessReview[]> {
  let items: BusinessReview[];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from('business_reviews_with_author')
      .select('*')
      .eq('business_id', businessId);
    items = (data ?? []).map(fromRow);
  } else {
    items = db().businessReviews.filter((r) => r.businessId === businessId);
  }

  return sort === 'rating'
    ? [...items].sort((a, b) => b.rating - a.rating)
    : [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export class AlreadyReviewedError extends Error {
  constructor() {
    super('You have already reviewed this place.');
    this.name = 'AlreadyReviewedError';
  }
}

export async function addBusinessReview(input: {
  businessId: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  body: string;
}): Promise<BusinessReview> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error('Database unavailable.');
    const { data, error } = await supabase
      .from('business_reviews')
      .insert({
        business_id: input.businessId,
        user_id: input.userId,
        rating: input.rating,
        body: input.body,
      })
      .select('*')
      .single();

    // 23505 is unique_violation — one review per person per place. Surfacing
    // it as a sentence rather than a 500 is the whole point of catching it.
    if (error?.code === '23505') throw new AlreadyReviewedError();
    if (error) throw new Error(error.message);
    return fromRow({ ...data, author_name: input.authorName, author_avatar: input.authorAvatar });
  }

  const store = db();
  if (store.businessReviews.some((r) => r.businessId === input.businessId && r.userId === input.userId)) {
    throw new AlreadyReviewedError();
  }

  const review: BusinessReview = {
    id: nextId('br'),
    businessId: input.businessId,
    userId: input.userId,
    authorName: input.authorName,
    authorAvatar: input.authorAvatar,
    rating: input.rating,
    body: input.body,
    photos: [],
    createdAt: new Date().toISOString(),
    ownerReply: null,
    ownerReplyAt: null,
  };
  store.businessReviews.unshift(review);
  refreshBusinessRating(input.businessId);
  return review;
}
```

- [ ] **Step 3: Write the server action**

Create `src/app/actions/reviews.ts`. Open `src/app/actions/vouches.ts` first and mirror its structure exactly.

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getBusinessById } from '@/lib/data/businesses';
import { AlreadyReviewedError, addBusinessReview } from '@/lib/data/business-reviews';
import { recordEvent } from '@/lib/admin/events';
import { businessReviewSchema } from '@/lib/validators';
import { fieldErrors } from '@/lib/form';
import type { ActionResult } from '@/types';

/**
 * Writing a review on a directory listing.
 *
 * Unlike `addVouchAction` there is no attendance gate: nobody books a chemist
 * through CampusClub, so requiring a join row would mean the directory never
 * accumulated a single review. The guards that remain are a signed-in author
 * and one review per person per place, which the unique index enforces.
 */
export async function addBusinessReviewAction(
  businessId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to write a review.' };

  const business = await getBusinessById(businessId);
  if (!business) return { ok: false, message: 'That listing no longer exists.' };

  const parsed = businessReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  try {
    await addBusinessReview({
      businessId: business.id,
      userId: user.id,
      authorName: user.fullName,
      authorAvatar: user.avatarUrl,
      ...parsed.data,
    });
  } catch (error) {
    if (error instanceof AlreadyReviewedError) return { ok: false, message: error.message };
    throw error;
  }

  // A public directory with reviews is a spam target, and this milestone ships
  // only the cheap guards. Logging every write is what makes a bad pattern
  // visible in the admin dashboard before there is any moderation tooling.
  // `recordEvent` never throws, so this cannot break a successful review.
  await recordEvent({
    kind: 'api',
    path: `/places/${business.slug}`,
    label: 'Write a review',
    outcome: 'success',
    userId: user.id,
    // No anonymous reviewer exists — the sign-in gate above guarantees it —
    // so the author's own id is the visitor id.
    visitorId: user.id,
  });

  revalidatePath(`/places/${business.slug}`);
  redirect(`/places/${business.slug}#reviews`);
}
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npx vitest run && npm run lint`
Expected: all green. `getBusinessById` exists and the action compiles.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/business-reviews.ts src/app/actions/reviews.ts src/lib/validators.ts src/lib/data/businesses.ts
git commit -m "Let signed-in members review a listing, once each, without an attendance gate"
```

---

### Task 10: The Overpass import script

**Files:**
- Create: `scripts/lib/city-boxes.mjs`
- Create: `scripts/directory-import.mjs`
- Create: `tests/city-boxes.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `CATEGORY_GROUPS`, `categoryForTags`, `priceBandForTags` from `scripts/lib/osm-categories.mjs`.
- Produces: `CITY_BOXES` (Record<slug, [south, west, north, east]>) from `scripts/lib/city-boxes.mjs`; the `directory:import` npm script.

> **Spec correction:** the spec assigned the `CITY_BOXES` ↔ `CITIES` parity check to `directory-check.mjs`. It cannot live there — that script is `.mjs` and cannot import `constants.ts`. It moves to Vitest, which imports both.

- [ ] **Step 1: Write the failing parity test**

Create `tests/city-boxes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CITIES } from '@/lib/constants';
import { CITY_BOXES } from '../scripts/lib/city-boxes.mjs';

describe('city bounding boxes', () => {
  it('covers every city in the catalogue', () => {
    const missing = CITIES.map((c) => c.slug).filter((slug) => !(slug in CITY_BOXES));
    expect(missing).toEqual([]);
  });

  it('has no box for a city that no longer exists', () => {
    const slugs = new Set(CITIES.map((c) => c.slug));
    expect(Object.keys(CITY_BOXES).filter((slug) => !slugs.has(slug))).toEqual([]);
  });

  it('contains its own city centre, so the box is around the right place', () => {
    for (const city of CITIES) {
      const [south, west, north, east] = CITY_BOXES[city.slug];
      expect(city.lat, `${city.slug} latitude`).toBeGreaterThan(south);
      expect(city.lat, `${city.slug} latitude`).toBeLessThan(north);
      expect(city.lng, `${city.slug} longitude`).toBeGreaterThan(west);
      expect(city.lng, `${city.slug} longitude`).toBeLessThan(east);
    }
  });

  it('keeps every box small enough to be a city rather than a region', () => {
    for (const [slug, [south, west, north, east]] of Object.entries(CITY_BOXES)) {
      expect(north - south, `${slug} height`).toBeLessThan(1.0);
      expect(east - west, `${slug} width`).toBeLessThan(1.0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/city-boxes.test.ts`
Expected: FAIL — cannot resolve `../scripts/lib/city-boxes.mjs`.

- [ ] **Step 3: Write the city boxes**

Create `scripts/lib/city-boxes.mjs` with **one entry for every slug in `CITIES`** (38 of them; read `src/lib/constants.ts` line 375 onward for the slug, `lat`, `lng` and `tier` of each).

There is no judgement in this step — apply this rule mechanically:

```
delta = tier === 1 ? 0.12      // metro: ~26 km across
      : tier === 2 ? 0.09      // tier-2 city: ~20 km
      :              0.07      // district town: ~15 km

box = [lat - delta, lng - delta, lat + delta, lng + delta]
```

Round each bound to four decimal places. `tests/city-boxes.test.ts` from Step 1 verifies every city is present, every box contains its own centre, and no box grew to region size — so a slip is caught rather than shipped. Two worked examples (`delhi` is tier 1 at 28.6139/77.2090; `bengaluru` is tier 1 at 12.9716/77.5946):

```js
/**
 * The bounding box each city is imported from.
 *
 * A box rather than a radius because Overpass takes one directly, and because
 * a radius around a coastal city spends half its area on water. Kept here
 * rather than derived from CITIES because scripts are .mjs and cannot import
 * TypeScript; `tests/city-boxes.test.ts` is what stops the two drifting.
 *
 * Order is Overpass's own: [south, west, north, east].
 */
export const CITY_BOXES = {
  delhi:     [28.4939, 77.0890, 28.7339, 77.3290],
  bengaluru: [12.8516, 77.4746, 13.0916, 77.7146],
  // …and the remaining 36, by the same rule.
};
```

- [ ] **Step 4: Run the parity test**

Run: `npx vitest run tests/city-boxes.test.ts`
Expected: PASS, 4 tests, all 38 cities covered.

- [ ] **Step 5: Write the import script**

Create `scripts/directory-import.mjs`:

```js
#!/usr/bin/env node
/**
 * Imports real local businesses from OpenStreetMap into `public.businesses`.
 *
 *   node scripts/directory-import.mjs <city-slug> ...   named cities
 *   node scripts/directory-import.mjs --all             every city in CITY_BOXES
 *   node scripts/directory-import.mjs --dry-run         counts only, no writes
 *   node scripts/directory-import.mjs --sample          rewrite the demo seed
 *
 * One Overpass request per city per category group — about eight a city rather
 * than fifty — paced a few seconds apart, because the public instance is a
 * shared volunteer resource and hammering it gets everyone blocked. A full
 * 38-city run takes roughly half an hour and is meant to be left alone.
 *
 * Nothing here overwrites `rating`, `review_count`, `claimed_by` or
 * `claimed_at`: a re-import refreshes what OSM knows and must never touch what
 * our own members contributed. That is the single most important property of
 * this file.
 *
 * Elements without a `name` tag are dropped. Unnamed nodes are most of OSM,
 * and a directory full of entries called "Restaurant" is worse than a smaller
 * honest one. Unmapped tags are counted and reported rather than bucketed.
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { CATEGORY_GROUPS, categoryForTags, priceBandForTags } from './lib/osm-categories.mjs';
import { CITY_BOXES } from './lib/city-boxes.mjs';
import { parseOpeningHours } from './lib/hours.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = 'https://overpass-api.de/api/interpreter';
const UA = 'CampusClub-directory-import/1.0 (+https://github.com/; repository maintenance script)';

/** Polite pacing between Overpass calls, and the backoff ceiling for retries. */
const PACE_MS = 4000;
const MAX_ATTEMPTS = 3;

/** Cities the --sample seed is drawn from: two metros, two tier-2. */
const SAMPLE_CITIES = ['bengaluru', 'delhi', 'pune', 'indore'];
const SAMPLE_PER_CITY = 60;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Overpass                                                            */
/* ------------------------------------------------------------------ */

function queryFor(box, tags) {
  const [south, west, north, east] = box;
  const bbox = `${south},${west},${north},${east}`;
  const clauses = tags
    .map((tag) => {
      const [key, value] = tag.split('=');
      // nwr = node/way/relation in one go; `center` gives ways a coordinate.
      return `nwr["${key}"="${value}"]["name"](${bbox});`;
    })
    .join('\n  ');
  return `[out:json][timeout:180];\n(\n  ${clauses}\n);\nout center tags;`;
}

async function fetchGroup(citySlug, group) {
  const body = queryFor(CITY_BOXES[citySlug], group.tags);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: `data=${encodeURIComponent(body)}`,
      });

      // 429 (too many requests) and 504 (gateway timeout) are Overpass's normal
      // way of saying "later", not failures worth aborting a 30-minute run for.
      if (response.status === 429 || response.status === 504) {
        throw new Error(`Overpass ${response.status}`);
      }
      if (!response.ok) throw new Error(`Overpass ${response.status}`);

      const json = await response.json();
      return json.elements ?? [];
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw error;
      const backoff = PACE_MS * 2 ** attempt;
      console.warn(`  ${citySlug}/${group.group}: ${error.message}; retrying in ${backoff / 1000}s`);
      await sleep(backoff);
    }
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* Shaping                                                             */
/* ------------------------------------------------------------------ */

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function toRow(element, citySlug, seenSlugs) {
  const tags = element.tags ?? {};
  const name = (tags.name ?? '').trim();
  if (!name) return null;

  const category = categoryForTags(tags);
  if (!category) return null;

  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const locality = tags['addr:suburb'] ?? tags['addr:neighbourhood'] ?? tags['addr:city_district'] ?? '';
  const address = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');

  // Slug collisions are common — every city has three "Sagar Restaurant" — so
  // the OSM id is the tiebreak rather than a counter, which keeps the slug
  // stable across runs instead of depending on iteration order.
  let slug = [slugify(name), slugify(locality), citySlug].filter(Boolean).join('-');
  if (seenSlugs.has(slug)) slug = `${slug}-${element.id}`;
  seenSlugs.add(slug);

  return {
    slug,
    name,
    city_slug: citySlug,
    category_slug: category,
    address,
    locality,
    lat,
    lng,
    phone: tags.phone ?? tags['contact:phone'] ?? null,
    website: tags.website ?? tags['contact:website'] ?? null,
    // Parsed here, once, rather than on every request. It is also what makes
    // the generated `completeness` column meaningful: `hours <> '{}'` has to
    // mean "we know when it is open", not "a string was present".
    hours: parseOpeningHours(tags.opening_hours ?? ''),
    price_band: priceBandForTags(tags),
    osm_type: element.type,
    osm_id: element.id,
    attribution: 'OpenStreetMap contributors, ODbL',
  };
}
```

- [ ] **Step 6: Write the upsert and CLI halves of the script**

Continue `scripts/directory-import.mjs`:

```js
/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to import.');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Upsert on (osm_type, osm_id), in chunks so one oversized city does not
 * become one oversized request.
 *
 * `slug` is deliberately absent from the update: a slug is assigned once and
 * kept forever, so a URL survives an upstream rename. rating, review_count,
 * claimed_by and claimed_at are absent for the more important reason — they
 * are ours, not OSM's.
 */
async function upsert(client, rows) {
  const CHUNK = 500;
  let written = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await client
      .from('businesses')
      .upsert(chunk, { onConflict: 'osm_type,osm_id', ignoreDuplicates: false });
    if (error) throw new Error(`upsert failed: ${error.message}`);
    written += chunk.length;
  }

  return written;
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const sample = args.includes('--sample');
  const all = args.includes('--all');
  const named = args.filter((a) => !a.startsWith('--'));

  const cities = sample ? SAMPLE_CITIES : all ? Object.keys(CITY_BOXES) : named;
  if (!cities.length) {
    console.error('Name at least one city, or pass --all / --sample.');
    process.exit(1);
  }

  const unknown = cities.filter((c) => !CITY_BOXES[c]);
  if (unknown.length) {
    console.error(`No bounding box for: ${unknown.join(', ')}`);
    process.exit(1);
  }

  const client = dryRun || sample ? null : supabaseAdmin();
  const failures = [];
  const unmapped = new Map();
  const collected = [];
  let total = 0;

  for (const citySlug of cities) {
    const seenSlugs = new Set();
    const cityRows = [];

    for (const group of CATEGORY_GROUPS) {
      process.stdout.write(`${citySlug}/${group.group} … `);
      let elements;
      try {
        elements = await fetchGroup(citySlug, group);
      } catch (error) {
        console.log(`FAILED (${error.message})`);
        failures.push(`${citySlug}/${group.group}`);
        await sleep(PACE_MS);
        continue;
      }

      for (const element of elements) {
        const row = toRow(element, citySlug, seenSlugs);
        if (row) cityRows.push(row);
        else if (element.tags?.name) {
          // Named, but we do not understand its type — the interesting case,
          // and the one that tells us what to add to OSM_CATEGORY_MAP next.
          for (const key of ['amenity', 'shop', 'leisure', 'craft', 'office']) {
            if (element.tags[key]) {
              const tag = `${key}=${element.tags[key]}`;
              unmapped.set(tag, (unmapped.get(tag) ?? 0) + 1);
            }
          }
        }
      }

      console.log(`${elements.length} elements`);
      await sleep(PACE_MS);
    }

    console.log(`${citySlug}: ${cityRows.length} listings`);
    total += cityRows.length;

    if (sample) collected.push(...cityRows.slice(0, SAMPLE_PER_CITY));
    else if (!dryRun) await upsert(client, cityRows);
  }

  if (sample) writeSample(collected);

  console.log(`\n${total} listings across ${cities.length} ${cities.length === 1 ? 'city' : 'cities'}.`);

  if (unmapped.size) {
    console.log('\nCommonest unmapped tags — candidates for OSM_CATEGORY_MAP:');
    [...unmapped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
      .forEach(([tag, count]) => console.log(`  ${String(count).padStart(5)}  ${tag}`));
  }

  if (failures.length) {
    console.error(`\n${failures.length} group(s) failed: ${failures.join(', ')}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 7: Write the sample emitter**

Add `writeSample` to the script, above `main`. It must emit a file that type-checks against `Business[]` and matches Task 7's shape — importing `parseOpeningHours` and `completenessOf` so the derived fields stay derived.

```js
/**
 * Rewrites `src/lib/data/seed-businesses.ts` with real rows.
 *
 * Written rather than printed for pasting, which is how city-photos.mjs
 * hands over its results: a few hundred rows cannot be reviewed by eye, and
 * unlike a choice of photograph this is derived data with no editorial
 * judgement in it worth arguing with in review.
 */
function writeSample(rows) {
  const body = rows
    .map((r) => `  business({
    id: ${JSON.stringify(`biz-${r.osm_type}-${r.osm_id}`)},
    slug: ${JSON.stringify(r.slug)},
    name: ${JSON.stringify(r.name)},
    citySlug: ${JSON.stringify(r.city_slug)},
    categorySlug: ${JSON.stringify(r.category_slug)},
    address: ${JSON.stringify(r.address)},
    locality: ${JSON.stringify(r.locality)},
    lat: ${r.lat}, lng: ${r.lng},
    phone: ${JSON.stringify(r.phone)},
    website: ${JSON.stringify(r.website)},
    hours: ${JSON.stringify(r.hours)},
    priceBand: ${r.price_band === null ? 'null' : r.price_band},
    rating: 0, reviewCount: 0,
    claimedBy: null,
    createdAt: '2026-01-04T05:00:00.000Z',
  }),`)
    .join('\n');

  const file = `import type { Business, BusinessReview } from '@/types';
import { completenessOf } from '@/lib/directory/ranking';

/**
 * Demo-mode listings — real places, generated by
 * \`node scripts/directory-import.mjs --sample\`. Do not hand-edit; re-run it.
 *
 * Licensed from OpenStreetMap under the ODbL, which is why every row carries
 * an attribution string and why the directory pages show it.
 */
function business(row: Omit<Business, 'completeness' | 'attribution'>): Business {
  const full = { ...row, attribution: 'OpenStreetMap contributors, ODbL', completeness: 0 };
  return { ...full, completeness: completenessOf(full) };
}

export const SEED_BUSINESSES: Business[] = [
${body}
];

export const SEED_BUSINESS_REVIEWS: BusinessReview[] = [];
`;

  writeFileSync(resolve(ROOT, 'src/lib/data/seed-businesses.ts'), file, 'utf8');
  console.log(`\nWrote ${rows.length} listings to src/lib/data/seed-businesses.ts`);
}
```

> Note: the regenerated file drops the two hand-written reviews. That is intended — real listings have no reviews, and demo mode should show launch-day state. If reviews are wanted for UI work in Plan 2, re-add them by hand after regenerating and keep the ids pointing at real `biz-*` ids.

- [ ] **Step 8: Add the npm script**

In `package.json`, add to `scripts`:

```json
    "directory:import": "node scripts/directory-import.mjs",
```

- [ ] **Step 9: Verify with a dry run**

Run: `npm run directory:import -- pune --dry-run`
Expected: eight group lines for Pune, a listing count in the hundreds, an unmapped-tag table, exit 0, and **no database writes**.

Then: `npm run directory:import -- --sample` and confirm `src/lib/data/seed-businesses.ts` is rewritten with real rows and `npm run typecheck` stays clean.

- [ ] **Step 10: Commit**

```bash
git add scripts/lib/city-boxes.mjs scripts/directory-import.mjs tests/city-boxes.test.ts package.json src/lib/data/seed-businesses.ts
git commit -m "Import real listings from OpenStreetMap, refreshing what OSM knows and nothing of ours"
```

---

### Task 11: The post-import check script

**Files:**
- Create: `scripts/directory-check.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `CITY_BOXES` from `scripts/lib/city-boxes.mjs`; `OSM_CATEGORY_MAP` from `scripts/lib/osm-categories.mjs`; Supabase service role credentials.
- Produces: the `directory:check` npm script.

- [ ] **Step 1: Write the script**

Create `scripts/directory-check.mjs`, modelled on `scripts/media-check.mjs` (read it first for the reporting style):

```js
#!/usr/bin/env node
/**
 * Verifies the imported directory is fit to show.
 *
 *   npm run directory:check
 *
 * The parity between CITY_BOXES and CITIES lives in tests/city-boxes.test.ts
 * rather than here: this file is .mjs and cannot import constants.ts, whereas
 * Vitest can import both. What this checks is the database, which the test
 * suite deliberately does not touch.
 *
 * Exits non-zero on anything that would make a page look broken, so it can
 * gate a deploy.
 */
import { createClient } from '@supabase/supabase-js';
import { CITY_BOXES } from './lib/city-boxes.mjs';
import { OSM_CATEGORY_MAP } from './lib/osm-categories.mjs';

/** Below this a city page reads as broken; matches THIN_CITY_THRESHOLD. */
const THIN_CITY = 12;

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  const supabase = client();
  const problems = [];
  const notes = [];

  const { data: categories, error: catError } = await supabase.from('business_categories').select('slug');
  if (catError) { console.error(catError.message); process.exit(1); }
  const known = new Set((categories ?? []).map((c) => c.slug));

  // Every slug the importer can produce must exist in the table, or a whole
  // category of listing silently fails to insert.
  for (const slug of new Set(Object.values(OSM_CATEGORY_MAP))) {
    if (!known.has(slug)) problems.push(`OSM_CATEGORY_MAP targets "${slug}", which is not in business_categories.`);
  }

  const { data: rows, error } = await supabase.from('businesses').select('city_slug, category_slug, attribution, completeness');
  if (error) { console.error(error.message); process.exit(1); }

  const byCity = new Map();
  for (const row of rows ?? []) {
    byCity.set(row.city_slug, (byCity.get(row.city_slug) ?? 0) + 1);
    if (!known.has(row.category_slug)) problems.push(`Listing in ${row.city_slug} has orphan category "${row.category_slug}".`);
    if (!row.attribution) problems.push(`Listing in ${row.city_slug} has no attribution — that is a licence breach.`);
  }

  for (const slug of Object.keys(CITY_BOXES)) {
    const count = byCity.get(slug) ?? 0;
    if (count === 0) notes.push(`${slug}: not imported yet`);
    else if (count < THIN_CITY) problems.push(`${slug}: only ${count} listings — below the ${THIN_CITY} a page needs to not look dead.`);
  }

  const documented = (rows ?? []).filter((r) => r.completeness >= 3).length;
  const share = rows?.length ? Math.round((documented / rows.length) * 100) : 0;

  console.log(`${rows?.length ?? 0} listings across ${byCity.size} cities.`);
  console.log(`${share}% are well documented (completeness 3+), which is what the Recommended sort ranks on.`);
  notes.forEach((n) => console.log(`  note: ${n}`));

  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    problems.forEach((p) => console.error(`  ${p}`));
    process.exit(1);
  }
  console.log('\nDirectory looks fit to show.');
}

main().catch((error) => { console.error(error); process.exit(1); });
```

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `scripts`:

```json
    "directory:check": "node scripts/directory-check.mjs",
```

- [ ] **Step 3: Verify**

Run: `npm run directory:check`
Expected: with nothing imported it reports every city as "not imported yet" and exits 0. After importing four cities it reports counts and exits 0. Confirm it exits **1** by temporarily lowering `THIN_CITY` above a real city's count.

- [ ] **Step 4: Full suite**

Run: `npm test && npm run lint && npm run typecheck`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add scripts/directory-check.mjs package.json
git commit -m "Check the imported directory is fit to show before anyone links to it"
```

---

## Plan 1 done means

- `npm test`, `npm run lint`, `npm run typecheck` all green.
- Migration `0009_directory.sql` applies cleanly and is idempotent.
- `npm run directory:import -- pune --dry-run` reports listings and writes nothing.
- `npm run directory:import -- --sample` regenerates a type-checking demo seed.
- `npm run directory:check` passes against an imported database.
- No `/places` route exists yet — that is Plan 2.
