import Link from 'next/link';
import { CITIES } from '@/lib/constants';
import { pluralize } from '@/lib/utils';

export function CityStrip({ counts }: { counts: Record<string, number> }) {
  return (
    <section className="container-page py-16" aria-labelledby="cities-heading">
      <p className="eyebrow">Six cities</p>
      <h2 id="cities-heading" className="display-lg mt-2 text-content">
        Wherever you already live.
      </h2>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CITIES.map((city) => (
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
      </div>
    </section>
  );
}
