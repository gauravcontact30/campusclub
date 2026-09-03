import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getSavedMeetups } from '@/lib/data/saves';
import { MeetupCard } from '@/components/meetups/meetup-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ButtonLink } from '@/components/ui/button';
import { hasStarted } from '@/lib/utils';

export const metadata: Metadata = { title: 'Saved meetups' };

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/saved');

  const saved = await getSavedMeetups(user.id);
  // Something you saved three weeks ago has usually already happened. Splitting
  // them is more useful than silently hiding the past ones.
  const upcoming = saved.filter((m) => !hasStarted(m.startsAt));
  const gone = saved.filter((m) => hasStarted(m.startsAt));

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow">Your shortlist</p>
      <h1 className="display-lg mt-2 text-content">Saved meetups</h1>
      <p className="lede mt-3">Everything you bookmarked, still open on the left, already run on the right.</p>

      {saved.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Nothing saved yet"
            description="Tap the bookmark on any meetup and it lands here — useful when you want to think about it before paying."
            action={<ButtonLink href="/meetups">See what’s on</ButtonLink>}
          />
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((meetup) => (
                <MeetupCard key={meetup.id} meetup={meetup} saved />
              ))}
            </div>
          )}

          {gone.length > 0 && (
            <section className="mt-14">
              <h2 className="display-md text-content">Already happened</h2>
              <p className="lede mt-2">
                Recurring ones usually come back — open a listing to see when the next is.
              </p>
              <div className="mt-6 grid gap-5 opacity-70 sm:grid-cols-2 lg:grid-cols-3">
                {gone.map((meetup) => (
                  <MeetupCard key={meetup.id} meetup={meetup} saved />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
