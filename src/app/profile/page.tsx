import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getPastJoins, getUpcomingJoins } from '@/lib/data/joins';
import { getMeetupsHostedBy } from '@/lib/data/meetups';
import { getVouchesForHost } from '@/lib/data/vouches';
import { getSavedMeetupIds } from '@/lib/data/saves';
import { getPaymentsForUser } from '@/lib/data/payments';
import { ProfileForm } from '@/components/layout/profile-form';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { RatingBlocks } from '@/components/ui/rating-blocks';
import { categoryBySlug, passById } from '@/lib/constants';
import { formatMoney, pluralize, relativeTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Your profile' };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/profile');

  const [upcoming, past, hosting, hostVouches, savedIds, payments] = await Promise.all([
    getUpcomingJoins(user.id),
    getPastJoins(user.id),
    getMeetupsHostedBy(user.id),
    getVouchesForHost(user.id),
    getSavedMeetupIds(user.id),
    getPaymentsForUser(user.id),
  ]);

  const pass = passById(user.pass);
  const attended = past.filter((j) => j.status === 'confirmed');
  const spent = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amountCents, 0);
  const hostRating = hostVouches.length
    ? hostVouches.reduce((sum, v) => sum + v.rating, 0) / hostVouches.length
    : 0;

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user.fullName} src={user.avatarUrl} size={72} />
          <div>
            <h1 className="display-md text-content">{user.fullName}</h1>
            <p className="text-sm text-content/60">
              {user.city || 'City not set'} · Member since{' '}
              {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="brand">{pass?.name ?? 'Pay as you go'}</Badge>
              {user.pass !== 'payg' && user.pass !== 'unlimited' && (
                <Badge tone="signal">{pluralize(user.credits, 'credit')} left</Badge>
              )}
              {hosting.length > 0 && <Badge>Host</Badge>}
            </div>
          </div>
        </div>
        <ButtonLink href="/passes" variant="outline">
          Manage your pass
        </ButtonLink>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Meetups attended', String(attended.length)],
          ['Coming up', String(upcoming.length)],
          ['Hosted', String(hosting.length)],
          ['Paid in join fees', formatMoney(spent)],
        ].map(([label, value]) => (
          <div key={label} className="surface-card p-5">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-content/50">{label}</dt>
            <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-content">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <ProfileForm user={user} />

          <section className="surface-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-content">What you turn up to</h2>
              <Link href="/profile/interests" className="text-sm font-semibold text-brand-700 hover:underline">
                Edit
              </Link>
            </div>
            {user.interests.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {user.interests.map((slug) => (
                  <Badge key={slug} tone="brand">
                    <CategoryIcon slug={slug} size={12} />
                    {categoryBySlug(slug)?.name ?? slug}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-content/65">
                Nothing picked yet, so your feed is sorted by what is happening soonest rather than by what you like.
              </p>
            )}
            <p className="mt-4 text-sm text-content/55">
              You have saved {pluralize(savedIds.length, 'meetup')} for later.
            </p>
          </section>
        </div>

        <section className="surface-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-content">Your hosting</h2>
            <ButtonLink href="/host" variant="ghost" size="sm" className="text-brand-700">
              Host a meetup
            </ButtonLink>
          </div>

          {hosting.length === 0 ? (
            <p className="mt-3 text-sm text-content/65">
              You have not hosted anything yet. The usual first one is something you already do alone — a run, a study
              table, a Sunday breakfast — with six spots on it.
            </p>
          ) : (
            <>
              {hostVouches.length > 0 && (
                <p className="mt-3 flex items-center gap-2 text-sm text-content/70">
                  <RatingBlocks value={hostRating} size={14} />
                  {hostRating.toFixed(1)} from {pluralize(hostVouches.length, 'attendee')}
                </p>
              )}

              <ul className="mt-4 divide-y divide-content/10">
                {hosting.map((meetup) => (
                  <li key={meetup.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/meetups/${meetup.slug}`}
                        className="font-semibold text-content hover:text-brand"
                      >
                        {meetup.title}
                      </Link>
                      <p className="truncate text-xs text-content/55">
                        {meetup.area}, {meetup.city} · {meetup.spotsTaken}/{meetup.spotsTotal} spots
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-content/55">{relativeTime(meetup.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
