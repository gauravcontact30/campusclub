# SitNext

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
sitnext/
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
│   ├── types/                  The domain model
│   └── proxy.ts                Refreshes the Supabase session cookie (Next 16 renamed middleware → proxy)
├── supabase/
│   ├── migrations/             0001 schema · 0002 RLS · 0003 triggers and RPCs · 0004 owner tools
│   ├── seed.sql                Category reference data
│   └── README.md               Project setup, in order
├── tests/                      Vitest + React Testing Library
├── docs/claude-code-setup.md   Agent tooling: Playwright MCP, Figma, design skills
├── .mcp.json                   Project MCP servers (Playwright)
├── .claude/settings.json       Project permissions for Claude Code
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

**Ember**: terracotta and warm gold on a charcoal-brown ground. The product is
two halves that pull in opposite directions — a review directory wants
credibility, a dinner club wants warmth — and terracotta is the hue that serves
both. It is appetite-forward and social without the romantic reading that a rose
or pink palette picks up next to the phrase *meet five strangers*.

| Token | Role | Dark | Light |
| --- | --- | --- | --- |
| `canvas` | The ground. `canvas-700` is the raised card, `canvas-600` the hover/elevated surface, `canvas-900` the band that sets the footer apart. | `#0F0A08` → `#3A261C` | `#FDF9F5` → `#ECDDCF` |
| `content` | Type and hairlines. Warm-tinted, so text belongs to the palette rather than sitting on top of it. | `#FAF3ED` → `#BEA898` | `#281810` → `#8C705E` |
| `brand` | Brand and action: primary buttons, links, selected state, focus rings. | `#EA6C3A` | `#C64E20` |
| `signal` | Affirmative signal: open-now, confirmed bookings, proof-point stats. | `#F5B342` | `#B06F14` |
| `glint` | Ratings and small flourishes. | `#FFD68F` | `#C7801A` |

The tokens are named for their **role**, not their literal colour: with two
themes, `canvas` is near-black in one and near-white in the other, so a name
like `noir` would be a lie half the time.

Every token is named for its role, right down to the accents: with five
selectable palettes, a token called `ember` would be wrong in four of them.

None of the five shares a name with a Tailwind default scale, and that is
checked against `tailwindcss/colors` rather than assumed. `extend` deep-merges,
so a token called `rose` or `amber` would leave `-500` meaning Tailwind's and
`-600` meaning ours — a trap for anyone who later types a step the theme does
not define.

### Five palettes

The header carries two controls: light/dark, which is one click because it is a
frequent action, and a palette menu, which is a menu because it is a rare one.
On small screens the menu is hidden and the drawer carries the same swatches as
a row, so nothing is unreachable by thumb.

| Palette | Character |
| --- | --- |
| **Ember** *(default)* | Terracotta and gold. Appetite and candlelight. |
| **Ink & Saffron** | Marigold on near-neutral ink. Festive rather than cautionary. |
| **Olive & Amber** | Bistro green with warm amber. |
| **Nightshade** | Indigo ground, coral accent. |
| **Sage & Clay** | Muted and editorial; the most restrained. |

Each palette ships both themes, so there are ten variable sets in total. Ember
is the default and lives in the base blocks; the other four override it from
`data-palette` on `<html>`, resolved by the same blocking script that resolves
the theme.

The palette selectors are deliberately over-qualified —
`:root[data-palette='x']:not([data-theme='light'])` rather than plain
`:root[data-palette='x']`. A bare palette selector has *identical* specificity
to `:root[data-theme='light']`, so whichever came later in the file would win,
and a palette's dark values would silently override the base light theme.
Pinning each block to a theme makes it one step more specific and removes the
ordering trap. `a palette keeps its own light values, not the dark ones` in
`e2e/theme.spec.ts` guards it.

### Two themes, one attribute

Every colour is a CSS custom property holding space-separated RGB channels, and
Tailwind reads them as `rgb(var(--token) / <alpha-value>)` — which is what lets
`text-content/60` keep working. Switching themes therefore rewrites one
attribute on `<html>`, not 700-odd class names, and no component carries a
`dark:` variant.

A blocking script in `<head>` sets `data-theme` before first paint, so the page
never renders in the wrong theme and then jumps. Order of authority: an explicit
choice the visitor made, then the OS preference, then dark.

The header toggle picks its icon and its accessible name from `data-theme` in
CSS rather than from React state. There is nothing to hydrate, so the button is
correct on the very first paint and no hydration mismatch is possible.

The `ember` ramp reverses between themes, and this is the part that cannot be
automated. On black, emphasis means **more light**, so `ember-700` — the step
used for emphatic text — is the palest. On paper, emphasis means **darker ink**,
so the same token becomes the deepest terracotta. Reusing one ramp for both
themes produces text that is unreadable in exactly one of them.

One consequence worth knowing: the palette is warm end to end, so status does
not read by colour alone. Open-now and confirmed use `marigold` against `ember`
for pending — a hue shift, but a small one next to the red/green contrast most
interfaces lean on. Every such state is labelled in words for exactly that
reason, which is what makes the narrow separation acceptable rather than a
regression.

Shadows are per-theme for the same reason: black drops no shadow on black, so
the dark theme's depth comes from an ember bloom, while the light theme uses a
conventional soft drop — a shadow tuned for one is invisible or muddy in the
other. Display type is Bricolage
Grotesque, body is Plus Jakarta Sans. Cards are generously rounded, buttons are
pills, and every section is built mobile-first.

### The mark

Six people seated around a round table, seen from above: each is a head with a
shoulder cap curving behind it, facing in. The seats alternate between the two
warm tones and between two silhouettes — a plain head, and a head with hair
gathered above it — so the group reads as mixed rather than as six copies of
one person.

Two decisions carry the drawing. The shoulder cap is struck about the head
rather than about the table, which is what stops it drifting off as a crescent.
And the hair is a separate small disc rather than a wider head: at 32px a wider
head just reads as a bigger head, while a detached mark still reads as a
different hairstyle.

It ships in two files, because six figures smear into a ring at favicon size:
`public/logo.svg` is the full mark, and `public/icon-16.svg` keeps the table
and reduces the group to four heads. `layout.tsx` offers both and lets the
browser pick by size.

Cover art and avatars are generated SVGs in `public/img/`, so the app has no
external image dependency and never shows a broken tile. `ImageWithFallback`
degrades any remote image to a deterministic brand gradient if it fails to load.

---

## Agent tooling

`.mcp.json` registers the **Playwright MCP** server so Claude Code can drive a
real browser against this app, and `.claude/settings.json` pre-approves the
routine build/test commands while denying reads of `.env*`. The **Figma MCP** is
an account-level connector and needs no repo config.

Four further tools — Impeccable (design linting), Claude Mem, Find Skills and
OmniRoute — install into your own machine rather than the repo.
[`docs/claude-code-setup.md`](docs/claude-code-setup.md) has the verified
commands and what each one does before you run it.

---

## Deployment

Deploy to any Node host. On Vercel: import the repository, add the four
environment variables, and ship — no other configuration is required.
