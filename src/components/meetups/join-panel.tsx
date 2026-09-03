'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, Info, Ticket, Users } from 'lucide-react';
import type { JoinStatus, MeetupWithHost, UserProfile } from '@/types';
import { confirmJoinAction, startJoinAction } from '@/app/actions/joins';
import { runCheckout } from './checkout';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/ui-store';
import { FREE_CANCELLATION_HOURS } from '@/lib/constants';
import { cn, formatFee, formatMoney, hasStarted, spotsState } from '@/lib/utils';

/**
 * The one transaction in the product. Three states are possible before a click:
 * a pass credit covers it, the meetup is free or full, or the member pays the
 * join fee — and the panel says which of those it is *before* they commit,
 * rather than surprising them inside a gateway modal.
 */
export function JoinPanel({
  meetup,
  user,
  existingStatus,
  className,
}: {
  meetup: MeetupWithHost;
  user: UserProfile | null;
  existingStatus: JoinStatus | null;
  className?: string;
}) {
  const [status, setStatus] = useState<JoinStatus | null>(existingStatus);
  const [pending, startTransition] = useTransition();
  const toast = useUiStore((s) => s.pushToast);
  const router = useRouter();

  const spots = spotsState(meetup.spotsTaken, meetup.spotsTotal);
  const alreadyRan = hasStarted(meetup.startsAt);
  const isHost = user?.id === meetup.hostId;
  const creditCovers = Boolean(user && (user.pass === 'unlimited' || user.credits > 0));
  const payable = !spots.full && meetup.joinFeeCents > 0 && !creditCovers;

  function join() {
    if (!user) {
      router.push(`/login?next=/meetups/${meetup.slug}`);
      return;
    }

    startTransition(async () => {
      const opened = await startJoinAction(meetup.id);
      if (!opened.ok || !opened.data) {
        toast({ title: opened.message ?? 'Could not start that.', tone: 'error' });
        return;
      }

      if (opened.data.kind === 'joined') {
        setStatus(opened.data.status);
        toast({
          title: opened.data.status === 'waitlisted' ? 'You are on the waitlist.' : 'You are in.',
          description:
            opened.data.status === 'waitlisted'
              ? 'We will email you the moment a spot opens — nothing is charged until it does.'
              : 'It is in your meetups. See you there.',
          tone: 'success',
        });
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
      // Dismissed the gateway. The order stays `created` and expires — nothing
      // was charged, so there is nothing to say beyond leaving the button as it was.
      if (!result) return;

      const confirmed = await confirmJoinAction({
        orderId: opened.data.ticket.orderId,
        gatewayPaymentId: result.gatewayPaymentId,
        signature: result.signature,
      });

      if (!confirmed.ok || !confirmed.data) {
        toast({ title: confirmed.message ?? 'We could not confirm that payment.', tone: 'error' });
        return;
      }

      setStatus(confirmed.data.status);
      toast({ title: 'You are in.', description: 'Paid and confirmed. It is in your meetups.', tone: 'success' });
      router.refresh();
    });
  }

  return (
    <div className={cn('surface-card sticky top-24 space-y-4 p-6', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-bold text-content">{formatFee(meetup.joinFeeCents)}</p>
          <p className="text-sm text-content/60">
            {meetup.joinFeeCents === 0 ? 'Free to join' : 'per person, one meetup'}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
            spots.full
              ? 'border-content/20 bg-content/8 text-content/70'
              : spots.scarce
                ? 'border-signal/40 bg-signal/15 text-signal-600'
                : 'border-brand/35 bg-brand/12 text-brand-700',
          )}
        >
          <Users size={13} />
          {spots.full ? 'Full' : spots.label}
        </span>
      </div>

      <div className="meter" role="presentation">
        <div
          className={cn('meter-fill', spots.full && 'bg-content/40', spots.scarce && 'bg-signal')}
          style={{ width: `${Math.round(spots.fraction * 100)}%` }}
        />
      </div>

      {status ? (
        <div className="animate-stamp rounded-2xl border border-brand/35 bg-brand/10 p-4">
          <p className="flex items-center gap-2 font-semibold text-content">
            <Check size={16} className="text-brand" />
            {status === 'waitlisted' ? 'You are on the waitlist' : 'You are going'}
          </p>
          <p className="mt-1 text-sm text-content/70">
            {status === 'waitlisted'
              ? 'Nothing has been charged. We will email you if a spot opens up.'
              : 'The details are in your meetups, along with the exact address.'}
          </p>
          <Link href="/my-meetups" className="link-underline mt-3 inline-block text-sm font-semibold text-content">
            Go to your meetups
          </Link>
        </div>
      ) : isHost ? (
        <p className="rounded-2xl border border-content/15 bg-content/5 p-4 text-sm text-content/70">
          You are hosting this one. Manage it from{' '}
          <Link href="/my-meetups" className="link-underline font-semibold text-content">
            your meetups
          </Link>
          .
        </p>
      ) : alreadyRan ? (
        <p className="rounded-2xl border border-content/15 bg-content/5 p-4 text-sm text-content/70">
          This one has already started. Have a look at what else is on this week.
        </p>
      ) : (
        <>
          <Button full size="lg" onClick={join} disabled={pending}>
            {pending
              ? 'One moment…'
              : !user
                ? 'Sign in to join'
                : spots.full
                  ? 'Join the waitlist'
                  : creditCovers
                    ? 'Use one pass credit'
                    : meetup.joinFeeCents === 0
                      ? 'Join — free'
                      : `Join for ${formatFee(meetup.joinFeeCents)}`}
          </Button>

          {/* Say what the click will actually do, before it happens. */}
          <p className="flex items-start gap-2 text-xs leading-relaxed text-content/60">
            <Info size={13} className="mt-0.5 shrink-0 text-content/45" />
            {spots.full
              ? 'The waitlist is free. You are only charged if a spot opens and you take it.'
              : creditCovers
                ? user?.pass === 'unlimited'
                  ? 'Your Unlimited pass covers this — nothing to pay.'
                  : `One of your ${user?.credits} pass credits covers this — nothing to pay.`
                : payable
                  ? `You will be charged ${formatMoney(meetup.joinFeeCents)} once, now.`
                  : 'No card needed for this one.'}
          </p>
        </>
      )}

      <ul className="space-y-2 border-t border-content/10 pt-4 text-xs text-content/60">
        <li className="flex items-center gap-2">
          <Clock size={13} className="text-content/45" />
          Free cancellation up to {FREE_CANCELLATION_HOURS} hours before it starts.
        </li>
        <li className="flex items-center gap-2">
          <Ticket size={13} className="text-content/45" />
          {meetup.joinFeeCents > 0 ? 'A pass makes this cheaper — ' : 'Passes cover paid meetups — '}
          <Link href="/passes" className="link-underline font-semibold text-content">
            see passes
          </Link>
        </li>
      </ul>
    </div>
  );
}
