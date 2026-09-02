import type { Metadata } from 'next';
import { BadgeCheck, MessagesSquare, TrendingUp } from 'lucide-react';
import { AddBusinessForm } from '@/components/business/add-business-form';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'List your business',
  description: 'Add your business to HomeMart, claim the listing and respond to reviews.',
};

const PERKS = [
  { icon: BadgeCheck, title: 'A claimed badge', body: 'Verified listings get a badge on every card and rank higher in "recommended".' },
  { icon: MessagesSquare, title: 'Reply to reviews', body: 'Respond publicly once, under your business name. No pay-to-remove, ever.' },
  { icon: TrendingUp, title: 'Dinner partnerships', body: 'Well-reviewed venues get first refusal on hosting Wednesday tables.' },
];

export default async function AddBusinessPage() {
  const user = await getCurrentUser();

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">For owners</p>
        <h1 className="display-lg mt-3">Put your place on the map.</h1>
        <p className="lede mt-4">
          Listing is free and takes about two minutes.{' '}
          {user ? 'It will be linked to your account, so you can respond to reviews right away.' : 'Sign in first if you want to claim it as the owner.'}
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <AddBusinessForm />

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          {PERKS.map((perk) => (
            <div key={perk.title} className="surface-card p-6">
              <perk.icon size={22} className="text-flame" />
              <h2 className="mt-3 font-display text-lg font-semibold">{perk.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{perk.body}</p>
            </div>
          ))}
          <p className="px-2 text-xs leading-relaxed text-ink/50">
            By listing you confirm you are authorised to represent the business. We verify by phone before granting
            owner tools.
          </p>
        </aside>
      </div>
    </div>
  );
}
