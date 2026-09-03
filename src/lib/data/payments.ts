import type { Payment, PaymentPurpose, PaymentStatus, PassId } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isRazorpayConfigured } from '@/lib/payments/config';
import { createRazorpayOrder } from '@/lib/payments/razorpay';
import { CURRENCY } from '@/lib/constants';
import { db, nextId } from './store';

type Row = Record<string, unknown>;

function fromRow(row: Row): Payment {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    provider: (String(row.provider) as Payment['provider']),
    purpose: (String(row.purpose) as PaymentPurpose),
    orderId: String(row.order_id),
    gatewayPaymentId: (row.gateway_payment_id as string | null) ?? null,
    amountCents: Number(row.amount_cents ?? 0),
    currency: String(row.currency ?? CURRENCY.code),
    status: (String(row.status) as PaymentStatus),
    meetupId: (row.meetup_id as string | null) ?? null,
    passId: (row.pass_id as PassId | null) ?? null,
    createdAt: String(row.created_at),
  };
}

/**
 * Opens an order with the gateway and records it as `created`. Nothing is
 * confirmed here — a payment only becomes `paid` once a signature verifies,
 * which is the one thing a client cannot forge.
 */
export async function openPayment(input: {
  userId: string;
  purpose: PaymentPurpose;
  amountCents: number;
  meetupId?: string | null;
  passId?: PassId | null;
}): Promise<Payment> {
  const id = nextId('pay');
  const live = isRazorpayConfigured();

  const orderId = live
    ? (
        await createRazorpayOrder({
          amountCents: input.amountCents,
          currency: CURRENCY.code,
          receipt: id,
          notes: {
            purpose: input.purpose,
            meetup_id: input.meetupId ?? '',
            pass_id: input.passId ?? '',
          },
        })
      ).id
    : `order_demo_${id}`;

  const payment: Payment = {
    id,
    userId: input.userId,
    provider: live ? 'razorpay' : 'demo',
    purpose: input.purpose,
    orderId,
    gatewayPaymentId: null,
    amountCents: input.amountCents,
    currency: CURRENCY.code,
    status: 'created',
    meetupId: input.meetupId ?? null,
    passId: input.passId ?? null,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          id: payment.id,
          user_id: payment.userId,
          provider: payment.provider,
          purpose: payment.purpose,
          order_id: payment.orderId,
          amount_cents: payment.amountCents,
          currency: payment.currency,
          status: payment.status,
          meetup_id: payment.meetupId,
          pass_id: payment.passId,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return fromRow(data);
    }
  }

  db().payments.push(payment);
  return payment;
}

export async function getPaymentByOrderId(orderId: string): Promise<Payment | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.from('payments').select('*').eq('order_id', orderId).maybeSingle();
    return data ? fromRow(data) : null;
  }
  return db().payments.find((p) => p.orderId === orderId) ?? null;
}

export async function markPaymentStatus(
  orderId: string,
  status: PaymentStatus,
  gatewayPaymentId?: string,
): Promise<Payment | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from('payments')
      .update({ status, gateway_payment_id: gatewayPaymentId ?? null })
      .eq('order_id', orderId)
      .select('*')
      .maybeSingle();
    return data ? fromRow(data) : null;
  }
  const payment = db().payments.find((p) => p.orderId === orderId);
  if (!payment) return null;
  payment.status = status;
  if (gatewayPaymentId) payment.gatewayPaymentId = gatewayPaymentId;
  return payment;
}

export async function getPaymentsForUser(userId: string): Promise<Payment[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(fromRow);
  }
  return db()
    .payments.filter((p) => p.userId === userId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}
