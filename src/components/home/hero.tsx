import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { SearchBar } from '@/components/meetups/search-bar';
import { CategoryIndex } from '@/components/meetups/category-index';
import { getDictionary } from '@/lib/i18n/server';
import { fill } from '@/lib/i18n/format';
import { FEATURED_PORTRAIT_IDS, portraitUrl } from '@/lib/media/portraits';
import { formatCount } from '@/lib/utils';
import type { HostSummary } from '@/types';

const STACK_SIZE = 5;

/**
 * Five faces, always.
 *
 * The stack used to be built purely from the hosts of whatever meetups were
 * upcoming, which made it hostage to the query: hosts with no photo rendered as
 * flat colour discs, and an empty database rendered nothing at all. Since the
 * whole point of the row is "these are people", it leads with real hosts when
 * they have pictures and tops up from a fixed, mixed set — students and working
 * professionals, women and men — rather than degrading to abstract dots.
 */
function stackFaces(hosts: HostSummary[]) {
  const faces = hosts
    .filter((h) => h.avatarUrl)
    .slice(0, STACK_SIZE)
    .map((h) => ({ key: h.id, src: h.avatarUrl as string, seed: h.name }));

  for (const id of FEATURED_PORTRAIT_IDS) {
    if (faces.length >= STACK_SIZE) break;
    faces.push({ key: id, src: portraitUrl(id, 96), seed: id });
  }

  return faces;
}

/**
 * One promise, one control, one row of faces.
 *
 * The editorial half of this design lives here — a single sentence in the
 * display serif carrying the whole proposition — and the utilitarian half
 * starts immediately underneath it, because the fastest thing a first-time
 * visitor can do is search. Centred throughout: the block is being read before
 * it is being used, and there is nothing beside it to align to.
 *
 * There is deliberately no full-height opener: a 100vh hero pushes the page out
 * of the first frame, which is what a shared link and a thumbnail both get.
 */
export async function Hero({
  meetupCount,
  cityCount,
  hosts = [],
  categoryCounts = {},
}: {
  meetupCount: number;
  cityCount: number;
  hosts?: HostSummary[];
  /** Live meetups per category slug — drives the numbers in the index. */
  categoryCounts?: Record<string, number>;
}) {
  const t = await getDictionary();

  /**
   * Never open with a zero.
   *
   * The badge reads "0 meetups happening across {n} cities" whenever the board
   * is empty — the first sentence on the site, volunteering that there is
   * nothing on it. The city count is true either way, so that is what it falls
   * back to until there is a real number to put there.
   */
  const badge =
    meetupCount > 0
      ? fill(t.hero.badge, { count: formatCount(meetupCount), cities: cityCount })
      : fill(t.hero.badgeCities, { cities: cityCount });

  return (
    <section className="border-b border-content/10">
      <div className="container-page relative isolate py-14 sm:py-20">
        {/* Two soft, theme-aware blobs — the Timeleft register this hero is
            evolving toward. Fixed to two breakpoints rather than the whole
            page so they never compete with the centred copy on narrow
            screens, where there is no side margin to place them in.
            `-z-10` (inside the wrapper's `isolate` stacking context) keeps
            them behind any content regardless of copy length or DOM order. */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-[6%] top-4 hidden h-14 w-20 -z-10 rotate-[10deg] rounded-[50%_50%_50%_8%] bg-signal/15 sm:block"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-[8%] top-28 hidden h-10 w-10 -z-10 -rotate-12 rounded-full bg-brand/12 lg:block"
        />
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/8 px-4 py-1.5 text-sm font-medium text-brand-700">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            {badge}
          </p>

          <h1 className="section-title mt-6 text-balance text-content">
            {t.hero.titleTop} <span className="text-brand">{t.hero.titleBottom}</span>
          </h1>

          <p className="lede mx-auto mt-6 max-w-2xl">{t.hero.lede}</p>

          <div className="mx-auto mt-9 max-w-2xl">
            <SearchBar size="lg" />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-content/60">
            <span className="inline-flex items-center gap-2.5">
              {/* `shrink-0`: a `-space-x-*` stack measures narrower than the
                  pictures inside it, so as a flex child it gets squeezed and the
                  last face rides into the sentence beside it. */}
              <span className="flex shrink-0 -space-x-2" aria-hidden>
                {stackFaces(hosts).map((face) => (
                  <ImageWithFallback
                    key={face.key}
                    src={face.src}
                    alt=""
                    seed={face.seed}
                    width={30}
                    height={30}
                    className="h-[30px] w-[30px] rounded-full object-cover ring-2 ring-canvas"
                  />
                ))}
              </span>
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

        {/* Activity discovery shares the same category and tint tokens as the board. */}
        <section aria-labelledby="activities-heading" className="mt-14 border-t border-content/10 pt-10 text-left sm:mt-16">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div>
              <h2 id="activities-heading" className="section-title text-content">{t.hero.categoriesHeading}</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-content/60">{t.hero.categoriesLede}</p>
            </div>
            <Link
              href="/meetups"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-content/20 bg-canvas-700 px-5 py-2.5 text-sm font-semibold text-content transition-colors hover:border-brand hover:text-brand"
            >
              {t.hero.categoriesLink} <ArrowRight size={15} />
            </Link>
          </div>
          <CategoryIndex counts={categoryCounts} variant="cards" className="mt-7" />
        </section>
      </div>
    </section>
  );
}
