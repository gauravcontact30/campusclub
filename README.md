# CampusClub

**Nobody does it alone.**

A pay-per-join board of local meetups. Someone within a kilometre of you is
revising for the same exam, going to the same gym at the same hour, eating the
same dinner by themselves. CampusClub is the reason to say so out loud: members
list the things they are already doing — a 6am run, a study table, a Sunday
dinner, a badminton court — and other members pay that meetup's **join fee** to
take one of its spots.

The join fee *is* the business model. There is no membership standing between
somebody and their first meetup; passes exist only because the people who go
three times a week asked for them, and they simply pre-buy joins at a lower
price each.

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS ·
Supabase · Razorpay**.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

That is the whole setup. **No keys of any kind are required to run the app** —
with no credentials it boots in *demo mode* against a seeded in-memory dataset
(30 meetups across 6 cities, 12 members, 100+ pieces of feedback) and a
clearly-labelled demo payment gateway, so every screen and every flow —
including joining and paying — is clickable immediately.

Sign in with any seeded account, e.g. `priya@example.com` / `password123`, or
create a new one — both work in demo mode.

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | no | Switches the app to the Supabase backend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | Browser + server client key |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Server-only; used by the seeding endpoint |
| `NEXT_PUBLIC_SITE_URL` | no | Absolute URLs for metadata and auth redirects |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | no | Switches checkout from the demo gateway to Razorpay |
| `RAZORPAY_KEY_SECRET` | no | Server-only; opens orders and verifies signatures |
| `RAZORPAY_WEBHOOK_SECRET` | no | Server-only; verifies webhook deliveries |
| `ANTHROPIC_API_KEY` | no | Server-only; turns the assistant from retrieval into a real conversation |

Every one of these is optional, and each missing one degrades to something
honest rather than something broken — the footer says out loud which database
answered and which gateway is wired.

---

## What it does

### Finding something to go to

- **The board** (`/meetups`) — every upcoming meetup, filterable by activity,
  city, time window (*today · tomorrow · this weekend · next 7 days*), how
  demanding it is, join fee ceiling and whether it still has room. Five sort
  orders, including *nearest to me* once the visitor shares their location.
- **Filters live in the URL**, so a filtered board is a link somebody can send,
  the back button behaves, and the server renders exactly what was asked for.
  A hand-edited URL with a category that does not exist lands on a sensible
  board rather than an empty one.
- **The pass card.** Every meetup renders as a physical-pass shape: the date on
  a stub down the left, a notched divide, and a meter showing how full it is.
  The two facts the decision turns on — the join fee and the spots left — are on
  the card itself, never one click away.
- **Meetup pages** with what actually happens (a real ordered agenda), what to
  bring, the host's record, who is already coming, and the feedback from people
  who went. The **exact street address is withheld until somebody joins** — it
  is often a host's home.

### Joining, and the money

- **One payment, for one meetup.** The join panel says which of three things
  the click will do *before* it happens: spend a pass credit, take a free
  waitlist place, or charge the join fee once, now.
- **Razorpay Checkout** when keys are present; a labelled demo gateway when they
  are not. A join is never written on a client's say-so — the server verifies
  the `order_id|payment_id` HMAC against the key secret first, and the
  **webhook** is a second, idempotent path so somebody who pays and closes the
  tab still gets the spot they paid for.
- **Waitlists are free.** A full meetup still takes your name and charges
  nothing until a spot opens.
- **Refunds have a rule, not a discretion.** Cancel more than six hours out and
  the fee is refunded or the credit returns to the balance; inside that window
  it is not, because the host has already paid for the venue. A host who cancels
  refunds everyone in full, automatically.
- **Passes** (`/passes`) are four tiers of pre-bought joins, each showing what a
  join actually works out at — and the page leads with *you do not need one of
  these*.

### Hosting

- **Free to list, and the host keeps the whole fee.** A three-step form sets the
  activity, the run of play, the venue and time, the spots, who it is open to,
  and the join fee — with the guidance that fees which look like profit get very
  few joins.
- **`/my-meetups`** carries both sides of a member's life on the site: what they
  are going to, what they are hosting (with spots taken and fees collected), and
  what they have been to and not yet reviewed.

### Feedback that means something

- **Only people who went can leave it.** A confirmed join, on a meetup that has
  finished — enforced in the server action, checked again before the form is
  shown, and enforced a third time by a row-level-security policy in Postgres.
- The rating shows its **histogram and its most-ticked highlights**, because an
  average of 4.3 hides whether that was six 4s or five 5s and a 1.

### The rest of the site

A meetup marketplace needs more than a board and a checkout to read as a real
product: `/cities` and `/cities/[slug]` (per-city landing pages with live
counts), `/stories` and `/stories/[slug]` (editorial posts on the model and
the data behind it), `/help` (a categorised FAQ beyond the home page's four),
`/contact`, `/safety`, `/partners` (venues), `/ambassadors` (opening a new
city or campus), `/careers`, `/press`, and the legal set at `/legal/*` (terms,
privacy, refunds, cookies). All of it is wired into the footer, the sitemap,
and — where it makes sense — the header nav.

### Everywhere

- Two themes and five palettes, chosen before first paint, with no flash.
- English and Hindi, switched by cookie, with a Devanagari face loaded on
  purpose rather than left to the operating system.
- An AI assistant grounded in this app's own data, with an honest
  retrieval-only fallback when no key is set.
- Keyboard-reachable everything, visible focus rings, `prefers-reduced-motion`
  respected, and AA contrast verified across all ten theme/palette combinations.

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
- **Filtering** is a URL change, so the server re-renders the board rather than
  the client re-fetching it; `GET /api/meetups` exposes the same repository for
  anything external.
- **Writes** are Server Actions (`src/app/actions/*`), validated with Zod,
  followed by `revalidatePath`.
- **Money** never crosses the client boundary as a decision: the action opens an
  order, the client only carries the gateway handback, and the server verifies a
  signature before a join exists.
- **Client state** (mobile nav, toasts) lives in Zustand.

---

## Folder structure

```
campusclub/
├── e2e/                        Playwright: browse, join, host, passes, theme, language, chat, responsive
├── public/logo.svg
├── src/
│   ├── app/
│   │   ├── actions/            Server Actions: auth, meetups, joins (checkout), vouches, saves
│   │   ├── api/
│   │   │   ├── meetups/        Read-only JSON over the same repository the pages use
│   │   │   ├── chat/           Streaming assistant endpoint
│   │   │   ├── payments/razorpay/webhook/   Signed, idempotent payment confirmation
│   │   │   └── admin/seed/     Service-role seeder for Supabase
│   │   ├── meetups/            The board, a meetup page, and its feedback form
│   │   ├── host/               Put a meetup on the board
│   │   ├── my-meetups/         Going · hosting · been to
│   │   ├── passes/             Join fees and the four pass tiers
│   │   ├── about|how-it-works|profile|profile/interests|saved|login|signup
│   │   ├── layout.tsx          Fonts, metadata, nav/footer shell, providers
│   │   ├── globals.css         Design tokens, the pass shape, the fill meter
│   │   └── error.tsx · loading.tsx · not-found.tsx · sitemap.ts · robots.ts
│   ├── components/
│   │   ├── ui/                 Button, Badge, Field, RatingStars, Avatar, CategoryIcon, Toaster, …
│   │   ├── layout/             Navbar, mobile drawer, account menu, footer, auth + interests forms
│   │   ├── home/               Hero, how-it-works, upcoming rail, proof, cities, FAQ, CTA
│   │   ├── meetups/            Pass card, filter bar, join panel, checkout, host form, feedback
│   │   ├── passes/             The pass grid and its checkout
│   │   └── chat/               The assistant panel
│   ├── hooks/                  use-debounce (+ use-debounced-change), use-media-query, use-palette
│   ├── lib/
│   │   ├── auth/session.ts     Sign in/up/out, profile, pass grants — both backends
│   │   ├── data/               seed · store · meetups · joins · payments · vouches · saves · hosts
│   │   ├── payments/           Razorpay adapter, gateway config, the checkout ticket type
│   │   ├── ai/                 Tools, system prompt, retrieval-only fallback
│   │   ├── i18n/               Locale cookie, dictionaries, server + client providers
│   │   ├── supabase/           Browser, server and middleware clients
│   │   ├── constants.ts        Categories, cities, passes, fee presets, the cancellation window
│   │   ├── utils.ts            Money, time, spots maths, distance, slugs
│   │   ├── validators.ts       Zod schemas shared by forms and actions
│   │   └── env.ts              The single backend-mode decision
│   ├── store/                  Zustand: ui-store
│   ├── types/                  The domain model
│   └── proxy.ts                Refreshes the Supabase session cookie (Next 16 renamed middleware → proxy)
├── supabase/
│   ├── migrations/             0001–0006 history · 0007 the meetup model
│   └── README.md               Project setup, in order
├── tests/                      Vitest + React Testing Library
├── docs/claude-code-setup.md   Agent tooling: Playwright MCP, Figma, design skills
└── playwright.config.ts · vitest.config.ts · tailwind.config.ts · next.config.ts
```

---

## Database

`supabase/migrations/0007_meetups.sql` is a **forward migration**, not a
rebuild: it adds `meetups`, `joins`, `payments`, `vouches` and a new `saves`,
carries existing members' plans across to the new pass tiers, and only then
drops the directory and supper-club tables. An already-deployed database
migrates; a fresh one arrives at the same place.

Three views keep derived data honest. `meetups_with_stats` computes rating and
vouch count from the vouches themselves, so they cannot drift.
`profiles_with_host_stats` is a host's public face — hosted count and the
average of the feedback on their meetups. `vouches_with_author` and
`joins_with_member` resolve the names the UI shows without a second round trip.

Row-level security is on for every table, and two policies carry real weight:

- **Only attendees leave feedback.** The insert policy on `vouches` requires a
  `confirmed` join on a meetup whose `ends_at` is in the past. The same rule
  lives in the server action and in the page, but this is the copy that cannot
  be bypassed.
- **A member sees their own joins; a host sees the joins on their meetups.**
  That single `select` policy is what makes the attendee list work without
  exposing anybody's calendar to anybody else.

Seat accounting is a pair of `security definer` functions rather than a column
grant, because a grant is role-wide and would let a member edit any meetup's
counters. `spend_join_credit` decrements atomically and returns whether it
actually took one, so a failed credit spend falls back to charging rather than
granting a free join. Notable constraints: one live join per person per meetup
(a partial unique index that still allows re-joining after a cancellation), one
vouch per person per meetup, `ends_at > starts_at`, and `spots_taken <=
spots_total` — the one thing this schema must never allow is overselling.

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

**73 unit tests and 66 end-to-end tests.** They cover the spots and refund-window
maths, calendar-day labelling (11pm tonight and 1am tomorrow are different
days), the `when` filter's ranges, query-string round-tripping including
coordinates, every repository behaviour — filtering, sorting by proportion
filled, pagination, distance search, idempotent joins, waitlisting, cancellation
returning both fees and credits, credit spending — the pass card and feedback
summary, and the full journeys: browse and filter, sign up, join and pay through
the demo gateway, cancel, buy a pass, host a meetup, switch theme, palette and
language, and talk to the assistant.

If Chromium already exists on the machine, point Playwright at it:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/path/to/chrome npm run test:e2e
```

---

## Design

**Court**: indigo-violet and amber on a blue-black ground. The product spans a
5am study table and a Sunday dinner, so the palette has to carry both ends of a
day. Indigo is the evening half — plans, focus, a room after dark — and amber is
the morning one, doing the work of a signal colour without the alarm a red would
add to a page full of "2 spots left". The neutrals are biased toward the accent
rather than pure grey, so nothing on the page looks like it was left at a
default.

The design language is **the pass**. Every meetup renders as a physical pass:
the date on a stub down the left in its own colour block, a notched divide drawn
with a gradient and two punched half-circles, and a meter under it filled to the
proportion of spots gone. Nothing on the card is decorative — the stub is the
date, the meter is the availability, the corner is the fee.

| Token | Role | Dark | Light |
| --- | --- | --- | --- |
| `canvas` | The ground. `canvas-700` is the raised card, `canvas-600` the hover/elevated surface, `canvas-900` the band that sets the footer apart. | `#0C0E14` → `#30364A` | `#F7F7FB` → `#E1E3EE` |
| `content` | Type and hairlines. Blue-tinted, so text belongs to the palette rather than sitting on top of it. | `#ECEFF8` → `#969EB6` | `#151821` → `#6E758B` |
| `brand` | Brand and action: primary buttons, links, selected state, focus rings, the pass stub. | `#8A7CFF` | `#5240D8` |
| `on-brand` | Type sitting **on** a brand fill. Not `content`: the dark theme's brand is the lighter of the two and wants dark type, the light theme's is darker and wants light type — the exact opposite of `content` in both cases. | `#0C0E14` | `#FFFFFF` |
| `signal` | Scarcity and confirmation: last spots, refunds, the per-join price. | `#F5B642` | `#955F06` |
| `glint` | Ratings and small flourishes. | `#FFD68F` | `#A66C0C` |

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
| **Court** *(default)* | Indigo and amber. Evening plans and early mornings at once. |
| **Turf** | Pitch green and lime. The sport and outdoors half of the board. |
| **Dusk** | Plum and rose. Dinners, open mics, the things that happen after dark. |
| **Tide** | Teal and sky. The quietest of the five, made for long study days. |
| **Ember** | Terracotta and gold, carried over from the previous identity. |

Each palette ships both themes, so there are ten variable sets in total. Court
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

The `brand` ramp reverses between themes, and this is the part that cannot be
automated. On a dark ground, emphasis means **more light**, so `brand-700` — the
step used for emphatic text — is the palest. On paper, emphasis means **darker
ink**, so the same token becomes the deepest indigo. Reusing one ramp for both
themes produces text that is unreadable in exactly one of them. `on-brand` exists
for the same reason from the other direction: `content` on a brand fill measured
3.13:1 and 3.67:1, below the 4.5:1 AA floor, on every primary button on the site.

All ten theme/palette combinations are checked rather than assumed — content on
canvas, muted content on a card, `on-brand` on a fill, brand on canvas, and the
signal step — and the four that came in under AA were darkened until they passed.

Status never reads by colour alone. A scarce meetup turns its meter amber *and*
says "2 spots left"; a full one greys the meter *and* says "Full — waitlist
open". Every such state is labelled in words, which is what makes the narrow hue
separation acceptable rather than a regression.

Shadows are per-theme for the same reason: a dark ground drops no shadow, so the
dark theme's depth comes from an indigo bloom while the light theme uses a
conventional soft drop — a shadow tuned for one is invisible or muddy in the
other. Display type is **Sora**, geometric and slightly technical, holding up at
the weight the display sizes need; body is **Manrope**, quieter, with the wider
apertures small copy wants.

### The mark

An open ring with one dot resting in the opening. It is a monogram and a
diagram at once: the silhouette is a **C**, and the thing it draws is the
product — a group of people that has left a place, and the one person about to
take it. The dot sits *on* the ring's own path rather than beside it, so it
reads as joining the circle rather than orbiting it.

The geometry is derived rather than eyeballed. The ring is `r=13` on centre
`(20,20)` with a 46° opening centred on 3 o'clock, so the arc runs from 23° to
337° — 314° of sweep, which is why it carries `large-arc-flag 1`. That opening
spans a chord of 10.16 and the dot is 7.2 across, leaving 1.48 of clearance on
each side: close enough to belong to the gap, far enough not to weld shut at
16px. The arc is drawn as an explicit path rather than a dashed circle, because
`stroke-dasharray` phase is not rendered identically everywhere and a logo is
the wrong place to find that out.

Two properties matter more than the drawing. Everything is `currentColor`, so
one file serves the brand lockup and both monochrome uses — a letterhead, a
stamped receipt, a partner's press page and a disabled state all get one colour.
And there is no knockout anywhere: nothing is painted in the page colour, so the
mark does not fall apart the moment it lands on a surface nobody anticipated.

Because it survives 16px in a single colour, `public/logo.svg` is the only icon
file — no simplified favicon variant is needed beside it.

There are **no shipped images at all**. Member avatars render as initials in a
token-coloured circle, so they follow whichever theme the visitor is in; a
shipped PNG would be the one thing on the page that does not. The app therefore
has no external image dependency and can never show a broken tile.

---

## Languages

English and Hindi, switched from the header (and from the mobile drawer). English
is the default.

The locale lives in a **cookie**, not in the URL. Server components read it with
`cookies()` and render the right dictionary, so switching re-renders the whole
tree rather than swapping labels on the client. The trade is deliberate and worth
knowing: every route stays exactly where it is — no `/en` and `/hi` segments, no
rewriting every link — but there are no per-language URLs, which is what would
push you to routed locales if search traffic mattered.

`en.ts` is the source of truth and `Dictionary` is derived from it, so `hi.ts` is
typed against the English shape. **A missing translation is a build error, not a
blank space on the page** — delete one key from the Hindi file and `tsc` names it.

Hindi also loads its own face. Neither Sora nor Manrope carries Devanagari, so Hindi was falling back to whatever the operating system
happened to have — different on every machine and matched to nothing. Noto Sans
Devanagari is appended to both stacks, so Latin glyphs still come from the brand
faces and only Devanagari falls through to it.

Translated so far: navigation, header and drawer, theme and palette controls,
the hero, the board heading, the join panel's vocabulary, the closing call to
action, and the assistant panel. Page bodies beyond those are still English.
Seeded meetup titles, descriptions and feedback stay in English on purpose —
that is member content, not interface copy, and translating it would be
inventing data.

---

## The assistant

A chat panel on every page, opened from the launcher bottom-right. With
`ANTHROPIC_API_KEY` set it is a real Claude conversation (`claude-opus-5`,
streamed) that answers from **this** board rather than from general knowledge:
three tools sit between the model and the data layer the pages already render
from.

| Tool | Answers |
| --- | --- |
| `search_meetups` | Any "what is on" question — by activity, city, time window, level, fee ceiling or availability |
| `get_meetup` | One meetup in full: what happens, what to bring, the host, the fee, recent feedback |
| `get_site_facts` | Joining, passes and credits, refunds, hosting, cities, categories, safety |

The system prompt forbids a factual claim that did not come back through a tool,
so the assistant says "I don't know" rather than inventing a fee or a spot count.
It is also told the thing the product actually believes: the default is paying
per meetup, and if somebody sounds like they are trying one thing, tell them they
do not need a pass. Tool results are labelled as data — meetup descriptions and
feedback are member-written, so the prompt tells the model to ignore anything in
them that reads as an instruction.

Three things worth knowing about the implementation:

- **Tools use plain JSON Schema, not the SDK's zod helper.** That helper needs
  zod 4 and this app is on zod 3 for its form validators; `betaTool` validates
  arguments identically without forcing an upgrade.
- **The route streams and is rate-limited.** Text deltas are forwarded to the
  browser as they arrive. A per-IP window caps requests, because this endpoint
  spends money on every call — it is in-memory, which is honest for one server
  and needs a shared store before there are two.
- **Demo mode.** With no key the panel still answers, from retrieval only, and
  the header says *"Demo mode — answers from the board, not the AI"*. The whole
  app is built to run with zero configuration; a dead panel would break that, and
  a panel pretending to be an AI would be worse than dead. It also refuses to
  bluff: when the words matched nothing it says so rather than listing four
  unrelated meetups under a confident lead.

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

Deploy to any Node host. On Vercel: import the repository and ship — every
environment variable is optional, and the app boots in demo mode without them.

`SITE.url` resolves defensively for exactly this reason. A Vercel project with
`NEXT_PUBLIC_SITE_URL` *defined but blank* hands the app an empty string, which
is not `undefined`, so a `??` fallback never fires and `new URL('')` throws
during the build. It now takes the first candidate that actually parses —
`NEXT_PUBLIC_SITE_URL`, then `VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL`,
adding `https://` to the bare hostnames Vercel supplies — and falls back to
localhost rather than failing the build.

To go live with payments, add the three Razorpay variables and point a webhook
at `https://<your-domain>/api/payments/razorpay/webhook` for the
`payment.captured`, `order.paid` and `payment.failed` events. The demo gateway
disables itself the moment real keys are present — the server-side verification
path refuses a demo signature whenever `RAZORPAY_KEY_SECRET` is set, so it can
never be used to skip a real payment.
