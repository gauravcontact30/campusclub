import Link from 'next/link';
import { countMeetupsByCategory, countMeetupsByCity, searchMeetups } from '@/lib/data/meetups';
import { getSubscriberSummary } from '@/lib/admin/metrics';
import { CATEGORIES, CITIES, categoryBySlug } from '@/lib/constants';
import { BarList, Panel, Stat } from '@/components/admin/stat';
import { formatDateTime, formatMoney, pluralize } from '@/lib/utils';

/**
 * The supply side: what is actually on the board, who is hosting it, and where
 * the catalogue has gaps. An admin looking at flat revenue needs to know
 * whether the problem is demand or an empty board, and this is that answer.
 */
export default async function AdminContentPage() {
  const [board, byCity, byCategory, subscribers] = await Promise.all([
    searchMeetups({ perPage: 100, sort: 'soonest' }),
    countMeetupsByCity(),
    countMeetupsByCategory(),
    getSubscriberSummary(),
  ]);

  const cityRows = CITIES.map((city) => ({ label: city.name, value: byCity[city.name] ?? 0 }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  const categoryRows = CATEGORIES.map((category) => ({
    label: category.name,
    value: byCategory[category.slug] ?? 0,
  })).sort((a, b) => b.value - a.value);

  const emptyCategories = categoryRows.filter((row) => !row.value);
  const seatsTotal = board.items.reduce((sum, m) => sum + m.spotsTotal, 0);
  const seatsTaken = board.items.reduce((sum, m) => sum + m.spotsTaken, 0);
  const fees = board.items.map((m) => m.joinFeeCents).sort((a, b) => a - b);
  const medianFee = fees.length ? fees[Math.floor(fees.length / 2)] : 0;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Meetups open" value={board.total} hint={`across ${cityRows.length} live cities`} />
        <Stat
          label="Seats filled"
          value={`${seatsTotal ? Math.round((seatsTaken / seatsTotal) * 100) : 0}%`}
          hint={`${seatsTaken} of ${seatsTotal}`}
          tone={seatsTotal && seatsTaken / seatsTotal > 0.6 ? 'good' : 'neutral'}
        />
        <Stat label="Median join fee" value={formatMoney(medianFee)} />
        <Stat
          label="Categories with nothing on"
          value={emptyCategories.length}
          tone={emptyCategories.length > 8 ? 'warn' : 'neutral'}
          hint={`of ${CATEGORIES.length}`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Cities with a live board"
          action={
            <Link href="/cities" className="text-sm font-semibold text-brand hover:underline">
              All {CITIES.length} →
            </Link>
          }
        >
          <BarList rows={cityRows} emptyLabel="No city has anything on the board." />
        </Panel>

        <Panel title="Activities, by what is on">
          <BarList rows={categoryRows.filter((r) => r.value > 0)} />
          {emptyCategories.length > 0 && (
            <div className="border-t border-content/10 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-content/45">
                Nothing on yet
              </p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {emptyCategories.map((row) => (
                  <span
                    key={row.label}
                    className="rounded-full bg-content/6 px-2.5 py-1 text-xs text-content/65"
                  >
                    {row.label}
                  </span>
                ))}
              </p>
            </div>
          )}
        </Panel>
      </div>

      <Panel title={`Next up — ${pluralize(Math.min(board.items.length, 15), 'meetup')}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-content/10 text-left text-xs uppercase tracking-wide text-content/50">
              <tr>
                <th className="px-5 py-3 font-semibold">Meetup</th>
                <th className="px-5 py-3 font-semibold">Activity</th>
                <th className="px-5 py-3 font-semibold">Where</th>
                <th className="px-5 py-3 font-semibold">Starts</th>
                <th className="px-5 py-3 font-semibold">Seats</th>
                <th className="px-5 py-3 font-semibold">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-content/8">
              {board.items.slice(0, 15).map((meetup) => (
                <tr key={meetup.id}>
                  <td className="max-w-[16rem] px-5 py-2.5">
                    <Link
                      href={`/meetups/${meetup.slug}`}
                      className="block truncate font-medium text-content hover:text-brand"
                    >
                      {meetup.title}
                    </Link>
                    <span className="block truncate text-xs text-content/50">
                      {meetup.host.name}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-content/70">
                    {categoryBySlug(meetup.categorySlug)?.name}
                  </td>
                  <td className="px-5 py-2.5 text-content/70">{meetup.city}</td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-content/60">
                    {formatDateTime(meetup.startsAt)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 tabular-nums text-content/70">
                    {meetup.spotsTaken}/{meetup.spotsTotal}
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 font-semibold tabular-nums text-content">
                    {formatMoney(meetup.joinFeeCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Members">
        <BarList
          rows={[
            { label: 'Total members', value: subscribers.totalMembers },
            { label: 'On a paid pass', value: subscribers.subscribers },
            { label: 'Pay as you go', value: subscribers.totalMembers - subscribers.subscribers },
            { label: 'Credits outstanding', value: subscribers.creditsOutstanding },
          ]}
        />
      </Panel>
    </div>
  );
}
