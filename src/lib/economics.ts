import type { JoinWithMeetup, Pass, PassId } from '@/types';
import { PASSES } from '@/lib/constants';

/**
 * The money maths for both sides of the marketplace, in one place.
 *
 * Every figure the product quotes — what a host has earned, what a member has
 * spent, which pass is actually cheapest for them — comes from here rather
 * than being recomputed inline on a page. Pure functions over rows, so the
 * arithmetic is unit-testable without a database.
 */

/* ------------------------------------------------------------------ */
/* The host's side                                                     */
/* ------------------------------------------------------------------ */

export interface HostEarnings {
  /** Fees members paid directly, on joins that were confirmed. */
  directCents: number;
  /**
   * Joins covered by a pass credit. The member paid nothing at the door, but
   * the host is still owed the meetup's fee — CampusClub settles those out of
   * pass revenue, so they are earnings, just from a different pocket.
   */
  creditCents: number;
  creditJoins: number;
  /** Everything the host has earned, however it was funded. */
  totalCents: number;
  /** Earned on meetups that have not run yet, so not yet paid out. */
  pendingCents: number;
  /** Earned on meetups that have finished. */
  settledCents: number;
  confirmedJoins: number;
  waitlisted: number;
  /** Distinct members who have ever joined one of their meetups. */
  uniqueMembers: number;
}

/**
 * A waitlisted join is deliberately worth nothing here: it holds a place but
 * has not been charged, and counting it would overstate what a host is owed.
 */
export function hostEarnings(joins: JoinWithMeetup[], now = new Date()): HostEarnings {
  const confirmed = joins.filter((j) => j.status === 'confirmed');

  let directCents = 0;
  let creditCents = 0;
  let creditJoins = 0;
  let pendingCents = 0;
  let settledCents = 0;

  for (const join of confirmed) {
    // A credit-covered join records an amount of zero, so the fee has to come
    // from the meetup rather than from the row.
    const isCredit = join.paymentId === 'credit';
    const earned = isCredit ? join.meetup.joinFeeCents : join.amountCents;

    if (isCredit) {
      creditCents += earned;
      creditJoins += 1;
    } else {
      directCents += earned;
    }

    if (new Date(join.meetup.endsAt) < now) settledCents += earned;
    else pendingCents += earned;
  }

  return {
    directCents,
    creditCents,
    creditJoins,
    totalCents: directCents + creditCents,
    pendingCents,
    settledCents,
    confirmedJoins: confirmed.length,
    waitlisted: joins.filter((j) => j.status === 'waitlisted').length,
    uniqueMembers: new Set(confirmed.map((j) => j.userId)).size,
  };
}

/** What one meetup is worth to its host at the fee and size they have chosen. */
export function projectedTake(joinFeeCents: number, spotsTotal: number, spotsTaken = 0) {
  return {
    ifItFills: joinFeeCents * spotsTotal,
    soFar: joinFeeCents * spotsTaken,
    remaining: joinFeeCents * Math.max(0, spotsTotal - spotsTaken),
  };
}

/* ------------------------------------------------------------------ */
/* The member's side                                                   */
/* ------------------------------------------------------------------ */

export interface MemberSpend {
  /** Actually charged to a card or UPI. */
  paidCents: number;
  /** Covered by a pass credit — what the pass saved at the door. */
  coveredCents: number;
  joins: number;
  /** Mean fee across everything they have joined, for the pass calculator. */
  typicalFeeCents: number;
}

export function memberSpend(joins: JoinWithMeetup[]): MemberSpend {
  const real = joins.filter((j) => j.status !== 'cancelled');
  const paidCents = real.reduce((sum, j) => sum + j.amountCents, 0);
  const coveredCents = real
    .filter((j) => j.paymentId === 'credit')
    .reduce((sum, j) => sum + j.meetup.joinFeeCents, 0);
  const fees = real.map((j) => j.meetup.joinFeeCents).filter((f) => f > 0);

  return {
    paidCents,
    coveredCents,
    joins: real.length,
    // A member with no history yet gets the middle of the usual band rather
    // than a zero that would make every pass look infinitely good.
    typicalFeeCents: fees.length ? Math.round(fees.reduce((a, b) => a + b, 0) / fees.length) : 14900,
  };
}

/**
 * How often this member actually goes, per month, from their join history.
 *
 * Takes `now` as a parameter rather than reading the clock inline so that a
 * Server Component can call it without calling an impure function during
 * render — the same reason `isRefundable` is shaped this way.
 */
export function monthlyJoinRate(joinCount: number, memberSince: string, now = new Date()): number {
  if (joinCount <= 0) return 4;
  const months = Math.max(1, Math.round((now.getTime() - new Date(memberSince).getTime()) / (30 * 86_400_000)));
  return Math.max(1, Math.round(joinCount / months));
}

/* ------------------------------------------------------------------ */
/* Which pass is actually worth it                                     */
/* ------------------------------------------------------------------ */

export interface PassCost {
  pass: Pass;
  /** What a month costs on this pass at the given frequency. */
  monthlyCents: number;
  /** Join fees still payable beyond what the credits cover. */
  overflowCents: number;
  /** Effective price per join. `null` when they would not go at all. */
  perJoinCents: number | null;
  /** Against paying as you go. Negative means this pass costs more. */
  savesCents: number;
  cheapest: boolean;
}

/**
 * The honest version of a pricing page: given how often somebody actually
 * goes and what they typically pay, work out what each option would cost them
 * this month and mark the cheapest.
 *
 * It will frequently recommend pay-as-you-go, which is the point — a
 * calculator that always finds a reason to upsell is not a calculator.
 */
export function comparePasses(joinsPerMonth: number, typicalFeeCents: number): PassCost[] {
  const joins = Math.max(0, joinsPerMonth);
  const paygCents = joins * typicalFeeCents;

  const rows = PASSES.map((pass) => {
    // `credits: null` is unlimited; anything else covers that many joins and
    // the rest are paid at the door.
    const covered = pass.credits === null ? joins : Math.min(joins, pass.credits);
    const overflowCents = (joins - covered) * typicalFeeCents;
    const monthlyCents = pass.priceCents + overflowCents;

    return {
      pass,
      monthlyCents,
      overflowCents,
      perJoinCents: joins > 0 ? Math.round(monthlyCents / joins) : null,
      savesCents: paygCents - monthlyCents,
      cheapest: false,
    };
  });

  const best = Math.min(...rows.map((r) => r.monthlyCents));
  // Ties go to the cheaper subscription — at equal cost, no commitment wins,
  // and `PASSES` lists pay-as-you-go first.
  const winner = rows.find((r) => r.monthlyCents === best);
  if (winner) winner.cheapest = true;

  return rows;
}

export function cheapestPassFor(joinsPerMonth: number, typicalFeeCents: number): PassId {
  return comparePasses(joinsPerMonth, typicalFeeCents).find((r) => r.cheapest)!.pass.id;
}

/** The frequency at which a pass first beats paying per meetup. */
export function breakEvenJoins(passId: PassId, typicalFeeCents: number): number | null {
  const pass = PASSES.find((p) => p.id === passId);
  if (!pass || pass.priceCents === 0 || typicalFeeCents <= 0) return null;

  for (let joins = 1; joins <= 40; joins++) {
    const covered = pass.credits === null ? joins : Math.min(joins, pass.credits);
    const monthly = pass.priceCents + (joins - covered) * typicalFeeCents;
    if (monthly < joins * typicalFeeCents) return joins;
  }
  return null;
}
