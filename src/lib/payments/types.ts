/**
 * Shared by the server action that opens an order and the client that runs the
 * checkout. It lives here rather than in the action module because a
 * `'use server'` file may only export async functions — a type exported from
 * one is erased at compile time, but the boundary is clearer kept separate.
 */
export interface CheckoutTicket {
  provider: 'razorpay' | 'demo';
  orderId: string;
  amountCents: number;
  currency: string;
  keyId: string;
  name: string;
  description: string;
}
