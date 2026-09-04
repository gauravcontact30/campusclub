'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES, tintForCategory } from '@/lib/constants';
import { CategoryIcon } from '@/components/ui/category-icon';
import { categoryAccent } from '@/lib/media/covers';
import { cn } from '@/lib/utils';

/**
 * The two places this catalogue appears want opposite things from it. The
 * board's own filter band needs a compact, scannable rail with an active
 * state — one more control among several. The hero is the one place on the
 * whole site selling the *range* of the catalogue, so it gets a wrapping
 * mosaic instead: every activity visible at once, each in its own light
 * "sticker" colour, because 24 identical white chips would read as a list to
 * scroll past rather than a catalogue worth exploring.
 */
export function CategoryRail({
  active,
  variant = 'rail',
  className,
}: {
  active?: string;
  variant?: 'rail' | 'mosaic';
  className?: string;
}) {
  if (variant === 'mosaic') {
    return (
      <nav aria-label="Browse by activity" className={className}>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {CATEGORIES.map((category, i) => {
            const tint = tintForCategory(i);
            return (
              <li key={category.slug}>
                <Link
                  href={`/meetups?category=${category.slug}`}
                  className="group flex h-full flex-col items-center gap-2.5 rounded-2xl px-3 py-4 text-center transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: `rgb(var(--tint-${tint}))` }}
                >
                  <CategoryIcon
                    slug={category.slug}
                    size={22}
                    className="transition-transform duration-200 group-hover:scale-110"
                    style={{ color: `rgb(var(--tint-${tint}-ink))` }}
                  />
                  <span className="text-xs font-semibold leading-tight" style={{ color: `rgb(var(--tint-${tint}-ink))` }}>
                    {category.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return <ScrollingRail active={active} className={className} />;
}

/**
 * A single-line pill rail.
 *
 * Every pill is one line by design. The previous rail stacked an icon over a
 * wrapping label in a fixed-width box, so "Gym" was one line and "Breakfast &
 * lunch" was two — neighbouring tiles came out different heights and the row
 * read as ragged. Laying the icon beside the label makes every pill exactly as
 * tall as the text, whatever the name.
 *
 * The icon carries the category's own colour, the same one its cards are drawn
 * in, so picking a pill and recognising the results it produces are the same
 * act of colour matching.
 */
function ScrollingRail({ active, className }: { active?: string; className?: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    // A pixel of horizontal padding is not a scroll. Without real slack the
    // left arrow lights up on a rail that has not been moved at all.
    const SLACK = 12;
    setEdges({
      left: el.scrollLeft > SLACK,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - SLACK,
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    // 24 categories are far wider than any viewport, so a late one — pet
    // meetups, volunteering — would otherwise be selected but off-screen, and
    // the rail would look like it had lost the filter that is plainly applied.
    const current = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (current) {
      el.scrollTo({
        left: current.offsetLeft - (el.clientWidth - current.offsetWidth) / 2,
        behavior: 'instant' as ScrollBehavior,
      });
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const nudge = (direction: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(240, el.clientWidth * 0.8), behavior: 'smooth' });
  };

  return (
    <div className={cn('relative', className)}>
      <nav aria-label="Browse by activity">
        <div
          ref={scroller}
          onScroll={measure}
          className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-1 py-1"
          // Fades the clipped pill at whichever end still has content, so the
          // cut-off reads as "there is more" instead of a broken layout.
          style={{
            maskImage: maskFor(edges),
            WebkitMaskImage: maskFor(edges),
          }}
        >
          {CATEGORIES.map((category) => {
            const on = active === category.slug;
            return (
              <Link
                key={category.slug}
                href={`/meetups?category=${category.slug}`}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'group flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200',
                  on
                    ? 'border-transparent bg-brand text-on-brand shadow-glow'
                    : 'border-content/12 bg-canvas text-content/75 hover:-translate-y-0.5 hover:border-content/30 hover:text-content',
                )}
              >
                <CategoryIcon
                  slug={category.slug}
                  size={16}
                  className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={on ? undefined : { color: categoryAccent(category.slug) }}
                />
                {category.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Pointer-only: touch surfaces scroll the rail directly, and both ends
          stay reachable by keyboard through the links themselves. */}
      <Arrow side="left" show={edges.left} onClick={() => nudge(-1)} />
      <Arrow side="right" show={edges.right} onClick={() => nudge(1)} />
    </div>
  );
}

/** Transparent at the ends that have more content, opaque everywhere else. */
function maskFor({ left, right }: { left: boolean; right: boolean }) {
  if (!left && !right) return undefined;
  const start = left ? 'transparent, black 3rem' : 'black';
  const end = right ? 'black calc(100% - 3rem), transparent' : 'black';
  return `linear-gradient(to right, ${start}, ${end})`;
}

function Arrow({
  side,
  show,
  onClick,
}: {
  side: 'left' | 'right';
  show: boolean;
  onClick: () => void;
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={onClick}
      className={cn(
        'absolute top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-content/15 bg-canvas text-content/70 shadow-card transition-opacity duration-200 hover:text-content md:flex',
        side === 'left' ? '-left-3' : '-right-3',
        show ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <Icon size={16} />
    </button>
  );
}
