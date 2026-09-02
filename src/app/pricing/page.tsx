import type { Metadata } from 'next';
import { PLANS } from '@/lib/constants';
import { PlanCard } from '@/components/dinners/plan-card';
import { getCurrentUser } from '@/lib/auth/session';
import { Faq } from '@/components/home/faq';

export const metadata: Metadata = {
  title: 'Membership',
  description: 'Pay per seat or take a membership — four plans, cancel whenever.',
};

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <>
      <section className="bg-canvas py-16 text-content sm:py-20">
        <div className="container-page max-w-3xl text-center">
          <p className="eyebrow">Membership</p>
          <h1 className="display-lg mt-3 text-content">Pay for the table, not the app.</h1>
          <p className="lede mx-auto mt-5 max-w-xl text-content/70">
            Reviews and the directory are free forever. Membership is only for the dinners — and it brings the per-seat
            price down every week you use it.
          </p>
        </div>
      </section>

      <section className="container-page -mt-10 pb-4">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} currentPlan={user?.plan ?? null} signedIn={Boolean(user)} />
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-content/60">
          Prices include the reservation fee. Food and drink are always settled directly with the venue.
        </p>
      </section>

      <Faq />
    </>
  );
}
