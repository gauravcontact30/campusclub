import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMeetupBySlug } from '@/lib/data/meetups';
import { hasAttended } from '@/lib/data/joins';
import { getCurrentUser } from '@/lib/auth/session';
import { VouchForm } from '@/components/meetups/vouch-form';
import { formatDay } from '@/lib/utils';

export const metadata: Metadata = { title: 'Leave feedback' };

export default async function FeedbackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meetup = await getMeetupBySlug(slug);
  if (!meetup) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/meetups/${slug}/feedback`);

  // The same rule the action enforces, checked here too so nobody is shown a
  // form that is going to reject them.
  const attended = await hasAttended(user.id, meetup.id);

  if (!attended) {
    return (
      <div className="container-page max-w-2xl py-16">
        <h1 className="display-lg text-content">Only people who went can leave feedback</h1>
        <p className="lede mt-4">
          That is the rule that keeps the ratings on this site worth reading. If you were at this one and it is not
          showing, check that your join was confirmed rather than waitlisted.
        </p>
        <Link href={`/meetups/${slug}`} className="link-underline mt-6 inline-block font-semibold text-content">
          Back to the meetup
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-12 sm:py-16">
      <p className="eyebrow">{formatDay(meetup.startsAt)}</p>
      <h1 className="display-lg mt-2 text-balance text-content">How was {meetup.title}?</h1>
      <p className="lede mt-3">
        Hosted by {meetup.host.name}. Say what actually happened — the good and the parts that were not as listed.
      </p>

      <div className="mt-8">
        <VouchForm meetupId={meetup.id} />
      </div>
    </div>
  );
}
