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
