'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser, grantPass } from '@/lib/auth/session';
import { getMeetupById } from '@/lib/data/meetups';
import { cancelJoin, commitJoin, getJoin, JoinError, passCoversJoin, spendCredit } from '@/lib/data/joins';
import { getPaymentByOrderId, markPaymentStatus, openPayment } from '@/lib/data/payments';
import { isRazorpayConfigured, RAZORPAY_KEY_ID } from '@/lib/payments/config';
import { verifyCheckoutSignature } from '@/lib/payments/razorpay';
import { passById, PASSES, SITE } from '@/lib/constants';
import type { CheckoutTicket } from '@/lib/payments/types';
import type { ActionResult, PassId } from '@/types';

/**
 * `provider: 'demo'` on a ticket means no gateway keys are configured — the UI
 * then shows an explicitly labelled stand-in instead of pretending a card was
 * charged.
 */
export type JoinOutcome =
  | { kind: 'joined'; status: 'confirmed' | 'waitlisted' }
  | { kind: 'checkout'; ticket: CheckoutTicket };

/* ------------------------------------------------------------------ */
/* Joining a meetup                                                    */
/* ------------------------------------------------------------------ */

/**
 * Step one of the only transaction in the product. Three things can happen:
 *
 *  • the meetup is free, or full (waitlist), or a pass credit covers it —
 *    the join is written here and there is nothing to pay;
 *  • otherwise an order is opened and the client is handed a checkout ticket.
 *
 * The join itself is never written on the strength of a client claim — see
 * `confirmJoinAction`, which is the only path that turns money into a spot.
 */
export async function startJoinAction(meetupId: string): Promise<ActionResult<JoinOutcome>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to join this meetup.' };

  const meetup = await getMeetupById(meetupId);
  if (!meetup) return { ok: false, message: 'That meetup no longer exists.' };
  if (meetup.hostId === user.id) return { ok: false, message: 'You are hosting this one.' };

  const already = await getJoin(user.id, meetupId);
  if (already) return { ok: true, data: { kind: 'joined', status: already.status as 'confirmed' | 'waitlisted' } };

  const full = meetup.spotsTaken >= meetup.spotsTotal;

  // Waitlisting is always free — the fee is only taken if a spot opens up.
  if (full || meetup.joinFeeCents === 0) {
    try {
      const join = await commitJoin({ userId: user.id, meetupId, amountCents: 0, paymentId: null });
      revalidateJoin(meetup.slug);
      return { ok: true, data: { kind: 'joined', status: join.status as 'confirmed' | 'waitlisted' } };
    } catch (error) {
      return { ok: false, message: error instanceof JoinError ? error.message : 'Could not join.' };
    }
  }

  // A pass credit is spent before the join is written, so a failure here costs
  // the member nothing rather than taking a credit for a spot they did not get.
  if (passCoversJoin(user)) {
    const spent = await spendCredit(user.id);
    if (spent) {
      try {
        const join = await commitJoin({ userId: user.id, meetupId, amountCents: 0, paymentId: 'credit' });
        revalidateJoin(meetup.slug);
        return { ok: true, data: { kind: 'joined', status: join.status as 'confirmed' | 'waitlisted' } };
      } catch (error) {
        return { ok: false, message: error instanceof JoinError ? error.message : 'Could not join.' };
      }
    }
  }

  const payment = await openPayment({
    userId: user.id,
    purpose: 'join',
    amountCents: meetup.joinFeeCents,
    meetupId,
  });

  return {
    ok: true,
    data: {
      kind: 'checkout',
      ticket: {
        provider: payment.provider,
        orderId: payment.orderId,
        amountCents: payment.amountCents,
        currency: payment.currency,
        keyId: isRazorpayConfigured() ? RAZORPAY_KEY_ID : '',
        name: SITE.name,
        description: meetup.title,
      },
    },
  };
}

/**
 * Step two: the gateway has handed back a payment id and a signature. The
 * signature is checked against the key secret server-side — it is the only
 * thing standing between a POST and a free spot — and only then is the payment
 * marked paid and the join written.
 */
export async function confirmJoinAction(input: {
  orderId: string;
  gatewayPaymentId: string;
  signature: string;
}): Promise<ActionResult<{ status: 'confirmed' | 'waitlisted' }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to finish joining.' };

  const payment = await getPaymentByOrderId(input.orderId);
  if (!payment) return { ok: false, message: 'We could not find that order.' };
  if (payment.userId !== user.id) return { ok: false, message: 'That order belongs to someone else.' };
  if (payment.purpose !== 'join' || !payment.meetupId) {
    return { ok: false, message: 'That order was not for a meetup.' };
  }

  // Idempotent: a double-submit (or a webhook racing the browser) finds the
  // payment already paid and returns the existing join rather than a second one.
  if (payment.status !== 'paid') {
    const verified =
      payment.provider === 'razorpay'
        ? verifyCheckoutSignature({
            orderId: input.orderId,
            paymentId: input.gatewayPaymentId,
            signature: input.signature,
          })
        : // Demo gateway. Only reachable when no Razorpay keys are configured,
          // so it can never weaken a live install.
          !isRazorpayConfigured();

    if (!verified) {
      await markPaymentStatus(input.orderId, 'failed');
      return { ok: false, message: 'We could not verify that payment. Nothing has been charged.' };
    }
    await markPaymentStatus(input.orderId, 'paid', input.gatewayPaymentId);
  }

  const meetup = await getMeetupById(payment.meetupId);
  try {
    const join = await commitJoin({
      userId: user.id,
      meetupId: payment.meetupId,
      amountCents: payment.amountCents,
      paymentId: payment.id,
    });
    if (meetup) revalidateJoin(meetup.slug);
    return { ok: true, data: { status: join.status as 'confirmed' | 'waitlisted' } };
  } catch (error) {
    return { ok: false, message: error instanceof JoinError ? error.message : 'Could not join.' };
  }
}

export async function cancelJoinAction(joinId: string): Promise<ActionResult<{ refunded: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in first.' };

  const { refunded } = await cancelJoin(user.id, joinId);
  revalidatePath('/my-meetups');
  revalidatePath('/', 'layout');
  return {
    ok: true,
    data: { refunded },
    message: refunded ? 'Cancelled — your fee is on its way back.' : 'Cancelled. Too close to the start for a refund.',
  };
}

/* ------------------------------------------------------------------ */
/* Buying a pass                                                       */
/* ------------------------------------------------------------------ */

export async function startPassAction(passId: PassId): Promise<ActionResult<JoinOutcome>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Create an account to pick a pass.' };

  const pass = passById(passId);
  if (!pass) return { ok: false, message: 'That pass does not exist.' };

  // Pay-as-you-go costs nothing, so there is nothing to check out.
  if (pass.priceCents === 0) {
    await grantPass(user.id, pass.id, 0);
    revalidatePath('/passes');
    revalidatePath('/profile');
    return { ok: true, data: { kind: 'joined', status: 'confirmed' } };
  }

  const payment = await openPayment({
    userId: user.id,
    purpose: 'pass',
    amountCents: pass.priceCents,
    passId: pass.id,
  });

  return {
    ok: true,
    data: {
      kind: 'checkout',
      ticket: {
        provider: payment.provider,
        orderId: payment.orderId,
        amountCents: payment.amountCents,
        currency: payment.currency,
        keyId: isRazorpayConfigured() ? RAZORPAY_KEY_ID : '',
        name: SITE.name,
        description: `${pass.name} pass`,
      },
    },
  };
}

export async function confirmPassAction(input: {
  orderId: string;
  gatewayPaymentId: string;
  signature: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to finish.' };

  const payment = await getPaymentByOrderId(input.orderId);
  if (!payment || payment.userId !== user.id) return { ok: false, message: 'We could not find that order.' };
  if (payment.purpose !== 'pass' || !payment.passId) return { ok: false, message: 'That order was not for a pass.' };

  if (payment.status !== 'paid') {
    const verified =
      payment.provider === 'razorpay'
        ? verifyCheckoutSignature({
            orderId: input.orderId,
            paymentId: input.gatewayPaymentId,
            signature: input.signature,
          })
        : !isRazorpayConfigured();

    if (!verified) {
      await markPaymentStatus(input.orderId, 'failed');
      return { ok: false, message: 'We could not verify that payment. Nothing has been charged.' };
    }
    await markPaymentStatus(input.orderId, 'paid', input.gatewayPaymentId);
  }

  const pass = PASSES.find((p) => p.id === payment.passId);
  await grantPass(user.id, payment.passId, pass?.credits ?? 0);
  revalidatePath('/passes');
  revalidatePath('/profile');
  revalidatePath('/', 'layout');
  return { ok: true, message: `${pass?.name ?? 'Your pass'} is active.` };
}

function revalidateJoin(slug: string) {
  revalidatePath(`/meetups/${slug}`);
  revalidatePath('/meetups');
  revalidatePath('/my-meetups');
  revalidatePath('/');
}
