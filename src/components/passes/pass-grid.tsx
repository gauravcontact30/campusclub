'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import type { Pass, PassId, UserProfile } from '@/types';
import { confirmPassAction, startPassAction } from '@/app/actions/joins';
import { runCheckout } from '@/components/meetups/checkout';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/ui-store';
import { cn, formatMoney } from '@/lib/utils';

/**
 * Passes are pre-bought joins, so the honest way to compare them is per join —
 * shown next to the headline price rather than buried in the perks.
 */
function perJoin(pass: Pass) {
  if (!pass.credits || pass.priceCents === 0) return null;
  return formatMoney(Math.round(pass.priceCents / pass.credits));
}

export function PassGrid({ passes, user }: { passes: Pass[]; user: UserProfile | null }) {
  const [pending, startTransition] = useTransition();
  const toast = useUiStore((s) => s.pushToast);
  const router = useRouter();

  function choose(passId: PassId) {
    if (!user) {
      router.push('/signup?next=/passes');
      return;
    }

    startTransition(async () => {
      const opened = await startPassAction(passId);
      if (!opened.ok || !opened.data) {
        toast({ title: opened.message ?? 'Could not start that.', tone: 'error' });
        return;
      }

      if (opened.data.kind === 'joined') {
        toast({ title: 'Switched to pay as you go.', tone: 'success' });
        router.refresh();
        return;
      }

      let result;
      try {
        result = await runCheckout(opened.data.ticket, { name: user.fullName, email: user.email });
      } catch (error) {
        toast({ title: error instanceof Error ? error.message : 'Payment failed.', tone: 'error' });
        return;
      }
      if (!result) return;

      const confirmed = await confirmPassAction({
        orderId: opened.data.ticket.orderId,
        gatewayPaymentId: result.gatewayPaymentId,
        signature: result.signature,
      });
      toast({
        title: confirmed.message ?? (confirmed.ok ? 'Pass active.' : 'Could not confirm that payment.'),
        tone: confirmed.ok ? 'success' : 'error',
      });
      if (confirmed.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-4">
      {passes.map((pass) => {
        const current = user?.pass === pass.id;
        const unit = perJoin(pass);

        return (
          <div
            key={pass.id}
            className={cn(
              'surface-card flex flex-col p-6',
              pass.highlight && 'border-brand/45 shadow-glow',
              current && 'ring-2 ring-brand',
            )}
          >
            {pass.highlight && (
              <span className="mb-3 inline-flex w-fit rounded-full bg-brand px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-on-brand">
                Most chosen
              </span>
            )}

            <h2 className="font-display text-xl font-bold text-content">{pass.name}</h2>
            <p className="mt-1 text-sm text-content/65">{pass.tagline}</p>

            <p className="mt-5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-bold text-content">
                {pass.priceCents === 0 ? 'Free' : formatMoney(pass.priceCents)}
              </span>
              <span className="text-sm text-content/55">{pass.cadence}</span>
            </p>
            <p className="mt-1 h-5 text-xs font-medium text-signal-600">
              {unit ? `works out at ${unit} a join` : pass.id === 'unlimited' ? 'no per-join cost' : ''}
            </p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {pass.perks.map((perk) => (
                <li key={perk} className="flex gap-2.5 text-sm text-content/75">
                  <Check size={15} className="mt-0.5 shrink-0 text-brand" />
                  {perk}
                </li>
              ))}
            </ul>

            <Button
              full
              className="mt-6"
              variant={pass.highlight ? 'primary' : 'outline'}
              disabled={pending || current}
              onClick={() => choose(pass.id)}
            >
              {current ? 'Your current pass' : pass.priceCents === 0 ? 'Switch to this' : `Get ${pass.name}`}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
