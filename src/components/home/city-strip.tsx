import Link from 'next/link';
import { CITIES } from '@/lib/constants';

export function CityStrip({ counts }: { counts: Record<string, number> }) {
  return (
    <section className="container-page py-20 sm:py-24">
      <div className="max-w-2xl">
        <p className="eyebrow">Where we are</p>
        <h2 className="display-lg mt-3">Six cities. More opening every season.</h2>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CITIES.map((city) => (
          <Link
            key={city.slug}
            href={`/businesses?city=${city.slug}`}
            className="group flex items-center justify-between gap-4 rounded-3xl border border-ink/10 bg-cream-100 p-6 transition-all hover:border-ink hover:bg-ink hover:text-cream"
          >
            <div>
              <h3 className="font-display text-xl font-semibold">{city.name}</h3>
              <p className="mt-1 text-sm text-ink/55 group-hover:text-cream/60">{city.blurb}</p>
            </div>
            <span className="shrink-0 rounded-full bg-ink/5 px-3 py-1.5 text-xs font-semibold group-hover:bg-cream/15">
              {counts[city.slug] ?? 0} places
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
