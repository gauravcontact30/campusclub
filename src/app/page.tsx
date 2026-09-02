import { Hero } from '@/components/home/hero';
import { HowItWorks } from '@/components/home/how-it-works';
import { CategoryGrid } from '@/components/home/category-grid';
import { FeaturedBusinesses } from '@/components/home/featured-businesses';
import { DinnerTeaser } from '@/components/home/dinner-teaser';
import { Testimonials } from '@/components/home/testimonials';
import { CityStrip } from '@/components/home/city-strip';
import { Faq } from '@/components/home/faq';
import { CtaBand } from '@/components/home/cta-band';
import { countBusinessesByCity, getFeaturedBusinesses, searchBusinesses } from '@/lib/data/businesses';
import { getDinners } from '@/lib/data/dinners';
import { getCurrentUser } from '@/lib/auth/session';
import { getSavedBusinessIds } from '@/lib/data/saves';
import { CITIES } from '@/lib/constants';

export default async function HomePage() {
  const [featured, dinners, counts, user, all] = await Promise.all([
    getFeaturedBusinesses(6),
    getDinners(),
    countBusinessesByCity(),
    getCurrentUser(),
    searchBusinesses({ perPage: 1 }),
  ]);

  const savedIds = user ? await getSavedBusinessIds(user.id) : [];

  return (
    <>
      <Hero businessCount={all.total} cityCount={CITIES.length} />
      <HowItWorks />
      <CategoryGrid />
      <FeaturedBusinesses businesses={featured} savedIds={savedIds} />
      <DinnerTeaser events={dinners} />
      <Testimonials />
      <CityStrip counts={counts} />
      <Faq />
      <CtaBand />
    </>
  );
}
