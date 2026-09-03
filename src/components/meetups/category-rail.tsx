import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { CategoryIcon } from '@/components/ui/category-icon';
import { cn } from '@/lib/utils';

/**
 * The eight things people meet up to do, as a scrollable rail of shortcuts
 * directly under the search. It is the fastest route into the product and it
 * doubles as the answer to "what is this site for" — which a hero paragraph
 * never manages as quickly as eight labelled icons.
 */
export function CategoryRail({ active, className }: { active?: string; className?: string }) {
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
