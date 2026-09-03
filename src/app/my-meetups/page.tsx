import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { getPastJoins, getUpcomingJoins, isRefundable } from '@/lib/data/joins';
import { getMeetupsHostedBy } from '@/lib/data/meetups';
import { getVouches } from '@/lib/data/vouches';
import { CancelJoinButton } from '@/components/meetups/cancel-join-button';
import { CancelMeetupButton } from '@/components/meetups/cancel-meetup-button';
import { MeetupCard } from '@/components/meetups/meetup-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatFee, pluralize, spotsState } from '@/lib/utils';
import { passById } from '@/lib/constants';

export const metadata: Metadata = { title: 'Your meetups' };

export default async function MyMeetupsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/my-meetups');

  const [upcoming, past, hosting] = await Promise.all([
    getUpcomingJoins(user.id),
    getPastJoins(user.id),
    getMeetupsHostedBy(user.id),
  ]);

  // Which past meetups still want feedback — the one nudge worth making here.
  const reviewed = await Promise.all(
    past.map(async (j) => (await getVouches(j.meetupId)).some((v) => v.userId === user.id)),
  );

  const pass = passById(user.pass);

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Your calendar</p>
          <h1 className="display-lg mt-2 text-content">Your meetups</h1>
        </div>
        <Link
          href="/passes"
          className="surface-card flex items-center gap-3 px-5 py-3.5 transition-colors hover:border-brand/40"
        >
          <Ticket size={18} className="text-brand" />
          <span className="text-sm">
            <span className="block font-semibold text-content">{pass?.name ?? 'Pay as you go'}</span>
            <span className="block text-content/60">
              {user.pass === 'unlimited'
                ? 'Unlimited joins'
                : user.pass === 'payg'
                  ? 'Paying per meetup'
                  : `${pluralize(user.credits, 'credit')} left`}
            </span>
          </span>
        </Link>
      </header>

      <section className="mt-10 space-y-4" aria-labelledby="going-heading">
        <h2 id="going-heading" className="display-md text-content">
          Coming up
        </h2>

        {upcoming.length ? (
          <ul className="space-y-3">
            {upcoming.map((join) => (
              <li key={join.id} className="surface-card flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/meetups/${join.meetup.slug}`}
                      className="font-display text-lg font-bold text-content hover:text-brand"
                    >
                      {join.meetup.title}
                    </Link>
                    {join.status === 'waitlisted' && <Badge tone="signal">Waitlisted</Badge>}
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-content/60">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} /> {formatDateTime(join.meetup.startsAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} /> {join.meetup.venueName}, {join.meetup.area}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-content">
                    {join.amountCents > 0 ? formatFee(join.amountCents) : join.paymentId === 'credit' ? '1 credit' : 'Free'}
                  </span>
                  <CancelJoinButton joinId={join.id} refundable={isRefundable(join.meetup.startsAt)} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nothing in the diary"
            description="You have not joined anything yet. Most people start with the cheapest thing on the board that is happening this week."
            action={
              <ButtonLink href="/meetups" className="mt-2">
                See what’s on
              </ButtonLink>
            }
          />
        )}
      </section>

      {hosting.length > 0 && (
        <section className="mt-14 space-y-4" aria-labelledby="hosting-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="hosting-heading" className="display-md text-content">
              You are hosting
            </h2>
            <ButtonLink href="/host" variant="outline" size="sm">
              Host another
            </ButtonLink>
          </div>

          <ul className="space-y-3">
            {hosting.map((meetup) => {
              const spots = spotsState(meetup.spotsTaken, meetup.spotsTotal);
              return (
                <li key={meetup.id} className="surface-card flex flex-wrap items-center gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/meetups/${meetup.slug}`}
                      className="font-display text-lg font-bold text-content hover:text-brand"
                    >
                      {meetup.title}
                    </Link>
                    <p className="mt-1.5 text-sm text-content/60">
                      {formatDateTime(meetup.startsAt)} · {spots.taken} of {spots.total} spots taken ·{' '}
                      {formatFee(meetup.joinFeeCents * spots.taken)} collected
                    </p>
                  </div>
                  <CancelMeetupButton meetupId={meetup.id} joined={spots.taken} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-14 space-y-4" aria-labelledby="past-heading">
          <h2 id="past-heading" className="display-md text-content">
            Been to
          </h2>
          <ul className="space-y-3">
            {past.map((join, i) => (
              <li key={join.id} className="surface-card flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/meetups/${join.meetup.slug}`}
                    className="font-semibold text-content hover:text-brand"
                  >
                    {join.meetup.title}
                  </Link>
                  <p className="mt-1 text-sm text-content/55">{formatDateTime(join.meetup.startsAt)}</p>
                </div>
                {join.status === 'confirmed' &&
                  (reviewed[i] ? (
                    <span className="text-sm text-content/50">Feedback left</span>
                  ) : (
                    <ButtonLink href={`/meetups/${join.meetup.slug}/feedback`} variant="outline" size="sm">
                      Say how it went
                    </ButtonLink>
                  ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* A quiet rail of suggestions rather than an empty page once everything
          above is done. */}
      {upcoming.length === 0 && hosting.length === 0 && past.length > 0 && (
        <section className="mt-14">
          <h2 className="display-md text-content">Go again</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {past.slice(0, 3).map((join) => (
              <MeetupCard key={join.id} meetup={join.meetup} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
