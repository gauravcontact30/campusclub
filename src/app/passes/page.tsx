import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth/session';
import { getJoinsForUser } from '@/lib/data/joins';
import { PassGrid } from '@/components/passes/pass-grid';
import { PassCalculator } from '@/components/passes/pass-calculator';
import { PASSES, FREE_CANCELLATION_HOURS } from '@/lib/constants';
import { memberSpend, monthlyJoinRate } from '@/lib/economics';
import { PAYMENT_MODE } from '@/lib/payments/config';

export const metadata: Metadata = {
  title: 'Passes',
  description: 'Pay per meetup, or pre-buy joins on a pass. No subscription is required to use CampusClub.',
};

const NOTES = [
  {
    q: 'You do not need one of these',
    a: 'The default is paying the join fee for the one meetup you want. Passes exist because people who go three times a week end up wanting them, not because the product needs a subscription to work.',
  },
  {
    q: 'A credit is one join, on any meetup',
    a: 'It does not matter whether the meetup costs ₹49 or ₹499 — one credit covers it. So passes are worth most to people who go to the expensive things.',
  },
  {
    q: 'Unused credits do not roll over',
    a: 'They reset each month. If you are consistently not using them, drop to a smaller pass or back to pay as you go — the switch is instant and takes effect immediately.',
  },
  {
    q: 'Cancelling gives the credit back',
    a: `Cancel more than ${FREE_CANCELLATION_HOURS} hours before a meetup starts and the credit returns to your balance, the same way a paid fee is refunded.`,
  },
];

export default async function PassesPage() {
  const user = await getCurrentUser();

  // Seed the calculator from what this member actually does, so a signed-in
  // visitor lands on their own answer rather than a made-up default.
  const joins = user ? await getJoinsForUser(user.id) : [];
  const spend = memberSpend(joins);
  const typicalJoins = user ? monthlyJoinRate(spend.joins, user.createdAt) : 4;

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Join fees & passes</p>
        <h1 className="display-lg mt-2 text-balance text-content">Pay for what you go to.</h1>
        <p className="lede mt-4">
          Every meetup carries a join fee the host sets — usually between ₹49 and ₹499, covering the court, the day
          pass or the food. A pass just buys those joins up front, at a lower price each.
        </p>
      </header>

      {PAYMENT_MODE === 'demo' && (
        <p className="mt-8 rounded-2xl border border-signal/40 bg-signal/10 p-4 text-sm text-content/80">
          <strong className="font-semibold text-content">Demo gateway.</strong> No Razorpay keys are configured on
          this deployment, so checkout completes without a real charge. Add{' '}
          <code className="rounded bg-content/10 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_RAZORPAY_KEY_ID</code> and{' '}
          <code className="rounded bg-content/10 px-1.5 py-0.5 text-xs">RAZORPAY_KEY_SECRET</code> to switch to live
          payments.
        </p>
      )}

      <div className="mt-10">
        <PassCalculator
          currentPass={user?.pass}
          defaultJoins={typicalJoins}
          defaultFeeCents={spend.typicalFeeCents}
        />
      </div>

      <div className="mt-10">
        <PassGrid passes={PASSES} user={user} />
      </div>

      <section className="mt-16" aria-labelledby="notes-heading">
        <h2 id="notes-heading" className="display-md text-content">
          The small print, in plain words
        </h2>
        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          {NOTES.map((note) => (
            <div key={note.q} className="surface-card p-6">
              <dt className="font-display text-base font-bold text-content">{note.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-content/70">{note.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
