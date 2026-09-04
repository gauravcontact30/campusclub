import { activeVisitorIds, countActiveVisitors, recentEvents, toSessions, topPages } from '@/lib/admin/events';
import { ACTIVE_WINDOW_MINUTES, shortVisitor } from '@/lib/admin/config';
import { BarList, Panel, Stat } from '@/components/admin/stat';
import { relativeTime } from '@/lib/utils';

export default async function AdminVisitorsPage() {
  const events = await recentEvents(60 * 24);
  const sessions = toSessions(events, 60);
  const active = countActiveVisitors(events, ACTIVE_WINDOW_MINUTES);
  const liveIds = activeVisitorIds(events, ACTIVE_WINDOW_MINUTES);

  const identified = sessions.filter((s) => s.userId).length;
  const referred = sessions.filter((s) => s.referrer).length;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Active now"
          value={active.visitors}
          hint={`last ${ACTIVE_WINDOW_MINUTES} minutes`}
          tone={active.visitors ? 'good' : 'neutral'}
        />
        <Stat label="Sessions today" value={sessions.length} />
        <Stat label="Signed in" value={identified} hint={`${sessions.length - identified} anonymous`} />
        <Stat label="From a referrer" value={referred} hint="rest came direct" />
      </section>

      <Panel title="Who is here, and what they looked at">
        {sessions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="border-b border-content/10 text-left text-xs uppercase tracking-wide text-content/50">
                <tr>
                  <th className="px-5 py-3 font-semibold">Visitor</th>
                  <th className="px-5 py-3 font-semibold">Pages</th>
                  <th className="px-5 py-3 font-semibold">Journey (most recent first)</th>
                  <th className="px-5 py-3 font-semibold">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-content/8">
                {sessions.map((session) => {
                  const live = liveIds.has(session.visitorId);
                  return (
                    <tr key={session.visitorId} className="align-top">
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2">
                          {live && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-signal"
                              title="Active now"
                              aria-label="Active now"
                            />
                          )}
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-content">
                              {session.userEmail ?? 'Anonymous visitor'}
                            </span>
                            {/* The opaque id, shortened. Enough to tell two
                                anonymous sessions apart, useless for anything
                                else — which is the point. */}
                            <span className="block font-mono text-xs text-content/45">
                              {shortVisitor(session.visitorId)}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-content/75">{session.pageViews}</td>
                      <td className="px-5 py-3">
                        <span className="flex flex-wrap gap-1">
                          {session.path.slice(0, 6).map((step, i) => (
                            <span
                              key={`${step.path}-${i}`}
                              className="rounded-full bg-content/6 px-2 py-0.5 text-xs text-content/70"
                            >
                              {step.label}
                            </span>
                          ))}
                          {session.path.length > 6 && (
                            <span className="px-1 py-0.5 text-xs text-content/45">
                              +{session.path.length - 6} more
                            </span>
                          )}
                        </span>
                        {session.referrer && (
                          <span className="mt-1 block truncate text-xs text-content/45">
                            via {session.referrer}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-content/60">
                        {relativeTime(session.lastSeen)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-content/55">
            No sessions recorded in the last 24 hours. Open the site in another tab and come back.
          </p>
        )}
      </Panel>

      <Panel title="Which features got used">
        <BarList
          rows={topPages(events, 20).map((p) => ({
            label: p.label,
            value: p.views,
            hint: `${p.visitors} ${p.visitors === 1 ? 'person' : 'people'}`,
          }))}
        />
      </Panel>
    </div>
  );
}
