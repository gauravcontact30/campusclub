import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { IndianRupee, ShieldCheck, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { HostForm } from '@/components/meetups/host-form';

export const metadata: Metadata = {
  title: 'Host a meetup',
  description: 'Put the thing you already do on the board, set a join fee that covers your costs, and fill the spots.',
};

const POINTS = [
  {
    icon: IndianRupee,
    title: 'Set a fee that covers your costs',
    body: 'Court hire, a day pass, the food, the study room. Every rupee of the join fee goes to you — we do not take a cut while the product is finding its feet.',
  },
  {
    icon: Users,
    title: 'We handle the awkward parts',
    body: 'Payments, the waitlist, refunds when someone drops out, and the reminder the night before. You turn up and run the thing.',
  },
  {
    icon: ShieldCheck,
    title: 'You decide who comes',
    body: 'Cap the spots, set the level so nobody arrives expecting something else, and open it to everyone or to women only.',
  },
];

export default async function HostPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/host');

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Hosting is free</p>
        <h1 className="display-lg mt-2 text-balance text-content">
          Put the thing you already do on the board.
        </h1>
        <p className="lede mt-4">
          Most hosts start with something they were doing alone anyway — a 6am run, a study table, a Sunday dinner —
          and add the seven people who make it stick.
        </p>
      </header>

      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {POINTS.map((point) => (
          <li key={point.title} className="surface-card space-y-3 p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12 text-brand">
              <point.icon size={19} />
            </span>
            <h2 className="font-display text-base font-bold text-content">{point.title}</h2>
            <p className="text-sm leading-relaxed text-content/70">{point.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-14 max-w-3xl">
        <HostForm defaultCity={user.city} />
      </div>
    </div>
  );
}
