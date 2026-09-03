/**
 * Razorpay is optional. With keys present the join flow opens a real Checkout;
 * without them it falls back to a clearly-labelled demo gateway so the whole
 * product stays clickable on a fresh clone.
 *
 * Only the key *id* is ever public — the secret and the webhook secret are read
 * on the server and never reach a client bundle.
 */
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? '';
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

export function isRazorpayConfigured() {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

export const PAYMENT_MODE = isRazorpayConfigured() ? 'razorpay' : 'demo';
