# Directory Foundation — design

**Date:** 2026-09-07
**Status:** Approved, ready for implementation planning
**Milestone:** 1 of 3

## Context

CampusClub today is a pay-per-join meetup marketplace: hosts create meetups, members pay
that meetup's join fee, the host keeps the whole fee, and an optional monthly Pass grants
join credits. That lives in `src/lib/economics.ts`, `src/lib/constants.ts` and
`src/types/index.ts`, with vouches, saves, cities and a host earnings calculator shipped.

The product is being extended to combine two reference models:

- **Yelp** — a directory of local businesses with claimable pages, reviews, categories,
  and paid business-side tooling.
- **Timeleft** — a subscription that algorithmically matches members into recurring
  curated gatherings.

### Decisions taken before this spec

1. **Revenue: both, layered.** A consumer subscription funds curated matched gatherings,
   and venues/businesses get claimable pages with paid placement.
2. **Two separate product lines.** Host-created meetups keep pay-per-join and
   host-keeps-the-fee untouched. The subscription covers only CampusClub-curated matched
   gatherings. They do not merge.
3. **Full local business directory**, not venues-only — restaurants, salons, gyms, home
   services, anything local.
4. **Design merge: split by surface.** Timeleft warmth on marketing/consumer surfaces,
   Yelp density on utility surfaces. One token set, two density scales. The existing nine
   palettes and the crest logo are retained.
5. **This milestone is the directory foundation.** The subscription/matching milestone and
   the business-monetization milestone each get their own spec later.

### Architectural approach

Supabase-native directory with a committed demo sample. Listings are imported from
OpenStreetMap into Postgres; the same script emits a few hundred rows into a committed seed
module so demo mode renders a real, non-empty directory. This follows the existing
dual-adapter pattern, where every repository function branches on `isSupabaseConfigured()`.

Rejected alternatives:

- **Static generated JSON, no DB.** Cheaper now, but reviews and claims need a database
  regardless, so listings and everything attached to them would live in different places,
  refreshing listings would need a rebuild, and 10^5 rows cannot be searched client-side.
- **Live Overpass proxy per request.** Rate-limited, seconds per query, unrankable, and
  impossible to join to our own reviews.

### Scope of this milestone

**In:** business domain model and schema, OSM import pipeline, directory browse/search,
business detail pages, reviews on businesses, demo-mode parity, en + hi copy.

**Out (later milestones):** claim-your-page flow, business owner dashboard, paid placement,
moderation tooling, dedicated `/places/[city]/[category]` SEO routes and sitemap expansion,
host-side venue picker UI, subscription and matching.

## Domain model and schema

The directory taxonomy is **separate** from the meetup taxonomy. The existing
`public.categories` table holds 24 activities ("Group study", "Box cricket"). Yelp's
taxonomy is business types ("Restaurants", "Beauty & Spas"). Conflating them makes both
wrong, so a second two-level taxonomy is added.

Migration: `supabase/migrations/0009_directory.sql`. Purely additive; touches no existing
table except one nullable column on `meetups`.

```sql
create table if not exists public.business_categories (
  slug        text primary key,
  name        text not null,
  icon        text not null default 'Store',   -- lucide-react name
  parent_slug text references public.business_categories (slug),
  blurb       text not null default ''
);

create table if not exists public.businesses (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,          -- blue-tokai-koramangala-bengaluru
  name          text not null,
  city_slug     text not null,                 -- matches CITIES in constants.ts
  category_slug text not null references public.business_categories (slug),
  address       text not null default '',
  locality      text not null default '',      -- neighbourhood
  lat           double precision not null,
  lng           double precision not null,
  phone         text,
  website       text,
  hours         jsonb  not null default '{}',  -- parsed from OSM opening_hours
  price_band    smallint check (price_band between 1 and 4),
  osm_type      text,                          -- node | way | relation
  osm_id        bigint,
  attribution   text not null default 'OpenStreetMap contributors, ODbL',
  rating        numeric(2,1) not null default 0,   -- trigger-maintained
  review_count  integer      not null default 0,   -- trigger-maintained
  claimed_by    uuid references public.profiles (id) on delete set null,
  claimed_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (osm_type, osm_id),

  -- Default-sort key. Stored generated rather than computed per request, for the
  -- same reason `rating` is stored: the Recommended sort reads it on every city
  -- page, and a per-row expression cannot be indexed usefully at 10^5 rows.
  completeness  smallint generated always as (
    (case when hours <> '{}'::jsonb then 1 else 0 end) +
    (case when phone   is not null and phone   <> '' then 1 else 0 end) +
    (case when website is not null and website <> '' then 1 else 0 end) +
    (case when address <> '' then 1 else 0 end) +
    (case when locality <> '' then 1 else 0 end)
  ) stored,

  -- Multi-word search. Trigram (below) handles typos and short queries.
  search_vector tsvector generated always as (
    to_tsvector('simple',
      coalesce(name, '') || ' ' || coalesce(locality, '') || ' ' || coalesce(address, ''))
  ) stored
);

create index if not exists businesses_city_cat_idx on public.businesses (city_slug, category_slug);
create index if not exists businesses_name_trgm    on public.businesses using gin (name gin_trgm_ops);
create index if not exists businesses_search_idx   on public.businesses using gin (search_vector);
create index if not exists businesses_rank_idx     on public.businesses (city_slug, rating desc, review_count desc);
create index if not exists businesses_reco_idx     on public.businesses (city_slug, completeness desc, rating desc, name);

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

alter table public.meetups add column if not exists venue_business_id uuid
  references public.businesses (id) on delete set null;
```

`search_vector` covers `(name, locality, address)` — the columns that live on the row.
Category matching is deliberately *not* folded into the vector; it is handled by the
two-pass query resolution described under Search and ranking, which narrows
`category_slug` instead. The trigram index handles typo tolerance on short queries.

The migration also creates the `after insert/update/delete` trigger on `business_reviews`
that maintains `businesses.rating` and `businesses.review_count`.

### Three deliberate choices

1. **`business_reviews` mirrors `vouches` field-for-field.** Separate table because the
   semantics differ (a vouch requires attendance, a review does not), identical shape so
   the review card and form are shared components rather than duplicates.

2. **`rating` and `review_count` are stored and trigger-maintained**, departing from
   `withAggregates()` in `src/lib/data/store.ts`, which derives them so they cannot drift.
   Deriving is right for hundreds of meetups and wrong for ~10^5 businesses, where sorting
   a city page by rating would aggregate the whole review table per request. The trigger
   preserves the single-writer guarantee that made deriving safe.

3. **`claimed_by` / `claimed_at` exist now but are unused** until the monetization
   milestone, so claims become a policy change rather than a migration.

`venue_business_id` on `meetups` is the one column that makes the directory part of the
product rather than a bolt-on: a business page can show meetups happening there. The
host-side UI for choosing a venue is deferred; this milestone adds the column and the read.

### TypeScript types

Added to `src/types/index.ts`: `Business`, `BusinessCategory`, `BusinessReview`,
`BusinessQuery`, `BusinessSort`, `PriceBand`, `OpeningHours`.

## Import pipeline

`scripts/directory-import.mjs`, following the shape established by
`scripts/city-photos.mjs`: a long rationale header, explicit User-Agent, one-at-a-time
pacing, idempotent re-runs, and a companion check script.

```
node scripts/directory-import.mjs <city-slug>...   # named cities
node scripts/directory-import.mjs --all            # every city in CITY_BOXES
node scripts/directory-import.mjs --dry-run        # counts only, no writes
node scripts/directory-import.mjs --sample         # regenerate the demo seed
```

**Querying.** One Overpass call per city per category group — 38 cities x ~8 groups is
~300 queries, paced a few seconds apart, so a full run is a ~30-minute background job and
never sits in a request path. Bounded by a per-city bounding box rather than a radius, so
coastal cities do not pull open sea.

**City list.** The script carries its own `CITY_BOXES` map (slug -> bbox), exactly as
`city-photos.mjs` carries its own `ARTICLES` map: scripts are `.mjs` and cannot import
`constants.ts`, and regex-parsing TypeScript to avoid duplication would be worse than the
duplication. `npm run directory:check` asserts parity between that map and `CITIES` so the
two cannot silently drift.

**Category mapping is a whitelist.** `OSM_CATEGORY_MAP` translates concrete tags
(`amenity=restaurant`, `shop=hairdresser`, `leisure=fitness_centre`) to
`business_categories` slugs. Unmapped tags are **skipped and counted**, never bucketed into
a catch-all; the check script reports the top unmapped tags per run so the map grows from
evidence. Nodes without a `name` tag are dropped — unnamed OSM points are the bulk of the
data, and a directory full of entries called "Restaurant" is worse than a smaller one.

**Idempotency.** Upsert on `(osm_type, osm_id)` in chunks of 500 via the service-role
client. A re-run refreshes name, address and hours and explicitly **does not touch**
`rating`, `review_count`, `claimed_by` or `claimed_at`: a re-import must never wipe a claim
or a review count. Slugs are `name-locality-city`, assigned once on insert and never
regenerated, so a URL survives an upstream rename.

**Demo sample.** `--sample` writes `src/lib/data/seed-businesses.ts` — a few hundred
listings across four cities (two metros, two tier-2, so the density difference is visible),
committed to the repo. Unlike `city-photos.mjs`, this file is written rather than
printed-and-pasted: a few hundred rows cannot be reviewed by pasting, and the sample is
derived data, not an editorial choice worth arguing with in review.

**Attribution.** ODbL requires it. `attribution` rides on every row and renders as a
visible "Listings from OpenStreetMap contributors (ODbL)" credit on directory pages, the
same way Wikimedia artists are credited on city photos.

**`scripts/directory-check.mjs`** (`npm run directory:check`) verifies city-list parity
with `CITIES`, that every `category_slug` resolves, that no city falls below a "this page
will look dead" threshold, and reports the top unmapped OSM tags.

## Routes, surfaces and components

| Route | Surface | Density |
|---|---|---|
| `/places` | Directory home: category tile grid, popular searches per city, top-rated strip | Warm (Timeleft) |
| `/places/search?q=&city=&cat=&sort=&price=&open=` | Results list + sticky filter rail | Dense (Yelp) |
| `/places/[slug]` | Business page: header, hours, map, reviews, meetups here | Hybrid |
| `/cities/[slug]` (existing) | Gains a directory block: top places + category tiles | Warm shell, dense block |

Dedicated `/places/[city]/[category]` SEO routes and sitemap expansion are deferred;
`/places/search?city=&cat=` covers the same ground functionally, and the SEO surface is
worth doing properly alongside claims.

### Density, not a second theme

`globals.css` gains a `.surface-dense` scope overriding a handful of existing custom
properties (card padding, radius, row gap, base font size, avatar size). Warm surfaces are
the unchanged default. The nine palettes and the crest work identically in both, and a
component dropped into a dense parent compacts without a prop.

Yelp contributes structure and density: filter rails, compact rows, result counts, the
category tile grid, the activity feed. Timeleft contributes the marketing register:
editorial headlines, pastel blocks, generous rhythm.

### Components

New, in `src/components/places/`: `place-row.tsx` (dense result row), `place-filters.tsx`
(sticky rail), `hours-table.tsx`, `price-band.tsx`, `rating-stars.tsx`. The directory reuses
`src/components/meetups/meetup-card.tsx` for photo-led business cards and
`src/components/meetups/category-index.tsx`'s flattened tile grid for category browsing,
rather than building `place-card.tsx`/`category-tiles.tsx` as separate components — both
were rebuilt for the site reskin
([[docs/superpowers/specs/2026-09-08-site-reskin-design.md]]) before this milestone started
implementation.

Reused: `src/components/ui/category-icon.tsx`, `src/components/ui/combo-select.tsx` for the
city picker, `badge`, `button`, `src/components/site/page-header.tsx`.

**One targeted refactor:** the review list and form are extracted from
`src/components/meetups/vouch-list.tsx` and `vouch-form.tsx` into a shared
`src/components/reviews/` pair taking a generic subject, with vouches and business reviews
as the two callers. This is justified by the current work, not speculative.

### Data flow

No deviation from the existing pattern. `src/lib/data/businesses.ts` exports
`listBusinesses(query)`, `getBusiness(slug)` and `listBusinessReviews(id)`, each branching
on `isSupabaseConfigured()` — Supabase on one side, the committed sample in the demo store
on the other. Search params parse into a `BusinessQuery` via `src/lib/query-string.ts`.
Pages are Server Components. Writes go through `src/app/actions/reviews.ts`, mirroring
`src/app/actions/vouches.ts`.

### Internationalisation

`en` and `hi` dictionaries are both live. Every new string lands in both. Hindi copy for
the directory is part of this milestone's definition of done, not a follow-up.

## Search and ranking

Two-field search, like Yelp: `q` (what) and `city` (where).

`q` resolves in two passes: first against category names and aliases, where a hit narrows
`category_slug`; then always against the business text index. The union is ranked. This is
what makes "coffee" return cafes rather than only businesses with "Coffee" in the name.

### Cold start

On the day the import lands, every row has `rating = 0` and `review_count = 0`. A default
sort by rating would be effectively random and would look broken — the classic way a fresh
directory dies.

The default **Recommended** sort is therefore:

1. `completeness` — the stored generated column: how many of hours, phone, website,
   address and locality the row actually has, 0 to 5.
2. Review-weighted rating.
3. Name.

`businesses_reco_idx` serves exactly this ordering, so the default city page is one
index scan.

Completeness is a genuine quality signal in OSM: well-documented places are real,
maintained places. The ordering degrades gracefully into rating order as reviews arrive.

Rating sort uses a Bayesian average, `(v/(v+m))*R + (m/(v+m))*C` with `m = 5` and
`C = 3.5`, so a single five-star review cannot outrank a 4.6 with two hundred.

Explicit sorts: Rating, Most reviewed, Distance, A-Z. Page size 20 (dense) against the
meetup board's 12, reusing the existing `Paginated<T>`.

### Known limitation: "open now"

Computed from the `hours` jsonb in the visitor's timezone, so it filters the fetched page
rather than the query, and a page can return fewer than 20 rows when it is enabled. The
honest fix is a generated open-intervals table; it is deferred rather than papered over.

## Failure handling

**Import.** Overpass routinely answers 429 and 504. Each city x category group retries with
exponential backoff up to three times, then is skipped and recorded. One city timing out
must never abort a 30-minute run. The script prints a summary of failed pairs and exits
non-zero if any failed, so a partial import is loud rather than silent.

**App.**

- An unresolved business slug hits the existing `notFound()`.
- Empty search results offer a widened query — drop the category, then the city — rather
  than a dead end.
- A city below the "looks dead" listing threshold shows its meetup board instead of a thin
  directory.
- Demo mode states plainly that it holds a sample rather than the full directory, in the
  same register `src/lib/env.ts` already uses about demo auth.

**Writes.** A `unique (business_id, user_id)` violation surfaces as "you have already
reviewed this place", not a 500.

### Row-level security

Following the baseline exactly:

- `businesses`: public `select`; writes service-role only, since the import owns them.
- `business_reviews`: public `select`; `insert` and `update` require `auth.uid() = user_id`.
- `owner_reply`: policy written now but gated on `claimed_by = auth.uid()`, inert until the
  claims milestone rather than a migration then.

### Trust — flagged, not solved

A public directory with reviews is a spam target. This milestone ships the cheap guards
only: authenticated authors, one review per business per user, and writes logged to
`admin_events`. Moderation, photo review and rate limiting belong with the claims
milestone. This is an explicit gap, not an assumed one.

## Testing

Vitest + Testing Library in `tests/`, Playwright in `e2e/`. Nothing new is introduced.

**Written test-first**, because they are the subtle ones:

- `tests/directory-ranking.test.ts` — completeness score, Bayesian average, and
  specifically the cold-start case: every row at `rating 0, review_count 0` must produce a
  stable, non-arbitrary order.
- `tests/hours.test.ts` — OSM `opening_hours` to jsonb, and "open now" across
  midnight-crossing ranges, `24/7`, split shifts and closed days.

**Also added:**

- `tests/osm-mapping.test.ts` — runs against the real `OSM_CATEGORY_MAP`: every target slug
  exists, no tag maps twice, nothing falls into a catch-all.
- `tests/directory-query.test.ts` — search params to `BusinessQuery`, defaults, junk input,
  extending the `tests/query-string.test.ts` patterns.
- Extensions to `tests/repository.test.ts` (businesses in demo mode: list, filter,
  paginate, slug miss) and `tests/components.test.tsx` (place row and card, stars, price
  band, dense scope).
- A test that both vouches and business reviews render through the extracted shared review
  component — this is what makes the refactor safe rather than hopeful.

**E2E** `e2e/directory.spec.ts`: search from `/places` to results to a business page; the
filter rail round-trips through the URL; a signed-out review attempt hits the auth gate.
Directory coverage is added to the existing `responsive`, `theme` and `language` specs
rather than duplicated.

## Rollout

Each step is independently landable.

1. Migration `0009_directory.sql` — tables, indexes, rating trigger, RLS.
2. Types, `businesses.ts` repository, small hand-written demo seed.
3. UI surfaces against that seed, so the UI is buildable before any import runs.
4. Import script and `directory:check`; run four cities; `--sample` regenerates the
   committed seed.
5. Full 38-city import as a background job.
6. `hi` dictionary pass and visible ODbL attribution.

**Relationship to the passes blocker.** The production schema is currently out of sync with
the pay-per-join + credits model and the Passes feature is broken. Migration `0009` is
purely additive and touches no passes or subscription table. That fix belongs with the
subscription milestone, where it is unavoidable anyway; the two must not entangle here.

**Gating.** The `/places` nav entry stays behind `NEXT_PUBLIC_DIRECTORY_ENABLED` until step
5 completes. Production is live, and a half-imported directory should not be linked from
the navbar.

## Definition of done

- Migration applied to production.
- `npm test`, `npm run lint`, `npm run typecheck` green.
- `npm run directory:check` green.
- Four cities imported and browsable in both Supabase and demo mode.
- `en` and `hi` copy complete.
- ODbL attribution visible on directory surfaces.
