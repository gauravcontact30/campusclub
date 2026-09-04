import type { Category, City } from '@/types';
import { CategoryIcon } from '@/components/ui/category-icon';
import { categoryAccent } from '@/lib/media/covers';
import { pluralize } from '@/lib/utils';

/**
 * The board's heading.
 *
 * Filtered to an activity it becomes that activity's own page rather than the
 * generic board with a different h1 — the category's colour, its glyph and the
 * one line the catalogue already writes about it. Twenty-four category pages
 * that differ only by their title read as one page that failed to load
 * properly; the catalogue has the material to make each one specific, and this
 * is the only place it was going unused.
 */
export function BoardHeader({
  category,
  city,
  total,
}: {
  category?: Category;
  city?: City;
  total: number;
}) {
  const count =
    total > 0
      ? `${pluralize(total, 'meetup')}. Every fee shown is what one person pays for one meetup.`
      : 'Nothing matches those filters yet.';

  if (!category) {
    return (
      <header className="max-w-2xl">
        <h1 className="display-md text-content">{city ? `What’s on in ${city.name}` : 'What’s on'}</h1>
        <p className="mt-2 text-sm text-content/65">{count}</p>
      </header>
    );
  }

  const accent = categoryAccent(category.slug);

  return (
    <header
      className="relative overflow-hidden rounded-3xl border border-content/10 px-5 py-5 sm:px-7 sm:py-6"
      // Two flat alpha suffixes on the category's own hue: enough to tint the
      // band, nowhere near enough to fight the type sitting on it.
      style={{ backgroundImage: `linear-gradient(105deg, ${accent}1F, ${accent}08 60%, transparent)` }}
    >
      {/* The same oversized, cropped glyph the covers use, so the band and the
          cards below it are visibly the same family. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 hidden sm:block"
        style={{ color: `${accent}1A` }}
      >
        <CategoryIcon slug={category.slug} size={168} strokeWidth={1} />
      </span>

      <div className="relative flex items-start gap-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-card"
          style={{ backgroundColor: accent }}
          aria-hidden
        >
          <CategoryIcon slug={category.slug} size={21} />
        </span>

        <div className="min-w-0">
          <h1 className="display-md text-content">
            {category.name}
            {city ? ` in ${city.name}` : ''}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-content/70">{category.blurb}</p>
          <p className="mt-2 text-sm font-medium text-content/60">{count}</p>
        </div>
      </div>
    </header>
  );
}
