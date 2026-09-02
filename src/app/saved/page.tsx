import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getSavedBusinesses } from '@/lib/data/saves';
import { BusinessCard } from '@/components/business/business-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Saved places' };

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/saved');

  const saved = await getSavedBusinesses(user.id);

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow">Your list</p>
      <h1 className="display-lg mt-3">Saved places</h1>
      <p className="lede mt-3">Everywhere you bookmarked, ready for the next time someone asks.</p>

      {saved.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Nothing saved yet"
            description="Tap the bookmark on any listing and it lands here — handy when you are standing on a street corner deciding."
            action={<ButtonLink href="/businesses">Browse the directory</ButtonLink>}
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((business) => (
            <BusinessCard key={business.id} business={business} saved />
          ))}
        </div>
      )}
    </div>
  );
}
