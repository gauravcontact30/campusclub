import type { PassId, Payment, UserProfile } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { adminReadClient } from './client';
import { db } from '@/lib/data/store';
import { PASSES } from '@/lib/constants';

/**
 * The commercial half of the dashboard: what came in, and who is on a pass.
 *
 * Revenue is read from `payments` rather than from joins, because a join
 * covered by a pass credit takes no money — counting joins would overstate
 * income by exactly the number of credits people spent.
 */

export interface RevenueSummary {
  /** Only `paid` rows. Created and failed orders are not income. */
  totalCents: number;
  joinFeesCents: number;
  passSalesCents: number;
  refundedCents: number;
  paidCount: number;
  failedCount: number;
  pendingCount: number;
  /** Newest first, for the chart and the table. */
  byDay: { day: string; cents: number; count: number }[];
  recent: Payment[];
}

export interface SubscriberSummary {
  totalMembers: number;
  /** Members holding anything other than pay-as-you-go. */
  subscribers: number;
  byPass: { id: PassId; name: string; members: number; priceCents: number; mrrCents: number }[];
  /** Monthly recurring revenue implied by who currently holds what. */
  mrrCents: number;
  creditsOutstanding: number;
}

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

async function allPayments(): Promise<Payment[]> {
  if (isSupabaseConfigured()) {
    const supabase = await adminReadClient();
    if (supabase) {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);
      return (data ?? []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        userId: String(row.user_id),
        provider: String(row.provider) as Payment['provider'],
        purpose: String(row.purpose) as Payment['purpose'],
        orderId: String(row.order_id),
        gatewayPaymentId: (row.gateway_payment_id as string | null) ?? null,
        amountCents: Number(row.amount_cents ?? 0),
        currency: String(row.currency ?? 'INR'),
        status: String(row.status) as Payment['status'],
        meetupId: (row.meetup_id as string | null) ?? null,
        passId: (row.pass_id as PassId | null) ?? null,
        createdAt: String(row.created_at),
      }));
    }
  }
  return [...db().payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function allMembers(): Promise<Pick<UserProfile, 'id' | 'pass' | 'credits' | 'createdAt'>[]> {
  if (isSupabaseConfigured()) {
    const supabase = await adminReadClient();
    if (supabase) {
      const { data } = await supabase.from('profiles').select('id, pass, credits, created_at');
      return (data ?? []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        pass: (row.pass as PassId) ?? 'payg',
        credits: Number(row.credits ?? 0),
        createdAt: String(row.created_at),
      }));
    }
  }
  return db().users.map((u) => ({ id: u.id, pass: u.pass, credits: u.credits, createdAt: u.createdAt }));
}

/* ------------------------------------------------------------------ */
/* Aggregating                                                         */
/* ------------------------------------------------------------------ */

export function summariseRevenue(payments: Payment[], days = 14): RevenueSummary {
  const paid = payments.filter((p) => p.status === 'paid');

  const byDay = new Map<string, { cents: number; count: number }>();
  // Seed the window with zeroes so a quiet day is a gap in the chart rather
  // than a missing bar that silently shortens the axis.
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    byDay.set(day, { cents: 0, count: 0 });
  }
  for (const payment of paid) {
    const day = payment.createdAt.slice(0, 10);
    const row = byDay.get(day);
    if (!row) continue; // older than the window
    row.cents += payment.amountCents;
    row.count += 1;
  }

  return {
    totalCents: paid.reduce((sum, p) => sum + p.amountCents, 0),
    joinFeesCents: paid.filter((p) => p.purpose === 'join').reduce((s, p) => s + p.amountCents, 0),
    passSalesCents: paid.filter((p) => p.purpose === 'pass').reduce((s, p) => s + p.amountCents, 0),
    refundedCents: payments
      .filter((p) => p.status === 'refunded')
      .reduce((s, p) => s + p.amountCents, 0),
    paidCount: paid.length,
    failedCount: payments.filter((p) => p.status === 'failed').length,
    pendingCount: payments.filter((p) => p.status === 'created').length,
    byDay: [...byDay.entries()].map(([day, v]) => ({ day, ...v })),
    recent: payments.slice(0, 12),
  };
}

export function summariseSubscribers(
  members: Pick<UserProfile, 'id' | 'pass' | 'credits' | 'createdAt'>[],
): SubscriberSummary {
  const byPass = PASSES.map((pass) => {
    const holders = members.filter((m) => m.pass === pass.id);
    return {
      id: pass.id,
      name: pass.name,
      members: holders.length,
      priceCents: pass.priceCents,
      // Pay-as-you-go carries no recurring revenue however many people hold it.
      mrrCents: pass.id === 'payg' ? 0 : holders.length * pass.priceCents,
    };
  });

  return {
    totalMembers: members.length,
    subscribers: members.filter((m) => m.pass !== 'payg').length,
    byPass,
    mrrCents: byPass.reduce((sum, row) => sum + row.mrrCents, 0),
    creditsOutstanding: members.reduce((sum, m) => sum + m.credits, 0),
  };
}

export async function getRevenueSummary(days = 14): Promise<RevenueSummary> {
  return summariseRevenue(await allPayments(), days);
}

export async function getSubscriberSummary(): Promise<SubscriberSummary> {
  return summariseSubscribers(await allMembers());
}

/** New members per day over the window — the growth line. */
export function signupsByDay(
  members: Pick<UserProfile, 'createdAt'>[],
  days = 14,
): { day: string; count: number }[] {
  const byDay = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    byDay.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), 0);
  }
  for (const member of members) {
    const day = member.createdAt.slice(0, 10);
    if (byDay.has(day)) byDay.set(day, byDay.get(day)! + 1);
  }
  return [...byDay.entries()].map(([day, count]) => ({ day, count }));
}

export async function getSignupsByDay(days = 14) {
  return signupsByDay(await allMembers(), days);
}
