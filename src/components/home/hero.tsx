import { ButtonLink } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { SearchBar } from '@/components/meetups/search-bar';
import { CategoryRail } from '@/components/meetups/category-rail';
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
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover ring-2 ring-canvas"
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

        <div className="mt-14">
          <p className="text-center text-sm font-semibold text-content/60">{t.hero.categoriesHeading}</p>
          <CategoryRail variant="mosaic" className="mt-5" />
        </div>
      </div>
    </section>
  );
}
