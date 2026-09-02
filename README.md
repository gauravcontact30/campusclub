# HomeMart

**Find the good stuff. Meet the good people.**

A local discovery platform that puts two products in one loop: a Yelp-style
directory of neighbourhood businesses with honest, verified reviews, and a
Timeleft-style dinner club that seats you with five strangers every Wednesday.
The reviews decide where the dinners happen; the dinners produce the people who
write the reviews.

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS ·
Supabase**.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

That is the whole setup. **No Supabase keys are required to run the app** — with
no credentials it boots in *demo mode* against a seeded in-memory dataset (24
businesses, 100+ reviews, 24 dinner tables, 8 accounts) so every screen and
every flow is clickable immediately.

Sign in with any seeded account, e.g. `priya@example.com` / `password123`, or
create a new one — both work in demo mode.

Add Supabase credentials to `.env.local` and the identical code paths talk to
Postgres and Supabase Auth instead. See [`supabase/README.md`](supabase/README.md).

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | no | Switches the app to the Supabase backend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | Browser + server client key |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Server-only; used by the seeding endpoint |
| `NEXT_PUBLIC_SITE_URL` | no | Absolute URLs for metadata and auth redirects |

---

## What it does

### The directory (the Yelp half)

- **Search** across names, descriptions, tags and neighbourhoods, debounced and
  reflected in the URL so any result set is shareable.
- **Filters** for city, category, price tier, minimum rating and *open now*,
  plus five sort orders. Price tiers render in the currency of the city being
  filtered (`₹₹`, `$$$`, `££`).
- **Listing pages** with a photo gallery and lightbox, opening hours that know
  what day it is, a map card with directions hand-off, contact details,
  amenities, related places and the full review thread.
- **Reviews**: five-star input with live labels, one review per person per
  business (editable, deletable), helpful votes, four sort orders and a rating
  distribution histogram.
- **Search near me** — one tap shares the visitor's coordinates (kept in the URL,
  never stored), sorts nearest-first and puts a distance on every card.
- **Saved places** — bookmark anything, revisit it from your list.
- **Add a business** — a validated listing form, claimable by its owner.

### Owner tools

- **Claim a listing** from its page: role, work email and phone are filed as a
  claim record, and ownership transfers immediately (beta behaviour — the filed
  claim is what gets spot-checked afterwards).
- **A public right of reply** on every review, shown under the business name,
  editable and withdrawable. Owners can never edit or delete the review itself.
- Claimed listings carry a badge, and the owner sees how many reviews are still
  waiting on an answer.

### The dinners (the Timeleft half)

- **Upcoming tables** grouped by date, filterable by city, with live seat
  counters and automatic waitlisting once six seats go.
- **A six-question matching questionnaire**, persisted mid-flow so a refresh
  never loses progress.
- **Booking** with confirm / waitlist / cancel, seat numbers, and a venue that
  is only revealed 36 hours before the table.
- **Your table** — five anonymised profiles, deterministic per booking,
  blurred until your seat is confirmed.
- **Membership plans** with per-city pricing.

### Everywhere

Accounts and sessions, a profile with your stats and review history,
toast notifications, skeleton and empty states, a 404 and an error boundary,
`sitemap.xml`, `robots.txt`, per-page metadata, keyboard-visible focus rings,
`prefers-reduced-motion` support, and a layout that works from 320px up.

---

## Architecture

### One domain, two interchangeable backends

Every repository function in `src/lib/data/*` branches once on
`isSupabaseConfigured()` and returns the same shapes from `src/types`:

```
 page / server action
        │
        ▼
 src/lib/data/*  ──►  isSupabaseConfigured()
                          ├── true  ──►  Supabase Postgres (RLS enforced)
                          └── false ──►  seeded in-memory store
```

Pages, components and tests never learn which backend answered. That is what
makes the app fully functional with zero configuration while staying a real
Supabase application.

### Data flow

- **Reads** happen in Server Components (`app/**/page.tsx`) for a fast first
  paint and SEO.
- **Live filtering** on the directory runs through TanStack Query against
  `GET /api/businesses`, seeded with the server-rendered first page.
- **Writes** are Server Actions (`src/app/actions/*`), validated with Zod,
  followed by `revalidatePath`.
- **Client state** (mobile nav, toasts, quiz progress) lives in Zustand; the
  quiz store is persisted to `localStorage`.

---

## Folder structure

```
home-mart/
├── e2e/                        Playwright specs (directory, auth, dinners, responsive)
├── public/
│   ├── img/covers/             Generated SVG cover art (no external images needed)
│   ├── img/avatars/            Generated member avatars
│   └── logo.svg
├── src/
│   ├── app/
│   │   ├── actions/            Server Actions: auth, reviews, saves, dinners, businesses
│   │   ├── api/
│   │   │   ├── businesses/     Search endpoint behind TanStack Query
│   │   │   ├── dinners/        Dinner listing endpoint
│   │   │   └── admin/seed/     Service-role seeder for Supabase
│   │   ├── businesses/         Directory, listing page, write-a-review, claim
│   │   ├── dinners/            Table list, table detail, matching questionnaire
│   │   ├── about|how-it-works|pricing|add-business|profile|saved|bookings|login|signup
│   │   ├── layout.tsx          Fonts, metadata, nav/footer shell, providers
│   │   ├── globals.css         Design tokens and component classes
│   │   ├── error.tsx · loading.tsx · not-found.tsx · sitemap.ts · robots.ts
│   ├── components/
│   │   ├── ui/                 Button, Badge, Field, RatingStars, Avatar, Toaster, …
│   │   ├── layout/             Navbar, mobile drawer, account menu, footer, auth shell
│   │   ├── home/               Hero, how-it-works, categories, testimonials, FAQ, CTA
│   │   ├── business/           Card, search, filters, gallery, hours, map, reviews, claim, owner reply
│   │   └── dinners/            Dinner card, booking panel, table reveal, quiz, plans
│   ├── hooks/                  use-debounce, use-media-query, use-client-value
│   ├── lib/
│   │   ├── auth/session.ts     Sign in/up/out, profile, plan — both backends
│   │   ├── data/               seed.ts, store.ts, businesses.ts, reviews.ts, saves.ts, dinners.ts
│   │   ├── supabase/           Browser, server and middleware clients
│   │   ├── constants.ts        Categories, cities, currencies, plans, quiz questions
│   │   ├── utils.ts            Formatting, opening-hours maths, distance, slugs
│   │   ├── validators.ts       Zod schemas shared by forms and actions
│   │   └── env.ts              The single backend-mode decision
│   ├── store/                  Zustand: ui-store, filters-store, quiz-store
│   └── types/                  The domain model
├── supabase/
│   ├── migrations/             0001 schema · 0002 RLS · 0003 triggers and RPCs · 0004 owner tools
│   ├── seed.sql                Category reference data
│   └── README.md               Project setup, in order
├── tests/                      Vitest + React Testing Library
├── middleware.ts               Refreshes the Supabase session cookie
└── playwright.config.ts · vitest.config.ts · tailwind.config.ts · next.config.ts
```

---

## Database

`supabase/migrations/0001_schema.sql` creates nine tables — `profiles`,
`categories`, `businesses`, `reviews`, `review_votes`, `saves`,
`dinner_events`, `dinner_bookings`, `quiz_responses` — plus a
`businesses_with_stats` view that derives rating and review count so they can
never drift from the reviews themselves.

`0002_rls.sql` enables row-level security on every table: public data stays
readable by anyone, everything personal is owner-scoped. `0003_functions.sql`
adds the new-user profile trigger, the helpful-vote RPC and guarded seat
counters.

`0004_owner_tools.sql` adds the owner's reply columns and the `business_claims`
audit table. Replies are written through a `security definer` function rather
than a column grant: a grant is role-wide, so it would have let a reviewer forge
an "owner response" on their own review under the existing edit-own-review
policy. Claiming is a policy that only permits taking over a listing with no
owner, and only by writing your own id to it.

Notable constraints: one review per person per business, one live booking per
person per table (a partial unique index that still allows re-booking after a
cancellation), and seat counters that cannot oversell or go negative.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint (flat config, `next/core-web-vitals` + TypeScript) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit and component tests |
| `npm run test:e2e` | Playwright, desktop and mobile projects |

Tests cover the opening-hours maths (including windows that cross midnight),
query-string round-tripping (coordinates included), every repository behaviour
(filtering, sorting, pagination, distance search, review upserts, helpful votes,
save toggles, listing claims, owner replies, seat booking, waitlisting and
cancellation), the interactive UI primitives, and the main end-to-end journeys —
including claim-then-reply and a geolocated near-me search.

If Chromium already exists on the machine, point Playwright at it:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/path/to/chrome npm run test:e2e
```

---

## Design

A warm, editorial dark-and-cream system: deep forest `ink` (`#0B1F17`) against
paper `cream` (`#F8F4EA`), a single hot `flame` accent (`#FF5C39`), `sage` and
`gold` supporting it. Display type is Bricolage Grotesque, body is Plus Jakarta
Sans. Cards are generously rounded, buttons are pills, and every section is
built mobile-first.

Cover art and avatars are generated SVGs in `public/img/`, so the app has no
external image dependency and never shows a broken tile. `ImageWithFallback`
degrades any remote image to a deterministic brand gradient if it fails to load.

---

## Deployment

Deploy to any Node host. On Vercel: import the repository, add the four
environment variables, and ship — no other configuration is required.
