# Site reskin — Timeleft / Yelp / Swiggy — design

**Date:** 2026-09-08
**Status:** Approved, ready for implementation planning

## Context

CampusClub's visual language was already built around two reference products —
`globals.css` states this directly: the base palette pairs "a warm editorial one and a
dense utilitarian one," i.e. Timeleft and Yelp, and that split already drives the
Milestone 2 directory-UI spec
([[docs/superpowers/specs/2026-09-07-directory-foundation-design.md]]): Timeleft warmth on
marketing surfaces, Yelp density on utility surfaces, one token set, two density scales.

The user asked to extend that reskin across the whole existing site (not just the
not-yet-built `/places` directory), and to bring in a third reference — Swiggy — for its
bold, card-forward, category-icon-grid language. Confirmed via screenshots of
timeleft.com and yelp.com plus general knowledge of swiggy.com, and a round of visual
mockups (`.superpowers/brainstorm/`, not committed) comparing concrete directions for the
three highest-leverage surfaces.

**Why now:** the directory spec already anticipated this — its "how to apply" note said to
re-open brainstorming for the design section before starting Milestone 2's UI work, since
Swiggy might shift the design mix. This spec is that re-opened design pass, expanded to
cover the existing site as well, since the same card and category-grid language should not
be built twice.

## Decisions taken (via visual brainstorming)

1. **Meetup cards go photo-led, Yelp-style.** Photo banner, star-rating badge overlaid
   top-left, host-credibility row, then facts. Chosen over (a) evolving the current
   ticket-stub anatomy with badges only, and (b) a bolder Swiggy card with overlapping
   badges and a baked-in CTA pill.
2. **The homepage hero evolves rather than restructures.** Same centered badge → headline →
   search → host-stack layout, plus one Timeleft-style illustrated accent shape and a
   tighter headline. Rejected: a Yelp-style full-photo banner with a dual search bar, and a
   Swiggy-style location-picker-first layout with an immediate category strip.
3. **The homepage category browser flattens to a Yelp-style icon-tile grid.** The current
   nested "shelf" cards (5 main categories, each opened into sub-categories and hobby tags)
   retire in favour of one bordered square tile per main category with a live count —
   chosen explicitly over keeping the richer nested version, and over a Swiggy-style
   scrollable ring of colourful circular icons.
4. **Out of scope: auth pages and testimonials.** `auth-shell.tsx` (login/signup/host
   destination messaging) and `proof.tsx` (testimonials) were deliberately redesigned in the
   two days before this spec — the `before-/after-login/signup/host/passes` screenshots in
   the repo root are that work — and already sit in the target warm register. Retouching
   them now would undo recent, considered work rather than extend it.

## What "whole site" actually means once mapped to real usage

Investigating current usage before scoping components turned up that two surfaces
initially assumed to need rework are already aligned with the target design:

- **The meetup board (`/meetups`) already renders `MeetupRow`**, not `MeetupCard` — a dense,
  photo-led row (`MeetupCover`, `RatingBlocks`, host line, spots meter, price column) that
  already matches the Yelp direction. It needs no rework.
- **The board already has a persistent filter rail** (`FilterSidebar`, sticky on desktop,
  collapsible below `lg`) and a horizontal category pill strip (`CategoryRail`, one line,
  icon beside label, all 24 categories). Both are already the Yelp pattern this reskin is
  reaching for. No new filter UI is being built.

So the actual surfaces touched are narrower than "the whole site" reads, and are exactly
the ones where the current design is the ticket-stub card or the nested shelf grid:

| Surface | Current | Change |
|---|---|---|
| `MeetupCard` (grid contexts: homepage Upcoming, `/cities/[slug]`, `/my-meetups`, `/saved`, meetup detail's related list) | Ticket-stub, no photo | Rebuilt photo-led, per decision 1 |
| `Hero` (`/`) | Centered editorial hero | Evolves per decision 2 |
| `CategoryIndex` `cards` variant (homepage only; the `index` variant elsewhere is untouched) | Nested shelf cards | Flattens per decision 3 |
| `/meetups` board, `FilterSidebar`, `CategoryRail`, `MeetupRow` | Already dense/photo-led | **No change** |
| Auth pages, `proof.tsx` | Already warm/Timeleft-aligned | **No change** (decision 4) |
| `/places` (Milestone 2, unbuilt) | N/A | Inherits the rebuilt `MeetupCard` pattern and the flattened icon-tile grid rather than building `place-card`/`category-tiles` as separate components |

## Component design

### `MeetupCard` (`src/components/meetups/meetup-card.tsx`)

Rebuilt around the existing cover system rather than adding a new one:

- **Photo banner**, using `MeetupCover` (already built for `MeetupRow` and the detail page —
  `photo`-kind covers win when a meetup has one, `generated` theme-token covers are the
  default otherwise, so every card has a cover on day one with no new data required).
- **Rating badge**, top-left overlay, using the existing `RatingBlocks` value and
  `vouchCount` — rendered only when `vouchCount > 0`, matching `MeetupRow`'s existing rule,
  so a brand-new meetup does not show a fabricated "0.0".
- **Host-credibility row** beneath the photo: avatar, first name, `hostedCount` — reusing
  `Avatar`, the same line `MeetupCard` already builds today.
- **Facts footer**, unchanged in substance from the current card: day/time, distance, the
  spots meter, the price. The ticket-stub's left-hand date stub is dropped; day/time move
  inline with the other facts, matching how `MeetupRow` already places them.

`className`, `saved`, and `showSave` props are unchanged, so every current call site keeps
working without edits beyond what the new visual needs.

### `Hero` (`src/components/home/hero.tsx`)

- One illustrated accent shape (a soft rotated blob, Timeleft's register) positioned near
  the existing badge — CSS/SVG, no new image asset, themed off `--brand`/`--signal` tokens
  so it works across all nine palettes and both themes without per-palette art.
- Headline copy tightens (dictionary string change, `en` and `hi` both).
- `SearchBar`, the host-face stack, and the categories section below are unchanged in
  structure; the categories section renders the new flattened grid (see below) instead of
  `ShelfCards`.

### `CategoryIndex` `cards` variant (`src/components/meetups/category-index.tsx`)

- `ShelfCards` is replaced by a flat grid: one square, bordered tile per `CATEGORY_GROUPS`
  entry, each showing its icon (`group.slugs[0]`), name, and a live count summed across the
  group's categories (the same sum `ShelfCards` computes today) — dropping the
  sub-category and hobby-tag lines per decision 3.
- The `index` variant (used elsewhere as the ruled shelf list) is untouched — only the
  homepage's `cards` variant changes, so this is a targeted replacement of `ShelfCards`,
  not a rewrite of the component's public API (`variant` prop, `counts` prop unchanged).
- Per-category colour continues to come from `tintVars(group.tint)` — no new colour
  mapping introduced.

### Shared badge/pill utility

A small addition to `globals.css` (or a `Badge`-adjacent component if `src/components/ui/badge.tsx`
already covers this shape — checked at implementation time before adding a duplicate):
a compact overlay-badge style (white pill, subtle shadow, small bold text) for the
`MeetupCard` rating badge. No new colour tokens; reuses existing shadow/radius tokens.

## Data implications

`MeetupCard`'s photo requirement is already satisfied by the existing `covers.ts` /
`MeetupCover` system — no schema change, no new seed data, no migration. Demo-mode meetups
without a `coverImage` render the existing `generated` gradient-and-glyph cover, so the
grid never shows a broken image or a placeholder box.

## Rollout

Independently landable steps, in order:

1. Flatten `CategoryIndex`'s `cards` variant to the icon-tile grid.
2. Evolve `Hero` (accent shape + headline copy, both locales).
3. Rebuild `MeetupCard` around `MeetupCover` + rating badge + host row.
4. Sweep `MeetupCard`'s five call sites for any layout assumption that depended on the old
   fixed card height (grids in `upcoming.tsx`, `cities/[slug]`, `my-meetups`, `saved`,
   meetup detail's related list) — expected to be a no-op given unchanged props, verified
   rather than assumed.
5. When Milestone 2 (`/places`) implementation starts, its `place-card` and
   `category-tiles` components are the ones built in steps 1 and 3, not new ones —
   `docs/superpowers/specs/2026-09-07-directory-foundation-design.md`'s component list
   updates to point here instead of duplicating.

No change to `/meetups`, `FilterSidebar`, `CategoryRail`, `MeetupRow`, auth pages, or
`proof.tsx` — confirmed already aligned, listed explicitly so a future pass does not
"fix" them again without cause.

## Testing

- `tests/components.test.tsx`: extend for the rebuilt `MeetupCard` (renders cover, renders
  rating badge only when `vouchCount > 0`, renders host row) and the flattened category
  tile grid (count aggregation per group, zero-count categories omit the count rather than
  showing `0`, matching the existing `ShelfCards` rule).
- Visual/responsive coverage rides the existing `e2e/responsive.spec.ts` and
  `e2e/theme.spec.ts` specs (all nine palettes, both themes, the new accent shape and badge
  must hold contrast in each) rather than new dedicated specs.
- No new data-layer tests — this spec touches no repository, schema, or query code.

## Definition of done

- `CategoryIndex` `cards` variant renders the flattened tile grid; `index` variant
  unchanged.
- `Hero` carries the accent shape and updated `en`/`hi` copy.
- `MeetupCard` is photo-led with a conditional rating badge and host row; all five call
  sites render correctly in demo mode and (where reachable) against Supabase data.
- `npm test`, `npm run lint`, `npm run typecheck` green.
- Manually verified across at least two palettes (default + one alternate) and both
  themes, per this project's established verification habit.
