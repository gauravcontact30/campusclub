import Link from 'next/link';
import { CATEGORIES, tintForCategory } from '@/lib/constants';
import { CategoryIcon } from '@/components/ui/category-icon';
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

  return (
    <nav aria-label="Browse by activity" className={cn('no-scrollbar -mx-1 overflow-x-auto px-1', className)}>
      <ul className="flex min-w-max gap-2">
        {CATEGORIES.map((category) => {
          const on = active === category.slug;
          return (
            <li key={category.slug}>
              <Link
                href={`/meetups?category=${category.slug}`}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'flex w-[6.5rem] flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition-colors',
                  on
                    ? 'border-brand bg-brand/10 text-brand-700'
                    : 'border-content/12 bg-canvas-700 text-content/80 hover:border-content/35 hover:text-content',
                )}
              >
                <CategoryIcon slug={category.slug} size={20} className={on ? 'text-brand' : 'text-content/60'} />
                <span className="text-xs font-semibold leading-tight">{category.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
