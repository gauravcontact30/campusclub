import type {
  AdminEvent,
  AdminEventKind,
  AdminEventOutcome,
  Paginated,
  VisitorSession,
} from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db, nextId } from '@/lib/data/store';
import { adminReadClient } from './client';
import { ACTIVE_WINDOW_MINUTES, isTrackablePath, labelForPath } from './config';

/**
 * The telemetry the Super Admin dashboard reads.
 *
 * Same dual-backend shape as every other repository here: Supabase when it is
 * configured, the in-memory store otherwise, and one row shape either way so
 * the dashboard never learns which answered.
 *
 * What is deliberately NOT stored: request bodies, query strings, IP addresses
 * and full user agents. The dashboard's job is to show which features get used
 * and which requests fail — none of that needs the contents of anybody's
 * search, and a log that holds it becomes a liability the moment it leaks.
 */

/** Demo-mode ring buffer size. Roughly a day of traffic for a small board. */
const MAX_DEMO_EVENTS = 5000;

type Row = Record<string, unknown>;

function fromRow(row: Row): AdminEvent {
  return {
    id: String(row.id),
    occurredAt: String(row.occurred_at),
    kind: String(row.kind) as AdminEventKind,
    path: String(row.path),
    label: String(row.label ?? ''),
    method: (row.method as string | null) ?? null,
    status: row.status === null || row.status === undefined ? null : Number(row.status),
    durationMs:
      row.duration_ms === null || row.duration_ms === undefined ? null : Number(row.duration_ms),
    outcome: String(row.outcome) as AdminEventOutcome,
    message: (row.message as string | null) ?? null,
    userId: (row.user_id as string | null) ?? null,
    userEmail: (row.user_email as string | null) ?? null,
    visitorId: String(row.visitor_id),
    referrer: (row.referrer as string | null) ?? null,
  };
}

export interface RecordEventInput {
  kind: AdminEventKind;
  path: string;
  visitorId: string;
  method?: string | null;
  status?: number | null;
  durationMs?: number | null;
  outcome?: AdminEventOutcome;
  message?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  referrer?: string | null;
  label?: string;
}

/**
 * Records one event. Never throws.
 *
 * Telemetry that can break the thing it measures is worse than no telemetry:
 * a failed insert here must not turn a working page into a 500. Everything is
 * swallowed and logged instead.
 */
export async function recordEvent(input: RecordEventInput): Promise<void> {
  if (!isTrackablePath(input.path)) return;

  const event: AdminEvent = {
    id: nextId('ev'),
    occurredAt: new Date().toISOString(),
    kind: input.kind,
    path: input.path,
    label: input.label ?? labelForPath(input.path),
    method: input.method ?? null,
    status: input.status ?? null,
    durationMs: input.durationMs ?? null,
    outcome: input.outcome ?? 'success',
    message: input.message ?? null,
    userId: input.userId ?? null,
    userEmail: input.userEmail ?? null,
    visitorId: input.visitorId,
    referrer: input.referrer ?? null,
  };

  try {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) return;
      await supabase.from('admin_events').insert({
        occurred_at: event.occurredAt,
        kind: event.kind,
        path: event.path,
        label: event.label,
        method: event.method,
        status: event.status,
        duration_ms: event.durationMs,
        outcome: event.outcome,
        message: event.message,
        user_id: event.userId,
        user_email: event.userEmail,
        visitor_id: event.visitorId,
        referrer: event.referrer,
      });
      return;
    }

    const store = db();
    store.events.push(event);
    if (store.events.length > MAX_DEMO_EVENTS) {
      store.events.splice(0, store.events.length - MAX_DEMO_EVENTS);
    }
  } catch (error) {
    console.error('[telemetry] dropped an event:', (error as Error).message);
  }
}

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

export interface EventQuery {
  kind?: AdminEventKind;
  outcome?: AdminEventOutcome;
  /** Substring match on path, label, or the signed-in email. */
  search?: string;
  page?: number;
  perPage?: number;
  /** Only events at or after this instant. */
  since?: Date;
}

export async function listEvents(query: EventQuery = {}): Promise<Paginated<AdminEvent>> {
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(200, Math.max(1, query.perPage ?? 25));

  if (isSupabaseConfigured()) {
    const supabase = await adminReadClient();
    if (supabase) {
      let request = supabase
        .from('admin_events')
        .select('*', { count: 'exact' })
        .order('occurred_at', { ascending: false });

      if (query.kind) request = request.eq('kind', query.kind);
      if (query.outcome) request = request.eq('outcome', query.outcome);
      if (query.since) request = request.gte('occurred_at', query.since.toISOString());
      if (query.search) {
        const term = `%${query.search}%`;
        request = request.or(`path.ilike.${term},label.ilike.${term},user_email.ilike.${term}`);
      }

      const { data, count } = await request.range((page - 1) * perPage, page * perPage - 1);
      const total = count ?? 0;
      return {
        items: (data ?? []).map(fromRow),
        total,
        page,
        perPage,
        pages: Math.max(1, Math.ceil(total / perPage)),
      };
    }
  }

  const filtered = filterEvents(db().events, query).sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  );

  return {
    items: filtered.slice((page - 1) * perPage, page * perPage),
    total: filtered.length,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(filtered.length / perPage)),
  };
}

/** Shared by the demo branch and the tests, so both agree on what a filter means. */
export function filterEvents(events: AdminEvent[], query: EventQuery): AdminEvent[] {
  const term = query.search?.trim().toLowerCase();
  return events.filter((event) => {
    if (query.kind && event.kind !== query.kind) return false;
    if (query.outcome && event.outcome !== query.outcome) return false;
    if (query.since && new Date(event.occurredAt) < query.since) return false;
    if (!term) return true;
    return (
      event.path.toLowerCase().includes(term) ||
      event.label.toLowerCase().includes(term) ||
      (event.userEmail?.toLowerCase().includes(term) ?? false)
    );
  });
}

/** Every event in the window, newest first — the input to the live figures. */
export async function recentEvents(withinMinutes: number, limit = 2000): Promise<AdminEvent[]> {
  const since = new Date(Date.now() - withinMinutes * 60_000);

  if (isSupabaseConfigured()) {
    const supabase = await adminReadClient();
    if (supabase) {
      const { data } = await supabase
        .from('admin_events')
        .select('*')
        .gte('occurred_at', since.toISOString())
        .order('occurred_at', { ascending: false })
        .limit(limit);
      return (data ?? []).map(fromRow);
    }
  }

  return db()
    .events.filter((event) => new Date(event.occurredAt) >= since)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit);
}

/**
 * Distinct visitors seen in the active window.
 *
 * Counted by visitor cookie, not by signed-in user: most traffic on a board
 * like this is signed out, and a figure that only counted members would report
 * near zero on a busy afternoon.
 */
export function countActiveVisitors(
  events: AdminEvent[],
  withinMinutes = ACTIVE_WINDOW_MINUTES,
): { visitors: number; signedIn: number } {
  const signedIn = new Set<string>();
  const since = Date.now() - withinMinutes * 60_000;

  for (const event of events) {
    if (new Date(event.occurredAt).getTime() < since) continue;
    if (event.userId) signedIn.add(event.userId);
  }

  return { visitors: activeVisitorIds(events, withinMinutes).size, signedIn: signedIn.size };
}

/**
 * The ids counted as active, so a caller can mark individual rows live without
 * recomputing the cutoff. Kept here rather than in the page because reading
 * the clock is impure, and a server component that does it directly is a lint
 * error as well as a correctness smell.
 */
export function activeVisitorIds(
  events: AdminEvent[],
  withinMinutes = ACTIVE_WINDOW_MINUTES,
): Set<string> {
  const since = Date.now() - withinMinutes * 60_000;
  const ids = new Set<string>();
  for (const event of events) {
    if (new Date(event.occurredAt).getTime() >= since) ids.add(event.visitorId);
  }
  return ids;
}

/**
 * Rolls events up into one row per visitor: who they are if they signed in,
 * how long they stayed, and which features they touched in order.
 */
export function toSessions(events: AdminEvent[], limit = 50): VisitorSession[] {
  const byVisitor = new Map<string, AdminEvent[]>();
  for (const event of events) {
    const bucket = byVisitor.get(event.visitorId);
    if (bucket) bucket.push(event);
    else byVisitor.set(event.visitorId, [event]);
  }

  const sessions: VisitorSession[] = [];
  for (const [visitorId, own] of byVisitor) {
    const ordered = [...own].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
    const pages = ordered.filter((e) => e.kind === 'page');
    // A visitor who signs in mid-session has anonymous events before it, so
    // the identity is whichever event carries one — not the first event.
    const identified = ordered.find((e) => e.userId);

    sessions.push({
      visitorId,
      userId: identified?.userId ?? null,
      userEmail: identified?.userEmail ?? null,
      userName: null,
      firstSeen: ordered[0].occurredAt,
      lastSeen: ordered[ordered.length - 1].occurredAt,
      pageViews: pages.length,
      path: [...pages]
        .reverse()
        .map((e) => ({ path: e.path, label: e.label, at: e.occurredAt })),
      referrer: ordered.find((e) => e.referrer)?.referrer ?? null,
    });
  }

  return sessions.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)).slice(0, limit);
}

/** Which features got used, most first. */
export function topPages(events: AdminEvent[], limit = 8) {
  const counts = new Map<string, { label: string; path: string; views: number; visitors: Set<string> }>();

  for (const event of events) {
    if (event.kind !== 'page') continue;
    const row = counts.get(event.label) ?? {
      label: event.label,
      path: event.path,
      views: 0,
      visitors: new Set<string>(),
    };
    row.views += 1;
    row.visitors.add(event.visitorId);
    counts.set(event.label, row);
  }

  return [...counts.values()]
    .map(({ visitors, ...rest }) => ({ ...rest, visitors: visitors.size }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

/** Success/failure/alert split and latency for the API surface. */
export function apiHealth(events: AdminEvent[]) {
  const api = events.filter((e) => e.kind === 'api');
  const durations = api.map((e) => e.durationMs ?? 0).filter((d) => d > 0).sort((a, b) => a - b);

  const failed = api.filter((e) => e.outcome === 'fail').length;
  const alerts = api.filter((e) => e.outcome === 'alert').length;

  return {
    total: api.length,
    success: api.filter((e) => e.outcome === 'success').length,
    failed,
    alerts,
    // Rounded to a tenth: "99.7%" is honest, "99.73684%" pretends to a
    // precision a few hundred requests cannot support.
    successRate: api.length ? Math.round(((api.length - failed) / api.length) * 1000) / 10 : 100,
    medianMs: durations.length ? durations[Math.floor(durations.length / 2)] : 0,
    // p95 over a handful of requests is noise, so it is only offered once
    // there are enough of them to mean anything.
    p95Ms: durations.length >= 20 ? durations[Math.floor(durations.length * 0.95)] : null,
  };
}
