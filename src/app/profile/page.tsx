import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getReviewsByUser } from '@/lib/data/reviews';
import { getSavedBusinesses } from '@/lib/data/saves';
import { getBookingsForUser, getQuiz } from '@/lib/data/dinners';
import { searchBusinesses } from '@/lib/data/businesses';
import { ProfileForm } from '@/components/layout/profile-form';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from '@/components/ui/rating-stars';
import { ButtonLink } from '@/components/ui/button';
import { PLANS, QUIZ_QUESTIONS } from '@/lib/constants';
import { relativeTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Your profile' };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/profile');

  const [reviews, saved, bookings, quiz, directory] = await Promise.all([
    getReviewsByUser(user.id),
    getSavedBusinesses(user.id),
    getBookingsForUser(user.id),
    getQuiz(user.id),
    searchBusinesses({ perPage: 500 }),
  ]);

  const plan = PLANS.find((p) => p.id === user.plan) ?? PLANS[0];
  const byId = new Map(directory.items.map((b) => [b.id, b]));
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled');

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user.fullName} src={user.avatarUrl} size={72} />
          <div>
            <h1 className="display-md">{user.fullName}</h1>
            <p className="text-sm text-ink/60">
              {user.city || 'City not set'} · Member since{' '}
              {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="flame">{plan.name}</Badge>
              {quiz ? <Badge tone="sage">Match-ready</Badge> : <Badge>Quiz not taken</Badge>}
            </div>
          </div>
        </div>
        <ButtonLink href="/pricing" variant="outline">
          Manage membership
        </ButtonLink>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Reviews written', reviews.length],
          ['Places saved', saved.length],
          ['Dinners booked', activeBookings.length],
          ['Cities explored', new Set(saved.map((s) => s.city)).size],
        ].map(([label, value]) => (
          <div key={String(label)} className="surface-card p-5">
            <dt className="text-xs font-semibold uppercase tracking-widest text-ink/50">{label}</dt>
            <dd className="mt-2 font-display text-3xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <ProfileForm user={user} />

          <div className="surface-card p-6">
            <h2 className="font-display text-xl font-semibold">Matching profile</h2>
            {quiz ? (
              <>
                <dl className="mt-4 space-y-3">
                  {QUIZ_QUESTIONS.map((question) => {
                    const answer = question.options.find((o) => o.value === quiz[question.id]);
                    if (!answer) return null;
                    return (
                      <div key={question.id} className="flex items-start justify-between gap-4 text-sm">
                        <dt className="text-ink/55">{question.prompt.replace(/\?$/, '')}</dt>
                        <dd className="shrink-0 font-semibold">{answer.label}</dd>
                      </div>
                    );
                  })}
                </dl>
                <Link href="/dinners/quiz" className="mt-5 inline-block text-sm font-semibold text-flame-700 hover:underline">
                  Retake the questionnaire →
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink/65">
                  Six questions decide who you sit with. Without them we seat you at random.
                </p>
                <ButtonLink href="/dinners/quiz" className="mt-4">
                  Take the quiz
                </ButtonLink>
              </>
            )}
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Your reviews</h2>
            <Link href="/businesses" className="text-sm font-semibold text-flame-700 hover:underline">
              Write another
            </Link>
          </div>

          {reviews.length === 0 ? (
            <p className="mt-6 text-sm text-ink/60">
              You have not reviewed anywhere yet. The directory only works because people do.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10">
              {reviews.map((review) => {
                const business = byId.get(review.businessId);
                return (
                  <li key={review.id} className="py-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={business ? `/businesses/${business.slug}` : '/businesses'}
                        className="font-semibold hover:text-flame"
                      >
                        {business?.name ?? 'A place on HomeMart'}
                      </Link>
                      <span className="shrink-0 text-xs text-ink/45">{relativeTime(review.createdAt)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <RatingStars value={review.rating} />
                      <span className="text-sm font-medium">{review.title}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-ink/65">{review.body}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
