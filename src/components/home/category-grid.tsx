import Link from 'next/link';
import * as Icons from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';

export function CategoryGrid() {
  return (
    <section className="container-page py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Browse the directory</p>
          <h2 className="display-lg mt-3">Everything your neighbourhood does well.</h2>
        </div>
        <Link href="/businesses" className="link-underline text-sm font-semibold">
          See all categories
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((category) => {
          const Icon = (Icons[category.icon as keyof typeof Icons] ?? Icons.Store) as React.ElementType;
          return (
            <Link
              key={category.slug}
              href={`/businesses?category=${category.slug}`}
              className="group flex flex-col justify-between rounded-3xl border border-pearl/10 bg-noir-700 p-5 transition-all hover:-translate-y-1 hover:border-pearl/45 hover:bg-noir hover:text-pearl"
            >
              <Icon size={24} className="text-rouge" />
              <div className="mt-8">
                <h3 className="font-display text-lg font-semibold">{category.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-pearl/60 group-hover:text-pearl/60">{category.blurb}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
