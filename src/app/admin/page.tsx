import Link from 'next/link';
import { apiHealth, countActiveVisitors, recentEvents, topPages } from '@/lib/admin/events';
import { getRevenueSummary, getSubscriberSummary } from '@/lib/admin/metrics';
import { ACTIVE_WINDOW_MINUTES } from '@/lib/admin/config';
import { searchMeetups } from '@/lib/data/meetups';
import { BarList, DayChart, Panel, Stat } from '@/components/admin/stat';
import { formatMoney, relativeTime } from '@/lib/utils';

export default async function AdminOverviewPage() {
  // A day of events answers every figure on this page, so it is loaded once
  // and sliced, rather than queried per tile.
  const [dayEvents, revenue, subscribers, board] = await Promise.all([
    recentEvents(60 * 24),
    getRevenueSummary(14),
    getSubscriberSummary(),
    searchMeetups({ perPage: 1 }),
  ]);

  const active = countActiveVisitors(dayEvents, ACTIVE_WINDOW_MINUTES);
  const health = apiHealth(dayEvents);
  const pages = dayEvents.filter((e) => e.kind === 'page');
  const uniqueVisitors = new Set(pages.map((e) => e.visitorId)).size;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Active now"
          value={active.visitors}
          hint={`${active.signedIn} signed in · last ${ACTIVE_WINDOW_MINUTES} min`}
          tone={active.visitors > 0 ? 'good' : 'neutral'}
        />
        <Stat label="Visitors today" value={uniqueVisitors} hint={`${pages.length} page views`} />
        <Stat
          label="Revenue (all time)"
          value={formatMoney(revenue.totalCents)}
          hint={`${revenue.paidCount} paid · ${formatMoney(revenue.refundedCents)} refunded`}
        />
        <Stat
          label="Subscribers"
          value={subscribers.subscribers}
          hint={`${formatMoney(subscribers.mrrCents)} MRR · ${subscribers.totalMembers} members`}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="API success rate"
          value={`${health.successRate}%`}
          hint={`${health.total} calls today`}
          tone={health.successRate >= 99 ? 'good' : health.successRate >= 95 ? 'warn' : 'bad'}
        />
        <Stat
          label="Failures"
          value={health.failed}
          hint="5xx or thrown"
          tone={health.failed ? 'bad' : 'good'}
        />
        <Stat
          label="Alerts"
          value={health.alerts}
          hint="4xx or slow"
          tone={health.alerts ? 'warn' : 'good'}
        />
        <Stat
          label="Median response"
          value={`${health.medianMs}ms`}
          hint={health.p95Ms ? `p95 ${health.p95Ms}ms` : 'p95 needs 20+ calls'}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Most-used features today"
          action={
            <Link href="/admin/visitors" className="text-sm font-semibold text-brand hover:underline">
              Visitors →
            </Link>
          }
        >
          <BarList
            rows={topPages(dayEvents, 8).map((p) => ({
              label: p.label,
              value: p.views,
              hint: `${p.visitors} ${p.visitors === 1 ? 'person' : 'people'}`,
            }))}
            emptyLabel="No page views recorded yet. Browse the site in another tab and refresh."
          />
        </Panel>

        <Panel
          title="Revenue, last 14 days"
          action={
            <Link href="/admin/revenue" className="text-sm font-semibold text-brand hover:underline">
              Revenue →
            </Link>
          }
        >
          <DayChart
            rows={revenue.byDay.map((d) => ({ day: d.day, value: d.cents }))}
            format={(cents) => formatMoney(cents)}
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recent failures and alerts"
          action={
            <Link href="/admin/api-logs" className="text-sm font-semibold text-brand hover:underline">
              All logs →
            </Link>
          }
        >
          {(() => {
            const bad = dayEvents.filter((e) => e.outcome !== 'success').slice(0, 8);
            if (!bad.length) {
              return (
                <p className="px-5 py-8 text-center text-sm text-content/55">
                  Nothing has failed today.
                </p>
              );
            }
            return (
              <ul className="divide-y divide-content/8">
                {bad.map((event) => (
                  <li key={event.id} className="flex items-start gap-3 px-5 py-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        event.outcome === 'fail' ? 'bg-brand-700' : 'bg-brand'
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        <span className="font-semibold text-content">{event.status ?? '—'}</span>
                        <span className="truncate text-content/75">{event.path}</span>
                        <span className="text-content/45">{relativeTime(event.occurredAt)}</span>
                      </span>
                      {event.message && (
                        <span className="mt-0.5 block truncate text-xs text-content/55">{event.message}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </Panel>

        <Panel title="The board right now">
          <BarList
            rows={[
              { label: 'Meetups open to join', value: board.total },
              { label: 'Members', value: subscribers.totalMembers },
              { label: 'Credits outstanding', value: subscribers.creditsOutstanding },
              { label: 'Payments awaiting capture', value: revenue.pendingCount },
              { label: 'Failed payments', value: revenue.failedCount },
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}
