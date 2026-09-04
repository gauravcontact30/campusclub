import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CITIES } from '@/lib/constants';
import { pluralize } from '@/lib/utils';

/** How many cities the homepage teases before pointing at the full directory. */
const FEATURED_COUNT = 9;

export function CityStrip({ counts }: { counts: Record<string, number> }) {
  const featured = CITIES.slice(0, FEATURED_COUNT);

  return (
    <section className="container-page py-16" aria-labelledby="cities-heading">
      <p className="eyebrow">{CITIES.length} cities across India</p>
      <h2 id="cities-heading" className="display-lg mt-2 text-content">
        Wherever you already live.
      </h2>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((city) => (
          <Link
            key={city.slug}
            href={`/meetups?city=${city.slug}`}
            className="group surface-card flex min-w-0 items-center justify-between gap-4 p-5 transition-colors hover:border-brand/40"
          >
            <span className="min-w-0">
              <span className="block font-display text-lg font-bold text-content">{city.name}</span>
              <span className="block truncate text-sm text-content/60">{city.blurb}</span>
            </span>
            <span className="shrink-0 rounded-full bg-brand/12 px-3 py-1.5 text-xs font-bold text-brand-700">
              {pluralize(counts[city.name] ?? 0, 'meetup')}
            </span>
          </Link>
        ))}

        <Link
          href="/cities"
          className="group flex min-w-0 items-center justify-between gap-4 rounded-3xl border border-dashed border-content/20 p-5 text-content/70 transition-colors hover:border-brand/50 hover:text-brand-700"
        >
          <span className="font-display text-lg font-bold">See all {CITIES.length} cities</span>
          <ArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
