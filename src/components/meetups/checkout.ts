'use client';

import type { CheckoutTicket } from '@/lib/payments/types';

/** What a completed checkout hands back for server-side verification. */
export interface CheckoutResult {
  gatewayPaymentId: string;
  signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (p: unknown) => void) => void };
  }
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** Loaded once, on demand — no third-party script on pages that never pay. */
function loadRazorpay(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Opens the gateway and resolves with what it handed back, or null if the
 * member dismissed it.
 *
 * With no Razorpay keys configured the server issues a `demo` ticket and this
 * resolves immediately with a stand-in reference. That path is labelled
 * everywhere it is visible, and the server refuses it the moment real keys
 * exist — so it can never be used to skip a real payment.
 */
export async function runCheckout(
  ticket: CheckoutTicket,
  member: { name: string; email: string },
): Promise<CheckoutResult | null> {
  if (ticket.provider === 'demo') {
    return { gatewayPaymentId: `pay_demo_${ticket.orderId.slice(-8)}`, signature: 'demo' };
  }

  const ready = await loadRazorpay();
  if (!ready || !window.Razorpay) throw new Error('The payment window could not load. Check your connection.');

  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: ticket.keyId,
      order_id: ticket.orderId,
      amount: ticket.amountCents,
      currency: ticket.currency,
      name: ticket.name,
      description: ticket.description,
      prefill: { name: member.name, email: member.email },
      theme: { color: '#C22E17' },
      modal: { ondismiss: () => resolve(null) },
      handler: (response: Record<string, string>) =>
        resolve({
          gatewayPaymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }),
    });
    rzp.on('payment.failed', () => resolve(null));
    rzp.open();
  });
}
