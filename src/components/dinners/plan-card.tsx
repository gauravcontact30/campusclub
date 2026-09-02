'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import type { SubscriptionPlan, SubscriptionPlanId } from '@/types';
import { choosePlanAction } from '@/app/actions/auth';
import { useUiStore } from '@/store/ui-store';
import { Button } from '@/components/ui/button';
import { cn, formatMoney } from '@/lib/utils';

export function PlanCard({
  plan,
  currentPlan,
  signedIn,
}: {
  plan: SubscriptionPlan;
  currentPlan: SubscriptionPlanId | null;
  signedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const pushToast = useUiStore((s) => s.pushToast);
  const router = useRouter();
  const isCurrent = currentPlan === plan.id;

  function select() {
    if (!signedIn) {
      router.push(`/signup?next=/pricing`);
      return;
    }
    startTransition(async () => {
      const result = await choosePlanAction(plan.id);
      pushToast({
        title: result.ok ? `You are on ${plan.name}.` : result.message ?? 'Could not switch plan',
        tone: result.ok ? 'success' : 'error',
      });
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-4xl border p-7 transition-transform hover:-translate-y-1',
        plan.highlight ? 'border-orchid/60 bg-noir-600 text-frost shadow-lift' : 'border-frost/12 bg-noir-700',
      )}
    >
      {plan.highlight && (
        <span className="mb-4 w-fit rounded-full bg-orchid px-3 py-1 text-xs font-semibold text-frost">
          Most popular
        </span>
      )}

      <h3 className="font-display text-2xl font-semibold">{plan.name}</h3>
      <p className={cn('mt-1.5 text-sm', plan.highlight ? 'text-frost/65' : 'text-frost/60')}>{plan.tagline}</p>

      <p className="mt-6">
        <span className="font-display text-4xl font-semibold">
          {plan.priceCents === 0 ? 'Free' : formatMoney(plan.priceCents)}
        </span>
        <span className={cn('ml-1.5 text-sm', plan.highlight ? 'text-frost/60' : 'text-frost/55')}>{plan.cadence}</span>
      </p>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2.5 text-sm">
            <Check size={16} className={cn('mt-0.5 shrink-0', plan.highlight ? 'text-orchid' : 'text-parrot-600')} />
            <span className={plan.highlight ? 'text-frost/85' : 'text-frost/75'}>{perk}</span>
          </li>
        ))}
      </ul>

      <Button
        className="mt-7"
        full
        size="lg"
        // The outline variant is dark-on-dark inside the highlighted card.
        variant={isCurrent ? (plan.highlight ? 'secondary' : 'outline') : plan.highlight ? 'primary' : 'dark'}
        onClick={select}
        disabled={pending || isCurrent}
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : isCurrent ? 'Your current plan' : `Choose ${plan.name}`}
      </Button>
    </div>
  );
}
