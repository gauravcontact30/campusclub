import { describe, expect, it } from 'vitest';
import type { JoinWithMeetup, MeetupWithHost } from '@/types';
import {
  breakEvenJoins,
  cheapestPassFor,
  comparePasses,
  hostEarnings,
  memberSpend,
  projectedTake,
} from '@/lib/economics';
import { PASSES } from '@/lib/constants';

/* Minimal fixtures — only the fields the maths actually reads. */
function meetup(overrides: Partial<MeetupWithHost> = {}): MeetupWithHost {
  const startsAt = new Date(Date.now() + 86_400_000).toISOString();
  return {
    id: 'm1',
    joinFeeCents: 14900,
    spotsTotal: 8,
    spotsTaken: 0,
    startsAt,
    endsAt: new Date(+new Date(startsAt) + 5_400_000).toISOString(),
    ...overrides,
  } as MeetupWithHost;
}

function join(overrides: Partial<JoinWithMeetup> = {}): JoinWithMeetup {
  return {
    id: 'j1',
    meetupId: 'm1',
    userId: 'u1',
    status: 'confirmed',
    spotNumber: 1,
    amountCents: 14900,
    paymentId: 'pay-1',
    createdAt: new Date().toISOString(),
    meetup: meetup(),
    ...overrides,
  } as JoinWithMeetup;
}

describe('hostEarnings', () => {
  it('sums what members actually paid', () => {
    const e = hostEarnings([
      join({ id: 'a', userId: 'u1', amountCents: 14900 }),
      join({ id: 'b', userId: 'u2', amountCents: 14900 }),
    ]);
    expect(e.directCents).toBe(29800);
    expect(e.totalCents).toBe(29800);
    expect(e.confirmedJoins).toBe(2);
  });

  it('credits the host the full fee when a pass covered the join', () => {
    // The join row records 0 — the member paid nothing at the door — but the
    // host is still owed the fee, settled out of pass revenue.
    const e = hostEarnings([join({ amountCents: 0, paymentId: 'credit' })]);
    expect(e.creditCents).toBe(14900);
    expect(e.creditJoins).toBe(1);
    expect(e.directCents).toBe(0);
    expect(e.totalCents).toBe(14900);
  });

  it('counts a waitlisted join as worth nothing', () => {
    const e = hostEarnings([
      join({ id: 'a', amountCents: 14900 }),
      join({ id: 'b', userId: 'u2', status: 'waitlisted', amountCents: 0, paymentId: null }),
    ]);
    expect(e.totalCents).toBe(14900);
    expect(e.waitlisted).toBe(1);
    expect(e.confirmedJoins).toBe(1);
  });

  it('ignores cancelled joins entirely', () => {
    const e = hostEarnings([join({ status: 'cancelled', amountCents: 14900 })]);
    expect(e.totalCents).toBe(0);
  });

  it('splits what has been earned from what is still pending', () => {
    const past = new Date(Date.now() - 172_800_000).toISOString();
    const e = hostEarnings([
      join({ id: 'a', amountCents: 10000, meetup: meetup({ startsAt: past, endsAt: past }) }),
      join({ id: 'b', userId: 'u2', amountCents: 5000 }),
    ]);
    expect(e.settledCents).toBe(10000);
    expect(e.pendingCents).toBe(5000);
  });

  it('counts people rather than joins', () => {
    const e = hostEarnings([
      join({ id: 'a', userId: 'u1', meetupId: 'm1' }),
      join({ id: 'b', userId: 'u1', meetupId: 'm2' }),
    ]);
    expect(e.confirmedJoins).toBe(2);
    expect(e.uniqueMembers).toBe(1);
  });
});

describe('projectedTake', () => {
  it('is the fee times the spots, because there is no commission', () => {
    const t = projectedTake(14900, 8, 3);
    expect(t.ifItFills).toBe(119200);
    expect(t.soFar).toBe(44700);
    expect(t.remaining).toBe(74500);
  });

  it('never reports negative headroom on an oversold meetup', () => {
    expect(projectedTake(10000, 4, 6).remaining).toBe(0);
  });
});

describe('memberSpend', () => {
  it('separates what was charged from what a credit covered', () => {
    const s = memberSpend([
      join({ id: 'a', amountCents: 14900 }),
      join({ id: 'b', amountCents: 0, paymentId: 'credit' }),
    ]);
    expect(s.paidCents).toBe(14900);
    expect(s.coveredCents).toBe(14900);
    expect(s.joins).toBe(2);
  });

  it('falls back to a mid-band fee for somebody with no history', () => {
    expect(memberSpend([]).typicalFeeCents).toBe(14900);
  });

  it('averages the fees actually joined', () => {
    const s = memberSpend([
      join({ id: 'a', meetup: meetup({ joinFeeCents: 10000 }) }),
      join({ id: 'b', meetup: meetup({ joinFeeCents: 20000 }) }),
    ]);
    expect(s.typicalFeeCents).toBe(15000);
  });
});

describe('comparePasses', () => {
  it('recommends pay as you go for somebody who barely goes', () => {
    expect(cheapestPassFor(1, 14900)).toBe('payg');
    expect(cheapestPassFor(2, 14900)).toBe('payg');
  });

  it('recommends a pass once the frequency justifies it', () => {
    // Ten joins at ₹149 is ₹1,490 at the door; Regular is ₹799 flat.
    expect(cheapestPassFor(10, 14900)).toBe('regular');
  });

  it('recommends unlimited for somebody who is out constantly', () => {
    expect(cheapestPassFor(20, 14900)).toBe('unlimited');
  });

  it('charges the door price for joins beyond the credits', () => {
    const starter = comparePasses(6, 10000).find((r) => r.pass.id === 'starter')!;
    // 4 credits cover four; the other two are paid at ₹100 each.
    expect(starter.overflowCents).toBe(20000);
    expect(starter.monthlyCents).toBe(starter.pass.priceCents + 20000);
  });

  it('never charges overflow on unlimited', () => {
    const unlimited = comparePasses(30, 49900).find((r) => r.pass.id === 'unlimited')!;
    expect(unlimited.overflowCents).toBe(0);
    expect(unlimited.monthlyCents).toBe(unlimited.pass.priceCents);
  });

  it('marks exactly one option cheapest', () => {
    for (const joins of [0, 1, 3, 5, 9, 14, 20]) {
      const marked = comparePasses(joins, 19900).filter((r) => r.cheapest);
      expect(marked, `joins=${joins}`).toHaveLength(1);
    }
  });

  it('costs nothing on any option when somebody goes nowhere', () => {
    const rows = comparePasses(0, 14900);
    expect(rows.find((r) => r.pass.id === 'payg')!.monthlyCents).toBe(0);
    expect(rows.every((r) => r.perJoinCents === null)).toBe(true);
    // At zero joins the free option must win — a paid pass covering nothing
    // is never the cheapest answer.
    expect(rows.find((r) => r.cheapest)!.pass.priceCents).toBe(0);
  });

  it('reports a saving that agrees with the pay-as-you-go row', () => {
    const rows = comparePasses(8, 14900);
    const payg = rows.find((r) => r.pass.id === 'payg')!;
    for (const row of rows) {
      expect(row.savesCents).toBe(payg.monthlyCents - row.monthlyCents);
    }
  });
});

describe('breakEvenJoins', () => {
  it('has no break-even for the free option', () => {
    expect(breakEvenJoins('payg', 14900)).toBeNull();
  });

  it('finds the first frequency at which a pass wins', () => {
    const at = breakEvenJoins('starter', 14900);
    expect(at).not.toBeNull();
    const starter = PASSES.find((p) => p.id === 'starter')!;
    // One below the break-even, paying at the door is still cheaper.
    expect((at! - 1) * 14900).toBeLessThanOrEqual(starter.priceCents);
    expect(at! * 14900).toBeGreaterThan(starter.priceCents);
  });
});
