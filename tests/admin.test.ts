import { beforeEach, describe, expect, it } from 'vitest';
import type { AdminEvent, Payment } from '@/types';
import { SERVER_VISITOR, isSuperAdmin, isTrackablePath, labelForPath, shortVisitor } from '@/lib/admin/config';
import {
  activeVisitorIds,
  apiHealth,
  countActiveVisitors,
  filterEvents,
  listEvents,
  recentEvents,
  recordEvent,
  toSessions,
  topPages,
} from '@/lib/admin/events';
import { signupsByDay, summariseRevenue, summariseSubscribers } from '@/lib/admin/metrics';
import { db, resetDb } from '@/lib/data/store';

beforeEach(() => {
  resetDb();
});

/* ------------------------------------------------------------------ */
/* The gate                                                            */
/* ------------------------------------------------------------------ */

describe('isSuperAdmin', () => {
  it('recognises the owner', () => {
    expect(isSuperAdmin({ email: 'garvcontact30@gmail.com' })).toBe(true);
  });

  it('ignores case and surrounding space, which a login form will produce', () => {
    expect(isSuperAdmin({ email: '  GarvContact30@Gmail.com ' })).toBe(true);
  });

  it('refuses everybody else, including near-misses', () => {
    for (const email of [
      'aarav@example.com',
      '',
      'garvcontact30@gmail.com.evil.com',
      'xgarvcontact30@gmail.com',
    ]) {
      expect(isSuperAdmin({ email }), email).toBe(false);
    }
  });

  it('refuses a missing user rather than throwing', () => {
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });
});

describe('path handling', () => {
  it('never tracks the dashboard itself', () => {
    // Otherwise reading the log fills the log, and the live figures mostly
    // report the admin looking at them.
    expect(isTrackablePath('/admin')).toBe(false);
    expect(isTrackablePath('/admin/api-logs')).toBe(false);
    expect(isTrackablePath('/api/telemetry')).toBe(false);
    expect(isTrackablePath('/_next/static/x.js')).toBe(false);
  });

  it('tracks real pages', () => {
    expect(isTrackablePath('/meetups')).toBe(true);
    // A path that merely starts with the same letters is not the dashboard.
    expect(isTrackablePath('/administrators')).toBe(true);
  });

  it('collapses many URLs into the feature they belong to', () => {
    expect(labelForPath('/meetups/6am-court-mumbai')).toBe('Meetup detail');
    expect(labelForPath('/meetups/6am-court-mumbai/feedback')).toBe('Leave feedback');
    expect(labelForPath('/meetups')).toBe('Browse the board');
    expect(labelForPath('/')).toBe('Home');
  });
});

/* ------------------------------------------------------------------ */
/* Recording                                                           */
/* ------------------------------------------------------------------ */

describe('recordEvent', () => {
  it('stores a trackable event', async () => {
    await recordEvent({ kind: 'page', path: '/meetups', visitorId: 'v-1' });
    expect(db().events).toHaveLength(1);
    expect(db().events[0].label).toBe('Browse the board');
  });

  it('drops events on ignored paths', async () => {
    await recordEvent({ kind: 'page', path: '/admin/revenue', visitorId: 'v-1' });
    expect(db().events).toHaveLength(0);
  });

  it('is queryable through listEvents with filters', async () => {
    await recordEvent({ kind: 'api', path: '/api/chat', visitorId: 'v-1', status: 500, outcome: 'fail' });
    await recordEvent({ kind: 'api', path: '/api/meetups', visitorId: 'v-2', status: 200 });

    const failures = await listEvents({ kind: 'api', outcome: 'fail' });
    expect(failures.total).toBe(1);
    expect(failures.items[0].path).toBe('/api/chat');
  });

  it('only returns events inside the window asked for', async () => {
    await recordEvent({ kind: 'page', path: '/meetups', visitorId: 'v-1' });
    // Backdate it past the window.
    db().events[0].occurredAt = new Date(Date.now() - 90 * 60_000).toISOString();

    expect(await recentEvents(60)).toHaveLength(0);
    expect(await recentEvents(60 * 24)).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* Aggregating                                                         */
/* ------------------------------------------------------------------ */

function event(overrides: Partial<AdminEvent> = {}): AdminEvent {
  return {
    id: Math.random().toString(36).slice(2),
    occurredAt: new Date().toISOString(),
    kind: 'page',
    path: '/meetups',
    label: 'Browse the board',
    method: null,
    status: null,
    durationMs: null,
    outcome: 'success',
    message: null,
    userId: null,
    userEmail: null,
    visitorId: 'v-1',
    referrer: null,
    ...overrides,
  };
}

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

describe('active visitors', () => {
  it('counts people, not page views', () => {
    const events = [
      event({ visitorId: 'v-1' }),
      event({ visitorId: 'v-1' }),
      event({ visitorId: 'v-2' }),
    ];
    expect(countActiveVisitors(events, 5).visitors).toBe(2);
  });

  it('excludes anyone outside the window', () => {
    const events = [event({ visitorId: 'v-1' }), event({ visitorId: 'v-2', occurredAt: minutesAgo(30) })];
    expect(countActiveVisitors(events, 5).visitors).toBe(1);
    expect(activeVisitorIds(events, 5).has('v-2')).toBe(false);
  });

  it('counts signed-in members separately from visitors', () => {
    const events = [
      event({ visitorId: 'v-1', userId: 'u1' }),
      event({ visitorId: 'v-2' }),
      // Same member on a second device is one member, two visitors.
      event({ visitorId: 'v-3', userId: 'u1' }),
    ];
    const active = countActiveVisitors(events, 5);
    expect(active.visitors).toBe(3);
    expect(active.signedIn).toBe(1);
  });
});

describe('toSessions', () => {
  it('rolls a visitor’s events into one journey, most recent first', () => {
    const events = [
      event({ visitorId: 'v-1', path: '/', label: 'Home', occurredAt: minutesAgo(9) }),
      event({ visitorId: 'v-1', path: '/meetups', label: 'Browse the board', occurredAt: minutesAgo(6) }),
      event({ visitorId: 'v-1', path: '/passes', label: 'Passes & pricing', occurredAt: minutesAgo(2) }),
    ];

    const [session] = toSessions(events);
    expect(session.pageViews).toBe(3);
    expect(session.path.map((p) => p.label)).toEqual([
      'Passes & pricing',
      'Browse the board',
      'Home',
    ]);
  });

  it('attributes a session to whoever signed in during it, not to the first event', () => {
    // Almost every session starts anonymous and only gains an identity at the
    // sign-in step; taking the first event's identity would leave every
    // session anonymous forever.
    const events = [
      event({ visitorId: 'v-1', occurredAt: minutesAgo(9) }),
      event({
        visitorId: 'v-1',
        path: '/login',
        occurredAt: minutesAgo(5),
        userId: 'u1',
        userEmail: 'aarav@example.com',
      }),
    ];

    const [session] = toSessions(events);
    expect(session.userEmail).toBe('aarav@example.com');
  });

  it('does not count API calls as page views', () => {
    const events = [
      event({ visitorId: 'v-1' }),
      event({ visitorId: 'v-1', kind: 'api', path: '/api/chat' }),
    ];
    expect(toSessions(events)[0].pageViews).toBe(1);
  });
});

describe('topPages', () => {
  it('separates views from the number of people who made them', () => {
    const events = [
      event({ visitorId: 'v-1', label: 'Home' }),
      event({ visitorId: 'v-1', label: 'Home' }),
      event({ visitorId: 'v-2', label: 'Home' }),
      event({ visitorId: 'v-3', label: 'Passes & pricing' }),
    ];

    const [first] = topPages(events);
    expect(first.label).toBe('Home');
    expect(first.views).toBe(3);
    expect(first.visitors).toBe(2);
  });
});

describe('apiHealth', () => {
  it('treats a 4xx as an alert and a 5xx as a failure', () => {
    // A wall of 401s is not the server failing, but it is exactly what an
    // admin needs to see — so the two are counted apart.
    const events = [
      event({ kind: 'api', status: 200, durationMs: 10 }),
      event({ kind: 'api', status: 401, outcome: 'alert', durationMs: 12 }),
      event({ kind: 'api', status: 500, outcome: 'fail', durationMs: 30 }),
    ];

    const health = apiHealth(events);
    expect(health.total).toBe(3);
    expect(health.failed).toBe(1);
    expect(health.alerts).toBe(1);
    expect(health.successRate).toBe(66.7);
  });

  it('ignores page views when measuring the API', () => {
    expect(apiHealth([event({ kind: 'page' })]).total).toBe(0);
  });

  it('reports a perfect rate rather than NaN when nothing has been called', () => {
    expect(apiHealth([]).successRate).toBe(100);
  });

  it('withholds p95 until there are enough calls to mean anything', () => {
    const few = Array.from({ length: 5 }, () => event({ kind: 'api', durationMs: 10 }));
    expect(apiHealth(few).p95Ms).toBeNull();

    const many = Array.from({ length: 40 }, () => event({ kind: 'api', durationMs: 10 }));
    expect(apiHealth(many).p95Ms).not.toBeNull();
  });
});

describe('filterEvents', () => {
  it('searches path, label and the signed-in email', () => {
    const events = [
      event({ path: '/api/chat', label: 'Assistant' }),
      event({ path: '/meetups', label: 'Browse the board', userEmail: 'nisha@example.com' }),
    ];

    expect(filterEvents(events, { search: 'assistant' })).toHaveLength(1);
    expect(filterEvents(events, { search: 'nisha@' })).toHaveLength(1);
    expect(filterEvents(events, { search: '/api' })).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

function payment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: Math.random().toString(36).slice(2),
    userId: 'u1',
    provider: 'demo',
    purpose: 'join',
    orderId: 'o1',
    gatewayPaymentId: null,
    amountCents: 10000,
    currency: 'INR',
    status: 'paid',
    meetupId: 'm1',
    passId: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('summariseRevenue', () => {
  it('counts only paid rows as income', () => {
    // An order that was created and never captured is not revenue, and
    // counting it would overstate takings on every dashboard refresh.
    const summary = summariseRevenue([
      payment({ amountCents: 10000, status: 'paid' }),
      payment({ amountCents: 50000, status: 'created' }),
      payment({ amountCents: 90000, status: 'failed' }),
    ]);

    expect(summary.totalCents).toBe(10000);
    expect(summary.pendingCount).toBe(1);
    expect(summary.failedCount).toBe(1);
  });

  it('splits join fees from pass sales', () => {
    const summary = summariseRevenue([
      payment({ purpose: 'join', amountCents: 14900 }),
      payment({ purpose: 'pass', amountCents: 39900, passId: 'starter' }),
    ]);

    expect(summary.joinFeesCents).toBe(14900);
    expect(summary.passSalesCents).toBe(39900);
    expect(summary.totalCents).toBe(54800);
  });

  it('counts refunds separately rather than netting them off silently', () => {
    const summary = summariseRevenue([payment({ status: 'refunded', amountCents: 19900 })]);
    expect(summary.totalCents).toBe(0);
    expect(summary.refundedCents).toBe(19900);
  });

  it('gives every day in the window a bar, including the quiet ones', () => {
    const summary = summariseRevenue([payment()], 14);
    expect(summary.byDay).toHaveLength(14);
    expect(summary.byDay.filter((d) => d.cents === 0).length).toBe(13);
  });

  it('ignores payments older than the window in the chart but not in the total', () => {
    const old = payment({ createdAt: new Date(Date.now() - 60 * 86_400_000).toISOString() });
    const summary = summariseRevenue([old], 14);
    expect(summary.totalCents).toBe(10000);
    expect(summary.byDay.every((d) => d.cents === 0)).toBe(true);
  });
});

describe('summariseSubscribers', () => {
  const members = [
    { id: 'a', pass: 'regular' as const, credits: 7, createdAt: new Date().toISOString() },
    { id: 'b', pass: 'starter' as const, credits: 3, createdAt: new Date().toISOString() },
    { id: 'c', pass: 'payg' as const, credits: 0, createdAt: new Date().toISOString() },
  ];

  it('counts only paid passes as subscriptions', () => {
    const summary = summariseSubscribers(members);
    expect(summary.totalMembers).toBe(3);
    expect(summary.subscribers).toBe(2);
  });

  it('excludes pay-as-you-go from MRR however many hold it', () => {
    const summary = summariseSubscribers(members);
    const payg = summary.byPass.find((p) => p.id === 'payg')!;
    expect(payg.members).toBe(1);
    expect(payg.mrrCents).toBe(0);
    expect(summary.mrrCents).toBe(79900 + 39900);
  });

  it('totals the credits people have already paid for', () => {
    expect(summariseSubscribers(members).creditsOutstanding).toBe(10);
  });
});

describe('signupsByDay', () => {
  it('buckets new members into the window and pads the rest', () => {
    const rows = signupsByDay(
      [
        { createdAt: new Date().toISOString() },
        { createdAt: new Date().toISOString() },
        { createdAt: new Date(Date.now() - 400 * 86_400_000).toISOString() },
      ],
      14,
    );

    expect(rows).toHaveLength(14);
    expect(rows[rows.length - 1].count).toBe(2);
  });
});

/* ------------------------------------------------------------------ */
/* The seeded dataset the dashboard opens on                           */
/* ------------------------------------------------------------------ */

describe('seeded demo data', () => {
  it('gives the owner an account so /admin is reachable without a database', () => {
    const owner = db().users.find((u) => u.email === 'garvcontact30@gmail.com');
    expect(owner).toBeDefined();
    expect(isSuperAdmin(owner!)).toBe(true);
  });

  it('keeps a host record for every seeded user', () => {
    // SEED_HOSTS indexes hostStats by position, so a user added without a
    // matching stats row is a crash at import time, not a missing badge.
    expect(db().hosts).toHaveLength(db().users.length);
    for (const host of db().hosts) expect(host.name.length).toBeGreaterThan(0);
  });

  it('has payment history, so the revenue dashboard has arithmetic to do', () => {
    const summary = summariseRevenue(db().payments, 14);
    expect(summary.paidCount).toBeGreaterThan(0);
    expect(summary.totalCents).toBeGreaterThan(0);
    // Both revenue lines, and both failure modes, so every tile is exercised.
    expect(summary.joinFeesCents).toBeGreaterThan(0);
    expect(summary.passSalesCents).toBeGreaterThan(0);
    expect(summary.failedCount).toBeGreaterThan(0);
    expect(summary.refundedCents).toBeGreaterThan(0);
  });
});

describe('shortVisitor', () => {
  it('shortens a real visitor id to a comparable prefix', () => {
    expect(shortVisitor('v-abcdef1234-5678')).toBe('abcdef12');
  });

  it('names the server sentinel rather than slicing it into nonsense', () => {
    // Slicing blindly turned 'server' into 'rver', which reads in the log as a
    // corrupted id rather than as "this call arrived without a session".
    expect(shortVisitor(SERVER_VISITOR)).toBe('no session');
  });
});
