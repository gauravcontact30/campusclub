import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { InterestsForm } from '@/components/layout/interests-form';

export const metadata: Metadata = { title: 'What would you turn up to?' };

export default async function InterestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/profile/interests');

  return (
    <div className="container-page max-w-2xl py-12 sm:py-20">
      <p className="eyebrow">One question</p>
      <h1 className="display-lg mt-2 text-balance text-content">What would you actually turn up to?</h1>
      <p className="lede mt-4">
        This only sorts your feed — nothing is hidden because of it, and you can change it whenever. Pick as many as
        you like.
      </p>

      <div className="mt-10">
        <InterestsForm initial={user.interests} />
      </div>
    </div>
  );
}
