import { createHmac, timingSafeEqual } from 'node:crypto';
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } from './config';

const API = 'https://api.razorpay.com/v1';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

function authHeader() {
  return `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`;
}

/**
 * Creates an order. `amount` is in the smallest currency unit — paise — which is
 * also how the whole app stores money, so nothing is converted on the way in.
 */
export async function createRazorpayOrder(input: {
  amountCents: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const response = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: authHeader() },
    body: JSON.stringify({
      amount: input.amountCents,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes ?? {},
      // Razorpay dedupes on receipt when this is set, which makes a retried
      // checkout reuse the same order rather than charging twice.
      payment_capture: 1,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Razorpay rejected the order (${response.status}): ${detail.slice(0, 200)}`);
  }

  return (await response.json()) as RazorpayOrder;
}

/** Constant-time compare — a plain `===` on a signature leaks timing. */
function safeEqual(a: string, b: string) {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Checkout handback: Razorpay signs `order_id|payment_id` with the key secret.
 * Nothing is marked paid until this passes.
 */
export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  if (!RAZORPAY_KEY_SECRET) return false;
  const expected = createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest('hex');
  return safeEqual(expected, input.signature);
}

/**
 * Webhook: the signature covers the *raw* request body, so the caller must pass
 * the untouched text — re-serialising parsed JSON changes the bytes and fails.
 */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  if (!RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}
