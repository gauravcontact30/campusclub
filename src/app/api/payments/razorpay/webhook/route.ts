import { NextResponse, type NextRequest } from 'next/server';
import { verifyWebhookSignature } from '@/lib/payments/razorpay';
import { RAZORPAY_WEBHOOK_SECRET } from '@/lib/payments/config';
import { getPaymentByOrderId, markPaymentStatus } from '@/lib/data/payments';
import { commitJoin } from '@/lib/data/joins';
import { grantPass } from '@/lib/auth/session';
import { passById } from '@/lib/constants';
import { withLogging } from '@/lib/admin/with-logging';

// Signature verification needs the raw bytes, and node:crypto needs Node.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The safety net behind the browser handback. If someone pays and then closes
 * the tab before `confirmJoinAction` runs, this is what still gives them the
 * spot they paid for.
 *
 * Both paths are idempotent: whichever arrives second finds the payment already
 * `paid` and `commitJoin` returns the existing join instead of a duplicate.
 */
async function handlePOST(request: NextRequest) {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Webhooks are not configured.' }, { status: 501 });
  }

  const signature = request.headers.get('x-razorpay-signature');
  if (!signature) return NextResponse.json({ message: 'Missing signature.' }, { status: 400 });

  // Read the body as text, never as JSON — re-serialising changes the bytes the
  // signature was computed over and every verification would fail.
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ message: 'Bad signature.' }, { status: 401 });
  }

  let event: { event?: string; payload?: Record<string, { entity?: Record<string, unknown> }> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ message: 'Body was not JSON.' }, { status: 400 });
  }

  const entity = event.payload?.payment?.entity ?? event.payload?.order?.entity ?? {};
  const orderId = String(entity.order_id ?? entity.id ?? '');
  if (!orderId) return NextResponse.json({ ok: true, ignored: 'no order id' });

  const payment = await getPaymentByOrderId(orderId);
  if (!payment) return NextResponse.json({ ok: true, ignored: 'unknown order' });

  if (event.event === 'payment.failed') {
    await markPaymentStatus(orderId, 'failed');
    return NextResponse.json({ ok: true });
  }

  if (event.event !== 'payment.captured' && event.event !== 'order.paid') {
    return NextResponse.json({ ok: true, ignored: event.event ?? 'unknown event' });
  }

  if (payment.status !== 'paid') {
    await markPaymentStatus(orderId, 'paid', String(entity.id ?? ''));
  }

  if (payment.purpose === 'join' && payment.meetupId) {
    await commitJoin({
      userId: payment.userId,
      meetupId: payment.meetupId,
      amountCents: payment.amountCents,
      paymentId: payment.id,
    }).catch(() => undefined);
  }

  if (payment.purpose === 'pass' && payment.passId) {
    await grantPass(payment.userId, payment.passId, passById(payment.passId)?.credits ?? 0);
  }

  return NextResponse.json({ ok: true });
}

/** Wrapped so every call lands in the Super Admin API log. */
export const POST = withLogging(handlePOST, 'Payment webhook');
