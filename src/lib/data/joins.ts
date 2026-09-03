import type { Join, JoinStatus, JoinWithMeetup, MeetupWithHost, UserProfile } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { FREE_CANCELLATION_HOURS } from '@/lib/constants';
import { db, nextId } from './store';
import { getMeetupById, getMeetupsByIds } from './meetups';

type Row = Record<string, unknown>;

function fromRow(row: Row): Join {
  return {
    id: String(row.id),
    meetupId: String(row.meetup_id),
    userId: String(row.user_id),
    status: (String(row.status) as JoinStatus),
    spotNumber: Number(row.spot_number ?? 1),
    amountCents: Number(row.amount_cents ?? 0),
    paymentId: (row.payment_id as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function getJoin(userId: string, meetupId: string): Promise<Join | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from('joins')
      .select('*')
      .eq('user_id', userId)
      .eq('meetup_id', meetupId)
      .neq('status', 'cancelled')
      .maybeSingle();
    return data ? fromRow(data) : null;
  }
  return (
    db().joins.find((j) => j.userId === userId && j.meetupId === meetupId && j.status !== 'cancelled') ?? null
  );
}

export async function getJoinsForUser(userId: string): Promise<JoinWithMeetup[]> {
  let joins: Join[];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase.from('joins').select('*').eq('user_id', userId);
    joins = (data ?? []).map(fromRow);
  } else {
    joins = db().joins.filter((j) => j.userId === userId);
  }

  const meetups = await getMeetupsByIds([...new Set(joins.map((j) => j.meetupId))]);
  const byId = new Map(meetups.map((m) => [m.id, m]));

  return joins
    .map((j) => {
      const meetup = byId.get(j.meetupId);
      return meetup ? { ...j, meetup } : null;
    })
    .filter((j): j is JoinWithMeetup => j !== null)
    .sort((a, b) => +new Date(a.meetup.startsAt) - +new Date(b.meetup.startsAt));
}

/** Who is coming — what a host sees on their own meetup. */
export async function getAttendees(meetupId: string): Promise<{ name: string; avatarUrl: string | null; status: JoinStatus }[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from('joins_with_member')
      .select('*')
      .eq('meetup_id', meetupId)
      .neq('status', 'cancelled');
    return (data ?? []).map((r: Row) => ({
      name: String(r.full_name ?? 'A member'),
      avatarUrl: (r.avatar_url as string | null) ?? null,
      status: String(r.status) as JoinStatus,
    }));
  }
  const store = db();
  return store.joins
    .filter((j) => j.meetupId === meetupId && j.status !== 'cancelled')
    .map((j) => {
      const user = store.users.find((u) => u.id === j.userId);
      return { name: user?.fullName ?? 'A member', avatarUrl: user?.avatarUrl ?? null, status: j.status };
    });
}

/* ------------------------------------------------------------------ */
/* Writing a join                                                      */
/* ------------------------------------------------------------------ */

export class JoinError extends Error {}

/**
 * Records the join once the money question is settled — either a pass credit
 * covered it, or a payment has been verified as `paid`. Never call this from a
 * client-facing path without one of those two being true.
 */
export async function commitJoin(input: {
  userId: string;
  meetupId: string;
  amountCents: number;
  paymentId: string | null;
}): Promise<Join> {
  const meetup = await getMeetupById(input.meetupId);
  if (!meetup) throw new JoinError('That meetup no longer exists.');
  if (new Date(meetup.startsAt) < new Date()) throw new JoinError('That meetup has already started.');

  const existing = await getJoin(input.userId, input.meetupId);
  if (existing) return existing;

  // A full meetup still accepts you — onto the waitlist, and the fee is only
  // taken when a spot opens, which is why waitlisted joins record amount 0.
  const full = meetup.spotsTaken >= meetup.spotsTotal;
  const status: JoinStatus = full ? 'waitlisted' : 'confirmed';

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new JoinError('Database unavailable.');
    const { data, error } = await supabase
      .from('joins')
      .insert({
        meetup_id: input.meetupId,
        user_id: input.userId,
        status,
        spot_number: meetup.spotsTaken + 1,
        amount_cents: full ? 0 : input.amountCents,
        payment_id: full ? null : input.paymentId,
      })
      .select('*')
      .single();
    if (error) throw new JoinError(error.message);
    if (!full) await supabase.rpc('increment_spots_taken', { p_meetup_id: input.meetupId });
    return fromRow(data);
  }

  const store = db();
  const join: Join = {
    id: nextId('join'),
    meetupId: input.meetupId,
    userId: input.userId,
    status,
    spotNumber: meetup.spotsTaken + 1,
    amountCents: full ? 0 : input.amountCents,
    paymentId: full ? null : input.paymentId,
    createdAt: new Date().toISOString(),
  };
  store.joins.push(join);
  if (!full) {
    const target = store.meetups.find((m) => m.id === input.meetupId);
    if (target) target.spotsTaken += 1;
  }
  return join;
}

/** True when the member can still cancel and get their money back. */
export function isRefundable(startsAt: string, now = new Date()) {
  const hoursOut = (new Date(startsAt).getTime() - now.getTime()) / 3_600_000;
  return hoursOut >= FREE_CANCELLATION_HOURS;
}

export async function cancelJoin(userId: string, joinId: string): Promise<{ refunded: boolean }> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { refunded: false };
    const { data } = await supabase
      .from('joins')
      .select('*, meetups(starts_at)')
      .eq('id', joinId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!data) return { refunded: false };
    const startsAt = String((data.meetups as Row | null)?.starts_at ?? new Date().toISOString());
    const refunded = isRefundable(startsAt) && String(data.status) === 'confirmed';
    await supabase.from('joins').update({ status: 'cancelled' }).eq('id', joinId).eq('user_id', userId);
    if (String(data.status) === 'confirmed') {
      await supabase.rpc('decrement_spots_taken', { p_meetup_id: String(data.meetup_id) });
    }
    if (refunded && data.payment_id) {
      await supabase.from('payments').update({ status: 'refunded' }).eq('id', String(data.payment_id));
    }
    return { refunded };
  }

  const store = db();
  const join = store.joins.find((j) => j.id === joinId && j.userId === userId);
  if (!join || join.status === 'cancelled') return { refunded: false };

  const meetup = store.meetups.find((m) => m.id === join.meetupId);
  const refunded = join.status === 'confirmed' && Boolean(meetup) && isRefundable(meetup!.startsAt);

  if (join.status === 'confirmed' && meetup) meetup.spotsTaken = Math.max(0, meetup.spotsTaken - 1);
  join.status = 'cancelled';

  if (refunded) {
    if (join.paymentId === 'credit') {
      const user = store.users.find((u) => u.id === userId);
      if (user) user.credits += 1;
    } else if (join.paymentId) {
      const payment = store.payments.find((p) => p.id === join.paymentId);
      if (payment) payment.status = 'refunded';
    }
  }
  return { refunded };
}

/* ------------------------------------------------------------------ */
/* Passes and credits                                                  */
/* ------------------------------------------------------------------ */

/** Unlimited never decrements; everyone else needs a credit in the bank. */
export function passCoversJoin(user: Pick<UserProfile, 'pass' | 'credits'>) {
  return user.pass === 'unlimited' || user.credits > 0;
}

export async function spendCredit(userId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return false;
    const { data, error } = await supabase.rpc('spend_join_credit', { p_user_id: userId });
    return !error && Boolean(data);
  }
  const user = db().users.find((u) => u.id === userId);
  if (!user) return false;
  if (user.pass === 'unlimited') return true;
  if (user.credits <= 0) return false;
  user.credits -= 1;
  return true;
}

/* ------------------------------------------------------------------ */
/* Host view                                                           */
/* ------------------------------------------------------------------ */

/** Meetups the member has joined that have already happened. */
export async function getPastJoins(userId: string): Promise<JoinWithMeetup[]> {
  const all = await getJoinsForUser(userId);
  const now = Date.now();
  return all.filter((j) => +new Date(j.meetup.endsAt) < now).reverse();
}

export async function getUpcomingJoins(userId: string): Promise<JoinWithMeetup[]> {
  const all = await getJoinsForUser(userId);
  const now = Date.now();
  return all.filter((j) => j.status !== 'cancelled' && +new Date(j.meetup.endsAt) >= now);
}

/**
 * The rule behind every rating on the site: only somebody whose join was
 * confirmed, on a meetup that has already finished, may say how it went.
 *
 * It lives here rather than in the page so the form, the server action and the
 * RLS policy are all describing the same rule — and so a React Server Component
 * is not reading the clock during render.
 */
export async function hasAttended(userId: string, meetupId: string, now = new Date()): Promise<boolean> {
  const joins = await getJoinsForUser(userId);
  return joins.some(
    (j) => j.meetupId === meetupId && j.status === 'confirmed' && new Date(j.meetup.endsAt) < now,
  );
}

/** Convenience for the home page: "you are going to three things this week". */
export async function getNextJoin(userId: string): Promise<MeetupWithHost | null> {
  const [next] = await getUpcomingJoins(userId);
  return next?.meetup ?? null;
}
