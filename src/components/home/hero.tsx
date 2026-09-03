import { ArrowRight, Sparkles } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { HeroSearch } from './hero-search';
import { getDictionary } from '@/lib/i18n/server';
import { fill } from '@/lib/i18n/format';

const FACES = [
  { name: 'Aarav', src: '/img/avatars/a-01.svg' },
  { name: 'Priya', src: '/img/avatars/a-02.svg' },
  { name: 'Daniel', src: '/img/avatars/a-03.svg' },
  { name: 'Sofia', src: '/img/avatars/a-04.svg' },
  { name: 'Mei', src: '/img/avatars/a-05.svg' },
];

export async function Hero({ businessCount, cityCount }: { businessCount: number; cityCount: number }) {
  const t = await getDictionary();

  return (
    <section className="relative overflow-hidden bg-canvas text-content">
      {/* soft light bloom behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-[520px] w-[520px] rounded-full bg-brand/25 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-signal/20 blur-[120px]"
      />

      <div className="container-page relative grid gap-14 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-content/20 px-3.5 py-1.5 text-xs font-medium text-content/80">
            <Sparkles size={14} className="text-brand" />
            {fill(t.hero.badge, { count: cityCount })}
          </span>

          <h1 className="display-xl mt-6 text-content">
            {t.hero.titleTop}
            <br />
            <span className="text-brand">{t.hero.titleBottom}</span>
          </h1>

          <p className="lede mt-6 max-w-xl text-content/70">
            {t.hero.lede}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/dinners" size="lg" className="group">
              {t.hero.primaryCta}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </ButtonLink>
            <ButtonLink href="/businesses" variant="secondary" size="lg">
              {fill(t.hero.secondaryCta, { count: businessCount })}
            </ButtonLink>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="flex -space-x-3">
              {FACES.map((f) => (
                <Avatar key={f.name} name={f.name} src={f.src} size={38} className="ring-2 ring-canvas" />
              ))}
            </div>
            <p className="text-sm text-content/60">
              <span className="font-semibold text-content">{t.hero.seatsFilled}</span> {t.hero.seatsFilledSuffix}
            </p>
          </div>
        </div>

        <div className="animate-fade-up lg:pl-6">
          <HeroSearch />
        </div>
      </div>
    </section>
  );
}
