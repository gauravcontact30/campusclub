# Site Reskin (Timeleft / Yelp / Swiggy) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flatten the homepage category browser to a Yelp-style icon-tile grid, add a Timeleft-style accent to the hero, and rebuild `MeetupCard` as a photo-led Yelp-style card — the three surfaces the design spec identified as actually needing change, once the board/filter-rail/auth/testimonial surfaces were confirmed already aligned.

**Architecture:** No new components beyond what the spec calls for; every change reuses existing systems (`MeetupCover`/`covers.ts` for photos, `tintVars`/`CATEGORY_GROUPS` for category colour, the existing `.pass` card shell). One small, additive slice to the query/data layer (a `group` filter) is required to make the flattened category tiles link somewhere honest, since the board's existing `category` filter only ever accepted one leaf slug.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind, Vitest + Testing Library, the existing dual-adapter (Supabase / demo store) data layer.

**Spec:** `docs/superpowers/specs/2026-09-08-site-reskin-design.md`

## Global Constraints

- No schema, migration, or repository-shape changes beyond the one additive `group` query field described in Task 1 — confirmed with the user as the one approved expansion beyond the design spec's original "no query/data layer changes" line.
- `MeetupCard`'s public props (`meetup`, `saved`, `showSave`, `className`) do not change — its five call sites (`upcoming.tsx`, `cities/[slug]/page.tsx`, `my-meetups/page.tsx`, `saved/page.tsx`, `meetups/[slug]/page.tsx`) all pass a subset of these today and must keep working unedited.
- No new colour tokens or palettes; every colour comes from existing tokens (`--brand`, `--signal`, `tintVars`, `CATEGORY_TONES` via `covers.ts`) so all nine palettes and both themes stay correct with zero palette-specific code.
- Every user-facing copy change ships in both `en` and `hi` dictionaries in the same task.
- `FilterSidebar`, `CategoryRail`, `MeetupRow`, `/meetups`'s layout, the auth pages, and `proof.tsx` are explicitly out of scope — confirmed already aligned with the target design. Do not modify them.
- TDD throughout: write the failing test, confirm it fails, implement, confirm it passes, commit.
- Test commands in this plan use `npx vitest run <path>`; the full suite is `npm test`. Also run `npm run lint` and `npm run typecheck` before the final commit of each task.

---

### Task 1: Add group-based filtering to the meetup query and data layer

The homepage category browser (Task 2) is flattening from 24 individually-linkable leaf categories to 5 tiles, one per `CATEGORY_GROUPS` entry. A group is 4-6 leaf categories (e.g. "Study & work" = `group-study`, `exam-prep`, `book-club`, `networking`), but `MeetupQuery.category` only ever holds one slug. This task adds a parallel `group` filter so a tile can link somewhere that returns the group's full, honest result set — without touching `FilterSidebar` or `CategoryRail`, which stay single-category as today.

**Files:**
- Modify: `src/types/index.ts` — add `group?: string` to `MeetupQuery`
- Modify: `src/lib/constants.ts` — add `categoryGroupById(id: string)`
- Modify: `src/lib/query-string.ts` — parse, serialize, and count the new filter
- Modify: `src/lib/data/meetups.ts` — filter by group in both the Supabase and demo-mode branches, category taking precedence when both are present
- Test: `tests/query-string.test.ts`
- Test: `tests/repository.test.ts`

**Interfaces:**
- Produces: `MeetupQuery.group?: string` (a `CategoryGroup.id`, validated against `CATEGORY_GROUPS.map(g => g.id)`, empty string when absent or invalid — same convention as `category`). `categoryGroupById(id: string): CategoryGroup | undefined`, exported from `@/lib/constants`, resolving one entry of `CATEGORY_GROUPS`.
- Consumes: existing `CATEGORY_GROUPS: CategoryGroup[]` and `categoriesInGroup(group: CategoryGroup): Category[]` from `@/lib/constants`.

- [ ] **Step 1: Write the failing query-string tests**

Add to `tests/query-string.test.ts`, inside the existing `describe('parseMeetupQuery', ...)` block (after the "takes the first value when a param is repeated" test):

```ts
  it('parses a group filter for the flattened category tiles', () => {
    const query = parseMeetupQuery({ group: 'study' });
    expect(query.group).toBe('study');
  });

  it('drops a group id that is not in the catalogue', () => {
    expect(parseMeetupQuery({ group: 'not-a-group' }).group).toBe('');
  });
```

Add to the existing `describe('toSearchParams', ...)` block:

```ts
  it('round-trips a group filter', () => {
    const original = parseMeetupQuery({ group: 'fitness' });
    const round = parseMeetupQuery(Object.fromEntries(toSearchParams(original)));
    expect(round).toEqual(original);
  });
```

Add to the existing `describe('activeFilterCount', ...)` block:

```ts
  it('counts a group filter too', () => {
    expect(activeFilterCount(parseMeetupQuery({ group: 'study' }))).toBe(1);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/query-string.test.ts`
Expected: FAIL — `query.group` is `undefined`, not `'study'` (the field does not exist yet), and the round-trip/count tests fail the same way.

- [ ] **Step 3: Add `group` to `MeetupQuery`**

In `src/types/index.ts`, in the `MeetupQuery` interface (around line 374), add the field directly under `category`:

```ts
export interface MeetupQuery {
  term?: string;
  city?: string;
  category?: string;
  /** A `CategoryGroup.id` — filters to every category in that group. Ignored when `category` is also set. */
  group?: string;
  level?: Level;
  when?: WhenFilter;
  /** Upper bound on the join fee, in paise. */
  maxFeeCents?: number;
  /** Only meetups that still have an open spot. */
  hasSpots?: boolean;
  sort?: MeetupSort;
  page?: number;
  perPage?: number;
  /** The visitor's coordinates, when they have shared them. */
  near?: { lat: number; lng: number };
}
```

- [ ] **Step 4: Add `categoryGroupById` to constants.ts**

In `src/lib/constants.ts`, directly after the existing `categoriesInGroup` function (around line 346):

```ts
/** One shelf by its id — what a `group` query filter resolves against. */
export function categoryGroupById(id: string): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find((g) => g.id === id);
}
```

- [ ] **Step 5: Implement group parsing, serializing, and counting**

In `src/lib/query-string.ts`, add the import and wire the new field through all three functions:

```ts
import type { Level, MeetupQuery, MeetupSort, WhenFilter } from '@/types';
import { CATEGORY_GROUPS, CATEGORY_SLUGS, LEVELS, SORT_OPTIONS, WHEN_OPTIONS } from '@/lib/constants';

const LEVEL_VALUES = LEVELS.map((l) => l.value);
const WHEN_VALUES = WHEN_OPTIONS.map((w) => w.value);
const SORT_VALUES = SORT_OPTIONS.map((s) => s.value);
const GROUP_IDS = CATEGORY_GROUPS.map((g) => g.id);
```

Replace the body of `parseMeetupQuery` with (only the `category`/`group` lines are new — `level`, `when`, `sort` and everything below are copied forward unchanged from today's version):

```ts
export function parseMeetupQuery(params: Record<string, string | string[] | undefined>): MeetupQuery {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const level = get('level');
  const when = get('when');
  const sort = get('sort');
  const category = get('category');
  const group = get('group');

  return {
    term: get('term') ?? '',
    city: get('city') ?? '',
    // Anything not in the catalogue is dropped rather than passed to the query,
    // so a hand-edited URL cannot produce a confusing empty result page.
    category: category && CATEGORY_SLUGS.includes(category) ? category : '',
    group: group && GROUP_IDS.includes(group) ? group : '',
    level: level && LEVEL_VALUES.includes(level as Level) ? (level as Level) : 'any',
    when: when && WHEN_VALUES.includes(when as WhenFilter) ? (when as WhenFilter) : 'any',
    maxFeeCents: Number(get('maxFee')) || undefined,
    hasSpots: get('hasSpots') === 'true',
    sort: sort && SORT_VALUES.includes(sort as MeetupSort) ? (sort as MeetupSort) : 'soonest',
    page: Number(get('page')) || 1,
    near: coordsFrom(get('lat'), get('lng')),
  };
}
```

In `toSearchParams`, add directly after the `category` line:

```ts
  if (query.category) params.set('category', query.category);
  if (query.group) params.set('group', query.group);
```

In `activeFilterCount`, add `query.group` to the array:

```ts
export function activeFilterCount(query: MeetupQuery) {
  return [
    query.city,
    query.category,
    query.group,
    query.level && query.level !== 'any' ? query.level : '',
    query.when && query.when !== 'any' ? query.when : '',
    query.maxFeeCents,
    query.hasSpots ? 'spots' : '',
  ].filter(Boolean).length;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/query-string.test.ts`
Expected: PASS

- [ ] **Step 7: Write the failing repository test**

In `tests/repository.test.ts`, add `CATEGORY_GROUPS, categoriesInGroup` to the constants import (there is no existing constants import in this file — add a new import line near the top, after the `@/lib/directory/query` import):

```ts
import { CATEGORY_GROUPS, categoriesInGroup } from '@/lib/constants';
```

Add inside the existing `describe('searchMeetups', ...)` block, after the "filters by city, category and fee ceiling together" test:

```ts
  it('filters by a whole category group when no specific category is set', async () => {
    const { items } = await searchMeetups({ group: 'study', perPage: 100 });
    expect(items.length).toBeGreaterThan(0);
    const studySlugs = categoriesInGroup(CATEGORY_GROUPS.find((g) => g.id === 'study')!).map((c) => c.slug);
    for (const item of items) {
      expect(studySlugs).toContain(item.categorySlug);
    }
  });

  it('lets a specific category narrow further than its group', async () => {
    const { items } = await searchMeetups({ group: 'study', category: 'group-study', perPage: 100 });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.categorySlug).toBe('group-study');
    }
  });
```

- [ ] **Step 8: Run the test to verify it fails**

Run: `npx vitest run tests/repository.test.ts -t "category group"`
Expected: FAIL — `group` is not filtered on yet, so the first assertion (`studySlugs` containing every result's category) fails for any result outside `group-study`.

- [ ] **Step 9: Implement group filtering in the data layer**

In `src/lib/data/meetups.ts`, the file already has one import from `@/lib/constants` (line 4). Extend it rather than adding a second import statement:

```ts
import { categoriesInGroup, categoryGroupById, cityBySlug, CITIES } from '@/lib/constants';
```

Add a helper near the top of the file (module scope, alongside other small helpers):

```ts
/** Category takes precedence — a group is only consulted when no specific category is set. */
function groupSlugs(query: MeetupQuery): string[] | undefined {
  if (query.category || !query.group) return undefined;
  const group = categoryGroupById(query.group);
  return group ? categoriesInGroup(group).map((c) => c.slug) : undefined;
}
```

In the Supabase branch, directly after the existing `if (query.category) q = q.eq('category_slug', query.category);` line:

```ts
    if (query.category) q = q.eq('category_slug', query.category);
    const slugs = groupSlugs(query);
    if (slugs) q = q.in('category_slug', slugs);
```

In the demo-mode branch, directly after the existing `.filter((m) => (query.category ? m.categorySlug === query.category : true))` line:

```ts
      .filter((m) => (query.category ? m.categorySlug === query.category : true))
      .filter((m) => {
        const slugs = groupSlugs(query);
        return slugs ? slugs.includes(m.categorySlug) : true;
      })
```

- [ ] **Step 10: Run the tests to verify they pass**

Run: `npx vitest run tests/repository.test.ts -t "category group"`
Expected: PASS

Run the full pair once more to be sure nothing else broke:

Run: `npx vitest run tests/query-string.test.ts tests/repository.test.ts`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add src/types/index.ts src/lib/constants.ts src/lib/query-string.ts src/lib/data/meetups.ts tests/query-string.test.ts tests/repository.test.ts
git commit -m "$(cat <<'EOF'
Add a group filter so a flattened category tile can link to its whole shelf

The homepage category browser is about to collapse from 24 individually
linkable leaf categories into 5 group tiles, but the board's category
filter only ever accepted one leaf slug. Adds a parallel, additive group
filter (a CategoryGroup id) rather than overloading category into a
multi-value string, so FilterSidebar and CategoryRail stay untouched and
single-category as today.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Flatten the homepage category browser to a Yelp-style icon-tile grid

**Files:**
- Modify: `src/components/meetups/category-index.tsx` — replace `ShelfCards`/`ShelfCard`/`PagerButton` with a flat `CategoryTiles`/`CategoryTile` pair; the `index` variant is untouched
- Test: `tests/components.test.tsx`

**Interfaces:**
- Consumes: `MeetupQuery.group` and `categoryGroupById`/`categoriesInGroup`/`CATEGORY_GROUPS` from Task 1 (already landed). `tintVars(tint: Tint)` from `@/lib/tints` (existing, unchanged). `CategoryIcon` from `@/components/ui/category-icon` (existing, unchanged).
- Produces: `CategoryIndex`'s public API is unchanged — `{ counts?, className?, variant? }` — so `Hero` (Task 3) needs no prop changes to keep rendering the `cards` variant.

- [ ] **Step 1: Write the failing test**

Add a new `describe` block to `tests/components.test.tsx`, after the existing `describe('CategoryIcon', ...)` block:

```ts
describe('CategoryIndex', () => {
  it('renders one tile per main category group, linking to the group filter', () => {
    render(<CategoryIndex variant="cards" />);
    const link = screen.getByRole('link', { name: /Study & work/ });
    expect(link).toHaveAttribute('href', '/meetups?group=study');
  });

  it('sums counts across every category in a group', () => {
    render(<CategoryIndex variant="cards" counts={{ 'group-study': 3, 'exam-prep': 2 }} />);
    expect(screen.getByText('5 on now')).toBeInTheDocument();
  });

  it('omits the count rather than showing a zero when nothing in the group is on', () => {
    render(<CategoryIndex variant="cards" counts={{}} />);
    expect(screen.queryByText(/on now/)).not.toBeInTheDocument();
  });
});
```

Add `CategoryIndex` to the existing import block at the top of the file:

```ts
import { CategoryIndex } from '@/components/meetups/category-index';
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components.test.tsx -t "CategoryIndex"`
Expected: FAIL — today's `cards` variant renders `ShelfCards`, whose card is a `<section>` with sub-category links, not a single group-level link, so `getByRole('link', { name: /Study & work/ })` finds no match.

- [ ] **Step 3: Replace `ShelfCards` with the flat tile grid**

Replace the entire contents of `src/components/meetups/category-index.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import { CATEGORY_GROUPS, categoriesInGroup, type CategoryGroup } from '@/lib/constants';
import { CategoryIcon } from '@/components/ui/category-icon';
import { tintVars } from '@/lib/tints';
import { cn } from '@/lib/utils';

/**
 * The whole catalogue, laid out as an index rather than an arcade.
 *
 * The `index` variant is unchanged from its original design: hairline-ruled
 * shelves, one colour per shelf, sub-categories as a wrapping chip row. It is
 * still the version used wherever the board's full 24-category catalogue
 * needs to be browsed in place.
 *
 * The `cards` variant — landing-page only — used to open each of the five
 * main categories into its own card holding every sub-category and hobby
 * filed under it. It has flattened to a plain grid of five tiles, one per
 * main category, each just a name, an icon and a live count. The nesting
 * that made a card worth its height is gone; a tile here says "this exists
 * and this much of it is happening now," and every specific sub-category is
 * one click away via `/meetups?group=<id>` instead of being listed here.
 *
 * Colour still comes from `tintVars(group.tint)` — the same one hue per main
 * category the `index` variant uses — so the shelf a reader learns on one
 * variant is the shelf they meet on the other.
 */
export function CategoryIndex({
  counts = {},
  className,
  variant = 'index',
}: {
  counts?: Record<string, number>;
  className?: string;
  variant?: 'index' | 'cards';
}) {
  if (variant === 'cards') {
    return <CategoryTiles counts={counts} className={className} />;
  }

  return (
    <nav aria-label="Browse by activity" className={cn('border-t border-content/10', className)}>
      {CATEGORY_GROUPS.map((group) => (
        <div
          key={group.id}
          className="border-b border-content/10 py-4 md:flex md:items-start md:gap-7"
          // Set once per shelf so the pills inside can be styled with static
          // Tailwind classes — see the note on `tintVars`.
          style={tintVars(group.tint)}
        >
          <h3 className="flex items-center gap-2.5 md:w-44 md:shrink-0 md:pt-3">
            <span className="h-3.5 w-[3px] shrink-0 rounded-full bg-[rgb(var(--mark))]" aria-hidden />
            <span className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-content">{group.name}</span>
          </h3>

          <ul className="mt-3 flex flex-wrap gap-2 md:mt-0">
            {categoriesInGroup(group).map((category) => {
              const count = counts[category.slug] ?? 0;
              return (
                <li key={category.slug}>
                  <Link
                    href={`/meetups?category=${category.slug}`}
                    className="group flex items-center gap-2.5 rounded-xl border border-content/12 bg-canvas-700 py-2 pl-2 pr-3.5 text-sm font-medium text-content/85 transition-colors duration-150 hover:border-[rgb(var(--mark)/0.45)] hover:text-content"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--plate))] transition-colors duration-150 group-hover:bg-[rgb(var(--mark))]">
                      <CategoryIcon
                        slug={category.slug}
                        size={15}
                        className="text-[rgb(var(--mark))] transition-colors duration-150 group-hover:text-[rgb(var(--plate))]"
                      />
                    </span>
                    <span className="whitespace-nowrap">{category.name}</span>
                    {count > 0 && (
                      <span className="text-xs font-semibold tabular-nums text-content/45">
                        {count}
                        <span className="sr-only"> meetups on the board</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/**
 * One square tile per main category — a flat, Yelp-style grid.
 *
 * This replaces a nested "shelf" card that opened each main category into its
 * sub-categories and every hobby filed under them. That richness is gone: a
 * tile here says only the group's name and how much is on right now. Every
 * sub-category is still one click away — from `/meetups?group=<id>`, via
 * `FilterSidebar` or `CategoryRail` — this grid just stops being the place
 * that lists them.
 */
function CategoryTiles({ counts, className }: { counts: Record<string, number>; className?: string }) {
  return (
    <nav aria-label="Browse by activity" className={className}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORY_GROUPS.map((group) => (
          <li key={group.id}>
            <CategoryTile group={group} counts={counts} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CategoryTile({ group, counts }: { group: CategoryGroup; counts: Record<string, number> }) {
  const live = categoriesInGroup(group).reduce((sum, c) => sum + (counts[c.slug] ?? 0), 0);

  return (
    <Link
      href={`/meetups?group=${group.id}`}
      style={tintVars(group.tint)}
      className={cn(
        'group/tile flex h-full flex-col items-center gap-2.5 rounded-2xl border border-content/12 bg-canvas-700 px-3 py-5 text-center',
        'transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-[rgb(var(--mark)/0.45)] hover:shadow-lift',
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--plate))] text-[rgb(var(--mark))] transition-transform duration-300 group-hover/tile:-rotate-6">
        <CategoryIcon slug={group.slugs[0]} size={22} strokeWidth={1.5} />
      </span>
      <span className="text-sm font-semibold leading-tight text-content">{group.name}</span>
      {live > 0 && (
        <span className="text-xs font-semibold tabular-nums text-[rgb(var(--mark))]">
          {live} on now
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/components.test.tsx -t "CategoryIndex"`
Expected: PASS

- [ ] **Step 5: Run the full component test file and typecheck**

Run: `npx vitest run tests/components.test.tsx`
Expected: PASS (confirms `CategoryIcon`/`Badge`/`MeetupCard` describe blocks above still pass — this file's imports changed only by addition).

Run: `npm run typecheck`
Expected: PASS — confirms no leftover reference to the removed `ShelfCards`/`ShelfCard`/`PagerButton` anywhere else in the codebase (there should be none; they were not exported).

- [ ] **Step 6: Commit**

```bash
git add src/components/meetups/category-index.tsx tests/components.test.tsx
git commit -m "$(cat <<'EOF'
Flatten the homepage category browser to a Yelp-style icon-tile grid

The nested shelf cards (5 groups opened into sub-categories and hobby
tags) retire in favour of one bordered tile per group, per the site
reskin design's decision to trade that depth for a flatter, more
scannable grid. Every sub-category remains one click away via the new
group filter rather than being listed here.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Add a Timeleft-style accent to the homepage hero

**Files:**
- Modify: `src/components/home/hero.tsx`

**Interfaces:**
- No prop or export changes — `Hero`'s signature (`meetupCount`, `cityCount`, `hosts`, `categoryCounts`) is unchanged.

This is a purely decorative, `aria-hidden` addition with no new state or behaviour, so there is no new test to write — it is verified visually (Step 3) rather than by assertion. The current headline (`t.hero.titleTop` + `t.hero.titleBottom` = "Nobody does it" / "alone.") is already four words across two lines; the design spec's "tighten the headline" intent is judged already met, so this task changes only the visual accent, not the copy.

- [ ] **Step 1: Add the accent shapes**

In `src/components/home/hero.tsx`, change the outer wrapper from:

```tsx
      <div className="container-page py-14 sm:py-20">
```

to:

```tsx
      <div className="container-page relative py-14 sm:py-20">
        {/* Two soft, theme-aware blobs — the Timeleft register this hero is
            evolving toward. Fixed to two breakpoints rather than the whole
            page so they never compete with the centred copy on narrow
            screens, where there is no side margin to place them in. */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-[6%] top-4 hidden h-14 w-20 rotate-[10deg] rounded-[50%_50%_50%_8%] bg-signal/15 sm:block"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-[8%] top-28 hidden h-10 w-10 -rotate-12 rounded-full bg-brand/12 lg:block"
        />
```

(The closing `</div>` for this wrapper does not move — only the opening tag and its two new children change.)

- [ ] **Step 2: Run the existing test suite to confirm nothing broke**

Run: `npx vitest run tests/components.test.tsx tests/repository.test.ts`
Expected: PASS (`Hero` has no dedicated test file today; this confirms the change did not affect anything that imports from the same module graph).

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Manually verify across palettes and themes**

Run the dev server (`npm run dev`), open `/`, and check the two accent shapes on at least the default palette and one alternate palette (switch via the palette picker in the navbar), in both light and dark. Confirm:
- Neither shape overlaps the badge, headline, or search bar at any of the `sm`/`lg` breakpoints being toggled through browser dev tools.
- Both shapes stay visible (not washed out) in dark mode, since `bg-signal/15` and `bg-brand/12` resolve to different literal colours per theme automatically via the existing token system.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/hero.tsx
git commit -m "$(cat <<'EOF'
Add a Timeleft-style accent to the homepage hero

Two soft, rotated blobs in the existing brand/signal tokens, evolving the
centred editorial hero per the site reskin design rather than
restructuring it. No new tokens, no copy change — the current headline
was already judged tight enough on review.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Rebuild `MeetupCard` as a photo-led Yelp-style card

**Files:**
- Modify: `src/components/meetups/meetup-card.tsx`
- Test: `tests/components.test.tsx`

**Interfaces:**
- Consumes: `MeetupCover` from `@/components/ui/meetup-cover` (existing — `categorySlug`, `slug`, `coverImage`, `alt`, `className`, `sizes`, `glyph`), `Avatar` from `@/components/ui/avatar` (existing — `name`, `src`, `size`), `SaveButton` from `./save-button` (existing, already `relative z-10` internally — see its own comment — so it stays correctly clickable above the card's full-bleed title link regardless of where in the DOM it sits).
- Produces: `MeetupCard`'s props are unchanged — `{ meetup: MeetupWithHost, saved?: boolean, showSave?: boolean, className?: string }` — so no call site needs edits (verified in Task 5).

- [ ] **Step 1: Write the failing tests**

Replace the existing `describe('MeetupCard', ...)` block in `tests/components.test.tsx` with the same four tests plus three new ones:

```ts
describe('MeetupCard', () => {
  it('shows the two facts the decision turns on: the fee and the spots left', () => {
    render(<MeetupCard meetup={meetup()} showSave={false} />);

    expect(screen.getByText('₹149')).toBeInTheDocument();
    expect(screen.getByText('2 spots left')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Deep work table' })).toHaveAttribute(
      'href',
      '/meetups/a-test-meetup-bengaluru',
    );
  });

  it('says "Free" rather than ₹0', () => {
    render(<MeetupCard meetup={meetup({ joinFeeCents: 0 })} showSave={false} />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('offers the waitlist instead of a spot count when full', () => {
    render(<MeetupCard meetup={meetup({ spotsTaken: 8 })} showSave={false} />);
    expect(screen.getByText('Full — waitlist open')).toBeInTheDocument();
  });

  it('shows a distance only when the search supplied one', () => {
    const { rerender } = render(<MeetupCard meetup={meetup()} showSave={false} />);
    expect(screen.queryByText(/away/)).not.toBeInTheDocument();

    rerender(<MeetupCard meetup={meetup({ distanceKm: 2.4 })} showSave={false} />);
    expect(screen.getByText(/2\.4 km away/)).toBeInTheDocument();
  });

  it('shows a rating badge only once the meetup has vouches', () => {
    const { rerender } = render(<MeetupCard meetup={meetup({ vouchCount: 0 })} showSave={false} />);
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();

    rerender(<MeetupCard meetup={meetup({ vouchCount: 12, rating: 4.8 })} showSave={false} />);
    expect(screen.getByText('★ 4.8')).toBeInTheDocument();
  });

  it('leads with the host, first name and hosted count', () => {
    render(<MeetupCard meetup={meetup()} showSave={false} />);
    expect(screen.getByText('Kabir · 46 hosted')).toBeInTheDocument();
  });

  it('renders a cover image', () => {
    const { container } = render(<MeetupCard meetup={meetup()} showSave={false} />);
    expect(container.querySelector('[role="img"]')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify the three new ones fail**

Run: `npx vitest run tests/components.test.tsx -t "MeetupCard"`
Expected: The four pre-existing assertions still PASS (the footer facts are not changing meaning, only layout); the three new ones FAIL — there is no `★ 4.8` text, no `Kabir · 46 hosted` text, and no `[role="img"]` element in today's ticket-stub markup.

- [ ] **Step 3: Rebuild the component**

Replace the full contents of `src/components/meetups/meetup-card.tsx` with:

```tsx
import Link from 'next/link';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import type { MeetupWithHost } from '@/types';
import { categoryBySlug } from '@/lib/constants';
import { cn, dayLabel, formatDistance, formatFee, formatTime, spotsState } from '@/lib/utils';
import { MeetupCover } from '@/components/ui/meetup-cover';
import { Avatar } from '@/components/ui/avatar';
import { SaveButton } from './save-button';

/**
 * A meetup rendered as a photo-led card: a cover image carries the card,
 * a rating badge and the save toggle overlay it, and everything else — who's
 * hosting, what it is, when, how full, what it costs — sits in the body
 * below. This replaced a photo-less "ticket stub" anatomy; the facts it
 * showed (day/time, distance, fee, spots) are unchanged, just laid out
 * around a photo instead of a date stub.
 */
export function MeetupCard({
  meetup,
  saved = false,
  showSave = true,
  className,
}: {
  meetup: MeetupWithHost;
  saved?: boolean;
  showSave?: boolean;
  className?: string;
}) {
  const spots = spotsState(meetup.spotsTaken, meetup.spotsTotal);
  const category = categoryBySlug(meetup.categorySlug);

  return (
    <article className={cn('pass group flex flex-col transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lift', className)}>
      <div className="relative">
        <MeetupCover
          categorySlug={meetup.categorySlug}
          slug={meetup.slug}
          coverImage={meetup.coverImage}
          alt=""
          glyph="sm"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-36 w-full"
        />

        {meetup.vouchCount > 0 && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-canvas-700/95 px-2.5 py-1 text-xs font-bold text-content shadow-card">
            ★ {meetup.rating.toFixed(1)}
          </span>
        )}

        {showSave && (
          <span className="absolute right-3 top-3">
            <SaveButton meetupId={meetup.id} initialSaved={saved} title={meetup.title} />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-xs text-content/60">
          <Avatar name={meetup.host.name} src={meetup.host.avatarUrl} size={20} />
          <span className="truncate">
            {meetup.host.name.split(' ')[0]} · {meetup.host.hostedCount} hosted
          </span>
        </div>

        <h3 className="font-display text-lg font-bold leading-snug text-content">
          <Link href={`/meetups/${meetup.slug}`} className="after:absolute after:inset-0">
            {meetup.title}
          </Link>
        </h3>

        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-content/65">
          <span className="font-medium text-content/75">{category?.name ?? 'Meetup'}</span>
          <span aria-hidden>·</span>
          <MapPin size={14} className="shrink-0 text-content/45" aria-hidden />
          <span className="truncate">
            {meetup.venueName}, {meetup.area}
          </span>
          {meetup.distanceKm !== undefined && (
            <span className="text-content/45">· {formatDistance(meetup.distanceKm)} away</span>
          )}
        </p>

        <p className="flex items-center gap-1.5 text-sm font-medium text-content/70">
          <CalendarDays size={14} className="text-brand" aria-hidden />
          {dayLabel(meetup.startsAt)}, {formatTime(meetup.startsAt)}
        </p>

        <div className="mt-auto space-y-2.5 pt-1">
          <div className="meter" role="presentation">
            <div
              className={cn('meter-fill', spots.full && 'bg-content/40', spots.scarce && 'bg-signal')}
              style={{ width: `${Math.round(spots.fraction * 100)}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 font-medium',
                spots.full ? 'text-content/55' : spots.scarce ? 'text-signal-600' : 'text-content/65',
              )}
            >
              <Users size={14} aria-hidden />
              {spots.full ? 'Full — waitlist open' : spots.label}
            </span>
            <span className="font-display text-base font-bold text-content">
              {formatFee(meetup.joinFeeCents)}
              {meetup.joinFeeCents > 0 && (
                <span className="ml-1 text-xs font-medium text-content/50">to join</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
```

Note what this drops from the previous version: the `CategoryIcon` import (the category name now reads as plain text next to the location, matching `MeetupRow`'s convention, since the icon's job is done by the cover's glyph now) and the `--stub` inline style / `pass-notch` span (the ticket-stub anatomy is gone; `.pass` itself — `relative overflow-hidden rounded-2xl border border-content/10 bg-canvas-700 shadow-card` — is generic card chrome, not ticket-specific, so it is kept).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/components.test.tsx -t "MeetupCard"`
Expected: PASS, all seven

- [ ] **Step 5: Run the full test file and typecheck**

Run: `npx vitest run tests/components.test.tsx`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS — confirms the dropped `CategoryIcon` import and `--stub` style leave no dangling reference.

- [ ] **Step 6: Commit**

```bash
git add src/components/meetups/meetup-card.tsx tests/components.test.tsx
git commit -m "$(cat <<'EOF'
Rebuild MeetupCard as a photo-led Yelp-style card

Replaces the photo-less ticket-stub anatomy with a cover image (reusing
the existing MeetupCover/covers.ts system already used by MeetupRow and
the detail page), a rating badge overlay, and a host-credibility row.
Props are unchanged, so none of the five call sites need edits.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Verify call sites, cross-reference the directory spec, and full-suite check

No production code is expected to change in this task — it is verification that Tasks 1-4 actually deliver a working, visually correct result everywhere `MeetupCard` and `CategoryIndex` are used, plus one small doc cross-reference update.

**Files:**
- Modify (docs only): `docs/superpowers/specs/2026-09-07-directory-foundation-design.md` — update the component list to point at the now-shared `MeetupCard`/`CategoryTiles` instead of planning separate `place-card`/`category-tiles` components
- No source files expected to change; this task's steps are checks, not edits

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS, no regressions anywhere (this exercises `tests/directory-query.test.ts` and `tests/directory-ranking.test.ts` too, which is what confirms Task 1's `MeetupQuery` change did not disturb the separate `BusinessQuery` type it sits beside in `src/types/index.ts`).

- [ ] **Step 2: Run lint and typecheck**

Run: `npm run lint`
Expected: PASS — in particular, confirms no unused imports were left behind in `category-index.tsx` or `meetup-card.tsx`.

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Manually verify all five `MeetupCard` call sites render correctly in demo mode**

Run the dev server (`npm run dev`) with Supabase unconfigured (demo mode — the project's default local state per the Supabase project-state notes) and visually check, in the default palette and light theme first:

- `/` — the "Upcoming" grid (`upcoming.tsx`)
- `/cities/<any-city-slug>` — the "Starting soonest" grid
- `/saved` (requires a signed-in demo session with at least one saved meetup)
- `/my-meetups` — the "Go again" (past meetups) grid
- `/meetups/<any-slug>` — the "More <category> in <city>" related grid at the bottom

Confirm for each: the cover image (or generated gradient-and-glyph cover, for a meetup with no photo) fills the top of the card without distortion, the save button (where shown) sits cleanly in the top-right corner and remains clickable, the rating badge appears only on meetups with at least one vouch, and the card grid's existing `grid gap-5 sm:grid-cols-2 lg:grid-cols-3` wrapper (unchanged in every one of these five files) lays the new taller-by-a-photo cards out without overlap.

- [ ] **Step 4: Manually verify the homepage category tiles and hero accent**

On `/`, confirm the 5 category tiles render in the grid, each links to `/meetups?group=<id>` and lands on a correctly filtered board (spot-check at least "Study & work" and "Games & nights out" — the two groups with the most and fewest sub-categories), and the live counts match what `/meetups?category=<leaf-slug>` shows summed across the group's slugs.

- [ ] **Step 5: Repeat the visual check across one alternate palette and dark mode**

Switch to one non-default palette via the navbar picker, toggle dark mode, and re-check the same five `MeetupCard` surfaces plus the homepage tiles and hero accent. Confirm the rating badge (`bg-canvas-700/95` / `text-content`) stays legible, the tile borders and hover states use the palette's own tint tokens correctly, and the hero accent shapes are still visible (not washed out to invisibility) in dark mode.

- [ ] **Step 6: Update the directory spec's component cross-reference**

In `docs/superpowers/specs/2026-09-07-directory-foundation-design.md`, in the "Components" section (the paragraph beginning "New, in `src/components/places/`: `place-card.tsx` (warm, photo-led)..."), replace that sentence with:

```markdown
New, in `src/components/places/`: `place-row.tsx` (dense result row), `place-filters.tsx`
(sticky rail), `hours-table.tsx`, `price-band.tsx`, `rating-stars.tsx`. The directory reuses
`src/components/meetups/meetup-card.tsx` for photo-led business cards and
`src/components/meetups/category-index.tsx`'s flattened tile grid for category browsing,
rather than building `place-card.tsx`/`category-tiles.tsx` as separate components — both
were rebuilt for the site reskin
([[docs/superpowers/specs/2026-09-08-site-reskin-design.md]]) before this milestone started
implementation.
```

- [ ] **Step 7: Commit the doc update**

```bash
git add docs/superpowers/specs/2026-09-07-directory-foundation-design.md
git commit -m "$(cat <<'EOF'
Point the directory spec's component list at the shared card and tile grid

MeetupCard and CategoryIndex's flattened tiles now cover what
place-card.tsx and category-tiles.tsx were planned to build separately
in the not-yet-started Milestone 2. Updates the cross-reference so that
milestone does not duplicate them.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
