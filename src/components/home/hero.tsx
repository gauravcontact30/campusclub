import { ButtonLink } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { SearchBar } from '@/components/meetups/search-bar';
import { CategoryRail } from '@/components/meetups/category-rail';
import { getDictionary } from '@/lib/i18n/server';
import { fill } from '@/lib/i18n/format';
import { cn, formatCount } from '@/lib/utils';
import type { HostSummary } from '@/types';

/**
 * Solid colour, not initials: at 28px with a third of each circle clipped by
 * its neighbour, two-letter initials just produce unreadable fragments of
 * text. A flat tint reads instantly as "a person" without asking to be read,
 * and it carries the same brand/ink/signal hierarchy as the mark itself
 * instead of introducing a fourth meaning for colour.
 */
const AVATAR_TINTS = ['bg-brand', 'bg-content-200', 'bg-signal'];

/**
 * One promise, one control, one rail. The editorial half of this design lives
 * here — a single sentence in the display serif carrying the whole proposition
 * — and the utilitarian half starts immediately underneath it, because the
 * fastest thing a first-time visitor can do is search.
 *
 * There is deliberately no full-height opener: a 100vh hero pushes the page out
 * of the first frame, which is what a shared link and a thumbnail both get.
 */
export async function Hero({
  meetupCount,
  cityCount,
  hosts = [],
}: {
  meetupCount: number;
  cityCount: number;
  hosts?: HostSummary[];
}) {
  const t = await getDictionary();

  return (
    <section className="border-b border-content/10">
      <div className="container-page py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/8 px-4 py-1.5 text-sm font-medium text-brand-700">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            {fill(t.hero.badge, { count: formatCount(meetupCount), cities: cityCount })}
          </p>

          <h1 className="display-xl mt-6 text-balance text-content">
            {t.hero.titleTop} <span className="text-brand">{t.hero.titleBottom}</span>
          </h1>

          <p className="lede mx-auto mt-6 max-w-2xl">{t.hero.lede}</p>

          <div className="mx-auto mt-9 max-w-2xl">
            <SearchBar size="lg" />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-content/60">
            <span className="inline-flex items-center gap-2.5">
              {hosts.length > 0 && (
                <span className="flex -space-x-2" aria-hidden>
                  {hosts.map((host, i) =>
                    host.avatarUrl ? (
                      <Avatar key={host.id} name={host.name} src={host.avatarUrl} size={28} className="ring-2 ring-canvas" />
                    ) : (
                      <span
                        key={host.id}
                        className={cn('h-7 w-7 rounded-full ring-2 ring-canvas', AVATAR_TINTS[i % AVATAR_TINTS.length])}
                      />
                    ),
                  )}
                </span>
              )}
              <span>
                <span className="font-semibold text-content">{t.hero.statJoins}</span> {t.hero.statJoinsSuffix}
              </span>
            </span>
            <span className="hidden h-4 w-px bg-content/20 sm:block" aria-hidden />
            <ButtonLink href="/host" variant="ghost" size="sm" className="text-brand-700 hover:bg-brand/10">
              {t.hero.secondaryCta} →
            </ButtonLink>
          </div>
        </div>

        <div className="mt-14">
          <p className="text-center text-sm font-semibold text-content/60">{t.hero.categoriesHeading}</p>
          <CategoryRail variant="mosaic" className="mt-5" />
        </div>
      </div>
    </section>
  );
}
