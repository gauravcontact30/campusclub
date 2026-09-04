import Link from 'next/link';
import type { AdminEventOutcome } from '@/types';
import { apiHealth, listEvents, recentEvents } from '@/lib/admin/events';
import { Panel, Stat } from '@/components/admin/stat';
import { shortVisitor } from '@/lib/admin/config';
import { cn, relativeTime } from '@/lib/utils';

const OUTCOMES: { value: AdminEventOutcome | 'all'; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'success', label: 'Success' },
  { value: 'fail', label: 'Failed' },
  { value: 'alert', label: 'Alerts' },
];

const TONE: Record<AdminEventOutcome, string> = {
  success: 'bg-signal/15 text-signal-600',
  fail: 'bg-brand-700/15 text-brand-700',
  alert: 'bg-brand/15 text-brand',
};

export default async function AdminApiLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const outcome = typeof params.outcome === 'string' ? params.outcome : 'all';
  const search = typeof params.q === 'string' ? params.q : '';
  const page = Math.max(1, Number(params.page) || 1);

  const [logs, dayEvents] = await Promise.all([
    listEvents({
      kind: 'api',
      outcome: outcome === 'all' ? undefined : (outcome as AdminEventOutcome),
      search: search || undefined,
      page,
      perPage: 40,
    }),
    recentEvents(60 * 24),
  ]);

  const health = apiHealth(dayEvents);

  /** Keeps the other filters when one changes — a link, so it is shareable. */
  const href = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const merged = { outcome, q: search, page: 1, ...patch };
    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== 'all' && value !== 1) next.set(key, String(value));
    }
    const query = next.toString();
    return query ? `/admin/api-logs?${query}` : '/admin/api-logs';
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Calls today" value={health.total} />
        <Stat
          label="Success rate"
          value={`${health.successRate}%`}
          tone={health.successRate >= 99 ? 'good' : health.successRate >= 95 ? 'warn' : 'bad'}
        />
        <Stat label="Failed" value={health.failed} tone={health.failed ? 'bad' : 'good'} />
        <Stat label="Alerts" value={health.alerts} tone={health.alerts ? 'warn' : 'good'} />
      </section>

      <Panel
        title={`API log — ${logs.total.toLocaleString('en-IN')} ${logs.total === 1 ? 'entry' : 'entries'}`}
        action={
          <form action="/admin/api-logs" className="flex items-center gap-2">
            {outcome !== 'all' && <input type="hidden" name="outcome" value={outcome} />}
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Filter by path or email…"
              aria-label="Filter the API log"
              className="search-field w-48 rounded-full border border-content/15 bg-canvas px-3.5 py-1.5 text-sm text-content placeholder:text-content/45 focus:border-brand/60 focus:outline-none"
            />
          </form>
        }
      >
        <div className="flex flex-wrap gap-2 border-b border-content/10 px-5 py-3">
          {OUTCOMES.map((option) => (
            <Link
              key={option.value}
              href={href({ outcome: option.value })}
              aria-current={outcome === option.value ? 'page' : undefined}
              className={cn(
                'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                outcome === option.value
                  ? 'border-brand bg-brand text-on-brand'
                  : 'border-content/15 text-content/70 hover:border-content/35 hover:text-content',
              )}
            >
              {option.label}
            </Link>
          ))}
          {(search || outcome !== 'all') && (
            <Link href="/admin/api-logs" className="px-2 py-1 text-sm font-semibold text-brand hover:underline">
              Clear
            </Link>
          )}
        </div>

        {logs.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="border-b border-content/10 text-left text-xs uppercase tracking-wide text-content/50">
                <tr>
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 font-semibold">Path</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Took</th>
                  <th className="px-5 py-3 font-semibold">Who</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-content/8">
                {logs.items.map((event) => (
                  <tr key={event.id}>
                    <td className="whitespace-nowrap px-5 py-2.5 text-content/60">
                      {relativeTime(event.occurredAt)}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-xs text-content/70">{event.method ?? '—'}</td>
                    <td className="max-w-[18rem] px-5 py-2.5">
                      <span className="block truncate font-medium text-content">{event.path}</span>
                      {event.message && (
                        <span className="block truncate text-xs text-content/55">{event.message}</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
                          TONE[event.outcome],
                        )}
                      >
                        {event.status ?? '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 tabular-nums text-content/70">
                      {event.durationMs === null ? '—' : `${event.durationMs}ms`}
                    </td>
                    <td className="max-w-[12rem] px-5 py-2.5">
                      <span className="block truncate text-content/70">
                        {event.userEmail ?? (
                          <span className="font-mono text-xs text-content/45">
                            {shortVisitor(event.visitorId)}
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-content/55">
            No API calls match that filter. The log fills as the site is used — the assistant, the
            meetups endpoint and the payment webhook all write to it.
          </p>
        )}

        {logs.pages > 1 && (
          <nav
            className="flex items-center justify-center gap-3 border-t border-content/10 px-5 py-4"
            aria-label="Log pagination"
          >
            {logs.page > 1 && (
              <Link href={href({ page: logs.page - 1 })} className="text-sm font-semibold text-brand hover:underline">
                ← Newer
              </Link>
            )}
            <span className="text-sm tabular-nums text-content/60">
              Page {logs.page} of {logs.pages}
            </span>
            {logs.page < logs.pages && (
              <Link href={href({ page: logs.page + 1 })} className="text-sm font-semibold text-brand hover:underline">
                Older →
              </Link>
            )}
          </nav>
        )}
      </Panel>
    </div>
  );
}
