import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { CATEGORIES } from '@/lib/constants';
import { getDictionary } from '@/lib/i18n/server';
import { fill } from '@/lib/i18n/format';
import { formatCount } from '@/lib/utils';

export async function Hero({ meetupCount, cityCount }: { meetupCount: number; cityCount: number }) {
  const t = await getDictionary();

  return (
    <section className="relative overflow-hidden border-b border-content/10">
      <div className="container-page grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-medium text-brand-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
            </span>
            {fill(t.hero.badge, { count: formatCount(meetupCount), cities: cityCount })}
          </p>

          <h1 className="display-xl mt-6 text-balance text-content">
            {t.hero.titleTop} <span className="text-brand">{t.hero.titleBottom}</span>
          </h1>

          <p className="lede mt-6 max-w-xl">{t.hero.lede}</p>

          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/meetups" size="lg">
              {t.hero.primaryCta} <ArrowRight size={17} />
            </ButtonLink>
            <ButtonLink href="/host" variant="outline" size="lg">
              {t.hero.secondaryCta}
            </ButtonLink>
          </div>

          <p className="mt-7 text-sm text-content/55">
            <span className="font-semibold text-content">{t.hero.statJoins}</span> {t.hero.statJoinsSuffix}
          </p>
        </div>

        {/* The eight things people meet up to do, as a grid rather than a
            decorative image — it is the fastest route into the product and it
            doubles as the answer to "what is this site for". */}
        <ul className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/meetups?category=${c.slug}`}
                className="group flex h-full flex-col gap-2 rounded-2xl border border-content/10 bg-canvas-700 p-4 transition-colors hover:border-brand/50 hover:bg-brand/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/12 text-brand">
                  <CategoryIcon slug={c.slug} size={17} />
                </span>
                <span className="font-display text-sm font-bold text-content">{c.name}</span>
                <span className="text-xs leading-relaxed text-content/55">{c.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
