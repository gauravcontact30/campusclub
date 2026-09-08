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
 * shown in the price column rather than buried in the perks.
 */
function perJoin(pass: Pass) {
  if (!pass.credits || pass.priceCents === 0) return null;
  return formatMoney(Math.round(pass.priceCents / pass.credits));
}

/** What the stub says: the count is the thing you are actually buying. */
function stub(pass: Pass) {
  if (pass.credits === null) return { count: '∞', unit: 'no limit' };
  return { count: String(pass.credits), unit: pass.credits === 1 ? 'join a month' : 'joins a month' };
}

/**
 * Four equal columns is the shape of a subscription business, and this is not
 * one: the product's own copy says the default is paying at the door and that
 * most people should never hold a pass. Drawn as four tiers, that sentence is
 * contradicted by the layout before anybody reads it.
 *
 * So pay-as-you-go comes out of the comparison and sits above it as the
 * baseline — dashed, unpriced, and with no call to action unless you hold a
 * pass and could actually switch back. The three passes below are drawn as
 * what they literally are: tickets, with the credit count punched into the
 * stub. `.pass` is already how every meetup on the site is drawn, so the thing
 * you buy and the thing you spend it on finally look related.
 */
export function PassGrid({ passes, user }: { passes: Pass[]; user: UserProfile | null }) {
  const [pending, startTransition] = useTransition();
  const toast = useUiStore((s) => s.pushToast);
  const router = useRouter();

  const payg = passes.find((p) => p.id === 'payg');
  const tiers = passes.filter((p) => p.id !== 'payg');
  const onPayg = !user?.pass || user.pass === 'payg';

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
    <div className="space-y-4">
      {payg && (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-5 rounded-2xl border border-dashed border-content/30 px-6 py-6 sm:px-7">
          <div className="min-w-0 flex-1 basis-72">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="font-display text-lg font-semibold text-content">{payg.name}</h3>
              {onPayg && (
                <span className="rounded-full bg-content/10 px-2.5 py-0.5 text-xs font-semibold text-content/70">
                  What you are on now
                </span>
              )}
            </div>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-content/65">
              No pass and no monthly charge. You pay each meetup&rsquo;s join fee and nothing else &mdash; which is the
              right answer for most people reading this page.
            </p>
          </div>

          <p className="font-display text-2xl font-semibold text-content">
            &#8377;0 <span className="font-sans text-sm font-normal text-content/55">a month</span>
          </p>

          {!onPayg && user && (
            <Button variant="outline" disabled={pending} onClick={() => choose(payg.id)}>
              Switch back to this
            </Button>
          )}
        </div>
      )}

      <ul className="space-y-4">
        {tiers.map((pass) => {
          const current = user?.pass === pass.id;
          const unit = perJoin(pass);
          const { count, unit: countUnit } = stub(pass);

          return (
            <li
              key={pass.id}
              className={cn(
                'pass flex [--stub:5.5rem] sm:[--stub:8.5rem]',
                pass.highlight && 'border-brand/45',
                current && 'border-brand',
              )}
            >
              <span className="pass-notch" aria-hidden />

              <div
                className={cn(
                  'flex w-[var(--stub)] shrink-0 flex-col items-center justify-center px-3 py-8 text-center',
                  pass.highlight ? 'bg-brand/10' : 'bg-canvas-600/70',
                )}
              >
                <span className="font-display text-[2.6rem] font-semibold leading-none tabular-nums text-content">
                  {count}
                </span>
                <span className="mt-2 text-[0.72rem] leading-tight text-content/60">{countUnit}</span>
              </div>

              <div className="grid min-w-0 flex-1 gap-6 p-6 sm:p-7 lg:grid-cols-[1fr_13rem] lg:items-center lg:gap-8">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h3 className="font-display text-xl font-semibold text-content">{pass.name}</h3>
                    {pass.highlight && !current && (
                      <span className="rounded-full border border-brand/40 bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                        Most chosen
                      </span>
                    )}
                    {current && (
                      <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-on-brand">
                        Your pass
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-content/65">{pass.tagline}</p>

                  <ul className="mt-5 grid gap-x-7 gap-y-2.5 sm:grid-cols-2">
                    {pass.perks.map((perk) => (
                      <li key={perk} className="flex gap-2.5 text-sm leading-snug text-content/75">
                        <Check size={15} className="mt-0.5 shrink-0 text-brand" aria-hidden />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-content/10 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  <p className="font-display text-3xl font-semibold leading-none text-content">
                    {formatMoney(pass.priceCents)}
                  </p>
                  <p className="mt-1.5 text-sm text-content/55">{pass.cadence}</p>
                  <p className="mt-3 text-sm font-medium text-signal-600">
                    {unit ? `${unit} a join` : 'no per-join cost'}
                  </p>

                  <Button
                    full
                    className="mt-5"
                    variant={pass.highlight ? 'primary' : 'outline'}
                    disabled={pending || current}
                    onClick={() => choose(pass.id)}
                  >
                    {current ? 'Active' : `Get ${pass.name}`}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
