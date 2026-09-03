import { Hero } from '@/components/home/hero';
import { HowItWorks } from '@/components/home/how-it-works';
import { Upcoming } from '@/components/home/upcoming';
import { Proof } from '@/components/home/proof';
import { CityStrip } from '@/components/home/city-strip';
import { Faq } from '@/components/home/faq';
import { CtaBand } from '@/components/home/cta-band';
import { countMeetupsByCity, getUpcomingMeetups, searchMeetups } from '@/lib/data/meetups';
import { getCurrentUser } from '@/lib/auth/session';
import { getSavedMeetupIds } from '@/lib/data/saves';
import { CITIES } from '@/lib/constants';

export default async function HomePage() {
  const user = await getCurrentUser();

  // A signed-in member's home page leads with their own city — everything else
  // on the board is one click away, but the first thing they see is reachable.
  const [all, counts, savedIds] = await Promise.all([
    searchMeetups({ perPage: 1 }),
    countMeetupsByCity(),
    user ? getSavedMeetupIds(user.id) : Promise.resolve<string[]>([]),
  ]);

  const homeCity = user?.city && counts[user.city] ? user.city : undefined;
  const upcoming = await getUpcomingMeetups(6, homeCity ? homeCity.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <>
      <Hero meetupCount={all.total} cityCount={CITIES.length} />
      <Upcoming
        meetups={upcoming}
        savedIds={savedIds}
        title={homeCity ? `Happening in ${homeCity}` : 'Happening this week'}
        subtitle={
          homeCity
            ? 'The next few things you could be at, all within your city.'
            : 'Every one of these still has a spot open. Pick one and pay for that one.'
        }
      />
      <HowItWorks />
      <Proof />
      <CityStrip counts={counts} />
      <Faq />
      <CtaBand />
    </>
  );
}
