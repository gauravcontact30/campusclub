import { SectionHead } from '@/components/home/section-head';
import { CoverageMap, type CityPoint } from '@/components/home/coverage-map';
import { CITIES, citiesInTier } from '@/lib/constants';

/** How many cities the landing page names before pointing at the directory. */
const NAMED_COUNT = 12;

/**
 * India's bounding box, and the one `cities.test.tsx` already asserts every
 * coordinate falls inside. Sharing the numbers is deliberate: if a city is ever
 * added with a transposed lat/lng, the test fails before this plots it into the
 * Bay of Bengal.
 */
const BOX = { minLng: 68, maxLng: 98, minLat: 6, maxLat: 37 };

/**
 * A degree of longitude at India's latitudes is about 104km against 111km for a
 * degree of latitude, so the box is very close to square and an equirectangular
 * projection distorts the shape by a few percent. That is well inside what a
 * dot-density plot at this size can show, and it costs no projection library.
 */
const W = 300;
const H = Math.round((W * (BOX.maxLat - BOX.minLat)) / (BOX.maxLng - BOX.minLng));

/**
 * Coverage, shown rather than claimed.
 *
 * This section has been four things: nine cards with a blurb each, three
 * columns of hairline rows, then a wrapped run of thirty chips. All three had
 * the same flaw — a sample of names is evidence of a sample, and a visitor
 * cannot tell from a sample whether their own city is on it.
 *
 * Plotting every city we run in answers that outright, and faster than text
 * can. It used to plot 119 and the shape was the argument; it dropped to ten,
 * where the honesty was; at thirty-eight it is both again. Somewhere in the map
 * is either your city or it is not, and either way you know inside a second.
 *
 * Dot size carries the tier, so the plot says something the count cannot: the
 * network is not eight bright metros and a scattering. Every heading here is
 * derived from the catalogue rather than typed, because the last one was not —
 * "Eight metros, and two towns" outlived the ten-city catalogue it described.
 *
 * The projection runs here rather than in the browser. The client component
 * needs seven numbers per city, not the catalogue — sending points instead of
 * `CITIES` keeps every blurb and coordinate out of the landing page's bundle.
 */
export function CityStrip({ counts }: { counts: Record<string, number> }) {
  const points: CityPoint[] = CITIES.map((city) => ({
    slug: city.slug,
    name: city.name,
    state: city.state,
    tier: city.tier,
    x: ((city.lng - BOX.minLng) / (BOX.maxLng - BOX.minLng)) * W,
    y: ((BOX.maxLat - city.lat) / (BOX.maxLat - BOX.minLat)) * H,
    count: counts[city.name] ?? 0,
  }));

  const states = new Set(CITIES.map((c) => c.state)).size;
  const tierTwo = citiesInTier(2).length;

  const stats = [
    { value: String(CITIES.length), label: 'cities with a board' },
    { value: String(tierTwo), label: 'of them Tier-2 cities' },
    { value: String(states), label: 'states and union territories' },
  ];

  return (
    <section className="container-page py-16" aria-labelledby="cities-heading">
      <SectionHead
        id="cities-heading"
        eyebrow={`${CITIES.length} cities across India`}
        title={`${citiesInTier(1).length} metros. ${tierTwo} Tier-2 cities. ${citiesInTier(3).length} district towns.`}
        lede="We open a board where enough people are already going to things that a stranger’s meetup fills. That was never only true of the metros — it is true of every coaching quarter, campus belt and IT park on this map, which is why most of the cities on it are Tier-2."
      />

      <div className="mx-auto mt-10 max-w-4xl rounded-[1.75rem] border border-content/10 bg-canvas-700 shadow-card">
        <CoverageMap
          points={points}
          width={W}
          height={H}
          named={points.slice(0, NAMED_COUNT)}
          /* Clamped: the catalogue is smaller than NAMED_COUNT now, so the
             subtraction went negative and the strip offered "and -2 more". */
          remaining={Math.max(0, CITIES.length - NAMED_COUNT)}
          stats={stats}
        />
      </div>

    </section>
  );
}
