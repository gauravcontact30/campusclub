import { ArrowRight, Sparkles } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { HeroSearch } from './hero-search';

const FACES = [
  { name: 'Aarav', src: '/img/avatars/a-01.svg' },
  { name: 'Priya', src: '/img/avatars/a-02.svg' },
  { name: 'Daniel', src: '/img/avatars/a-03.svg' },
  { name: 'Sofia', src: '/img/avatars/a-04.svg' },
  { name: 'Mei', src: '/img/avatars/a-05.svg' },
];

export function Hero({ businessCount, cityCount }: { businessCount: number; cityCount: number }) {
  return (
    <section className="relative overflow-hidden bg-noir text-frost">
      {/* soft light bloom behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-[520px] w-[520px] rounded-full bg-orchid/25 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-parrot/20 blur-[120px]"
      />

      <div className="container-page relative grid gap-14 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-frost/20 px-3.5 py-1.5 text-xs font-medium text-frost/80">
            <Sparkles size={14} className="text-orchid" />
            Every Wednesday, 8:00 PM — in {cityCount} cities
          </span>

          <h1 className="display-xl mt-6 text-frost">
            Meet five strangers.
            <br />
            <span className="text-orchid">Find your city.</span>
          </h1>

          <p className="lede mt-6 max-w-xl text-frost/70">
            HomeMart does two things properly. It tells you which local places are actually worth your money — reviewed
            by people who went — and it seats you at a table with five strangers you would probably like.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/dinners" size="lg" className="group">
              Book a seat this Wednesday
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </ButtonLink>
            <ButtonLink href="/businesses" variant="secondary" size="lg">
              Explore {businessCount} places
            </ButtonLink>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="flex -space-x-3">
              {FACES.map((f) => (
                <Avatar key={f.name} name={f.name} src={f.src} size={38} className="ring-2 ring-noir" />
              ))}
            </div>
            <p className="text-sm text-frost/60">
              <span className="font-semibold text-frost">18,400+ seats</span> filled since we started.
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
