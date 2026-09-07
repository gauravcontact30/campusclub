'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_GROUPS, categoriesInGroup, type CategoryGroup } from '@/lib/constants';
import { CategoryIcon } from '@/components/ui/category-icon';
import { tintVars } from '@/lib/tints';
import { cn } from '@/lib/utils';

/**
 * The whole catalogue, laid out as an index rather than an arcade.
 *
 * This used to be twenty-four filled tiles in a twelve-hue rotation, and it
 * had the two problems a wall of colour always has: nothing was more important
 * than anything else, and the colours meant nothing — the hue on "Gym" was
 * whatever position it happened to hold in the list. The landing page is the
 * one place selling the *range* of what people meet up to do, so it needs to
 * be read, not just looked at.
 *
 * So: hairline-ruled shelves, a name for each, and one colour per shelf. The
 * page keeps its colour-coding — the thing that made the grid scannable — but
 * now the colour carries information (which shelf) instead of decoration. Each
 * row reads as a line in a directory, which is also why the pills are
 * left-aligned with the icon beside the label: a centred icon-over-label stack
 * makes "Gym" and "Breakfast & lunch" different heights and the grid ragged.
 *
 * The `cards` variant is the same five shelves at landing-page size, where
 * there is room to open each one up: a card per main category, holding every
 * sub-category filed under it, and under each of those the hobbies people
 * actually name when they describe it.
 *
 * That nesting is the point. A flat grid of twenty-four activity cards showed
 * the same twenty-four things and left the reader to work out that Gym, Sports,
 * Runs and Cycling are one decision — five cards, each a complete answer to
 * "what kind of thing", is a shape somebody can hold in their head. It also
 * puts the whole catalogue on one screen instead of three pages of it.
 *
 * Colour goes back to meaning something here: one hue per main category, five
 * of them, all distinct, and the same five the index variant uses — so the
 * shelf a reader learns on this page is the shelf they meet everywhere else.
 *
 * Counts are the live board, so they are absent rather than zero when nothing
 * is scheduled — an empty database renders a clean index, not twenty-four
 * zeroes.
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
    return <ShelfCards counts={counts} className={className} />;
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
 * Four to a row, eight — two rows — to a page.
 *
 * There are five main categories, so nothing pages today and the control below
 * does not render. It is here rather than added later because the rule is about
 * the layout, not about the current length of the catalogue: a sixth and
 * seventh shelf would still fit the two rows, and a ninth is where the grid
 * would start scrolling instead of being glanced at. That is the moment the
 * pager is for.
 */
const PER_PAGE = 8;

function ShelfCards({ counts, className }: { counts: Record<string, number>; className?: string }) {
  const gridRef = useRef<HTMLUListElement>(null);
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(CATEGORY_GROUPS.length / PER_PAGE));
  const current = Math.min(page, pageCount);
  const shown = CATEGORY_GROUPS.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  function goTo(next: number) {
    setPage(Math.min(Math.max(next, 1), pageCount));
    gridRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  return (
    <nav aria-label="Browse by activity" className={className}>
      <ul ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((group, i) => {
          /*
           * Five categories into rows of four leaves the last one on a row of
           * its own with three empty columns beside it, which reads as a card
           * that failed to load. So when the last card would be stranded, it
           * takes the whole row and lays its sub-categories out in columns
           * instead of one long list — the same card, breathing sideways.
           *
           * Checked per breakpoint because the grid is two-wide at sm and
           * four-wide at lg, and an odd count strands the last card at one
           * width and not the other.
           */
          const last = i === shown.length - 1;
          const stranded = { sm: shown.length % 2 === 1, lg: shown.length % 4 === 1 };

          return (
            <li
              key={group.id}
              className={cn(
                last && stranded.sm && 'sm:col-span-2',
                last && stranded.lg && 'lg:col-span-4',
              )}
            >
              <ShelfCard
                group={group}
                index={(current - 1) * PER_PAGE + i}
                counts={counts}
                wide={last && (stranded.sm || stranded.lg)}
              />
            </li>
          );
        })}
      </ul>

      {pageCount > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <PagerButton label="Previous categories" onClick={() => goTo(current - 1)} disabled={current <= 1}>
            <ChevronLeft size={16} aria-hidden />
          </PagerButton>

          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
            const active = n === current;
            return (
              <button
                key={n}
                type="button"
                onClick={() => goTo(n)}
                aria-label={`Categories, page ${n}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'h-9 min-w-9 rounded-full px-3 text-sm font-semibold tabular-nums transition-colors',
                  active ? 'bg-content text-canvas' : 'text-content/65 hover:bg-content/8 hover:text-content',
                )}
              >
                {n}
              </button>
            );
          })}

          <PagerButton
            label="More categories"
            onClick={() => goTo(current + 1)}
            disabled={current >= pageCount}
          >
            <ChevronRight size={16} aria-hidden />
          </PagerButton>

          <p className="w-full text-center text-xs text-content/45 sm:w-auto sm:text-left">
            {(current - 1) * PER_PAGE + 1}–{Math.min(current * PER_PAGE, CATEGORY_GROUPS.length)} of{' '}
            {CATEGORY_GROUPS.length} categories
          </p>
        </div>
      )}
    </nav>
  );
}

/**
 * One main category, opened up.
 *
 * Three levels on one card, and each is doing a different job: the heading says
 * what kind of thing this is, each row is a sub-category you can actually click
 * into, and the line under a row is every hobby filed there. That last line is
 * why the card is worth its height — "Sports" tells nobody whether their
 * Tuesday badminton is on this site, and "Badminton · Football · Box cricket ·
 * Volleyball · Table tennis" tells them without a click.
 *
 * Nothing is truncated to a neat "+3 more", because the ones that would be
 * hidden are exactly the long tail somebody is scanning for.
 */
function ShelfCard({
  group,
  index,
  counts,
  wide,
}: {
  group: CategoryGroup;
  index: number;
  counts: Record<string, number>;
  /** Spanning a whole grid row — see the note where this is decided. */
  wide: boolean;
}) {
  const categories = categoriesInGroup(group);
  const live = categories.reduce((sum, c) => sum + (counts[c.slug] ?? 0), 0);
  const hobbies = categories.reduce((sum, c) => sum + c.interests.length, 0);

  return (
    <section
      aria-labelledby={`activity-${group.id}`}
      style={tintVars(group.tint)}
      className="group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-content/10 bg-canvas-700 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[rgb(var(--mark)/0.45)] hover:shadow-lift"
    >
      {/* The category's own colour, poured in from the top-left corner rather
          than filled flat. A flat plate made five cards read as five buttons; a
          wash gives each one a light source and leaves the list below sitting
          on plain canvas, where it is easiest to read. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(120%_100%_at_0%_0%,rgb(var(--plate))_0%,transparent_70%)]"
      />

      {/* The category number, drawn once at the size of an ornament. It is
          decoration and says so — `aria-hidden`, and behind everything. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-3 right-1 select-none font-display text-[4.5rem] font-bold leading-none text-[rgb(var(--mark)/0.13)] transition-transform duration-500 group-hover/card:-translate-y-1"
      >
        {index + 1}
      </span>

      <div className="relative border-b border-content/10 p-5">
        {/* Icon and name on one line. Stacked, the name sat a full row below
            the thing that identified it and every card read as a header still
            looking for its title. */}
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--plate))] text-[rgb(var(--mark))] ring-1 ring-inset ring-[rgb(var(--mark)/0.2)] transition-transform duration-300 group-hover/card:-rotate-6">
            <CategoryIcon slug={group.slugs[0]} size={22} strokeWidth={1.5} />
            {/* The second sub-category's icon, peeking out from behind the
                first: one icon per card undersells what is inside it. */}
            {group.slugs[1] && (
              <span
                aria-hidden
                className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-lg border border-content/10 bg-canvas-700 text-[rgb(var(--mark))] transition-transform duration-300 group-hover/card:rotate-6"
              >
                <CategoryIcon slug={group.slugs[1]} size={12} strokeWidth={1.75} />
              </span>
            )}
          </span>

          <span className="min-w-0">
            <h3
              id={`activity-${group.id}`}
              className="font-sans text-sm font-semibold leading-tight tracking-normal text-content"
            >
              {group.name}
            </h3>
            {/* What is inside the heading, in numbers. The board count is
                dropped rather than shown as a zero — the same rule the rows
                follow, so an empty database reads as an index instead of a
                column of noughts. */}
            <p className="mt-1 text-[0.7rem] font-medium leading-none text-content/50">
              {categories.length} kinds · {hobbies} hobbies
              {live > 0 && <span className="text-[rgb(var(--mark))]"> · {live} on now</span>}
            </p>
          </span>
        </div>
      </div>

      <ul
        className={cn(
          'relative flex-1 p-2',
          wide ? 'grid gap-0.5 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-0.5',
        )}
      >
        {categories.map((category) => {
          const count = counts[category.slug] ?? 0;
          return (
            <li key={category.slug}>
              <Link
                href={`/meetups?category=${category.slug}`}
                className="group block rounded-xl px-3 py-2.5 transition-colors hover:bg-[rgb(var(--plate))] focus-visible:bg-[rgb(var(--plate))] focus-visible:outline-none"
              >
                <span className="flex items-center gap-2.5">
                  <CategoryIcon slug={category.slug} size={16} className="shrink-0 text-[rgb(var(--mark))]" />
                  <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-content/85 transition-colors group-hover:text-[rgb(var(--mark))]">
                    {category.name}
                  </span>
                  {count > 0 ? (
                    <span className="shrink-0 rounded-md bg-[rgb(var(--plate))] px-1.5 py-0.5 text-xs font-semibold tabular-nums text-[rgb(var(--mark))]">
                      {count}
                      <span className="sr-only"> meetups on the board</span>
                    </span>
                  ) : (
                    <ArrowUpRight
                      size={13}
                      aria-hidden
                      className="shrink-0 text-content/30 opacity-40 transition-opacity group-hover:opacity-100"
                    />
                  )}
                </span>

                {/* Indented to clear the icon, so the hobbies read as belonging
                    to the row above them rather than as a row of their own. */}
                <span className="mt-1 block pl-[26px] text-[0.7rem] leading-relaxed text-content/50">
                  {category.interests.join(' · ')}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PagerButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-content/15 text-content transition-colors hover:border-content/45 disabled:opacity-35 disabled:hover:border-content/15"
    >
      {children}
    </button>
  );
}
