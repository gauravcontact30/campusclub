import { getRevenueSummary, getSignupsByDay, getSubscriberSummary } from '@/lib/admin/metrics';
import { isRazorpayConfigured } from '@/lib/payments/config';
import { BarList, DayChart, Panel, Stat } from '@/components/admin/stat';
import { cn, formatDateTime, formatMoney } from '@/lib/utils';

const STATUS_TONE: Record<string, string> = {
  paid: 'bg-signal/15 text-signal-600',
  created: 'bg-content/10 text-content/60',
  failed: 'bg-brand-700/15 text-brand-700',
  refunded: 'bg-brand/15 text-brand',
};

export default async function AdminRevenuePage() {
  const [revenue, subscribers, signups] = await Promise.all([
    getRevenueSummary(14),
    getSubscriberSummary(),
    getSignupsByDay(14),
  ]);

  const live = isRazorpayConfigured();

  return (
    <div className="space-y-8">
      {!live && (
        <p className="surface-card px-5 py-4 text-sm text-content/70">
          <span className="font-semibold text-content">Demo gateway.</span> Razorpay keys are not set, so
          these figures come from simulated payments. They are real rows in the same tables a live
          gateway writes to — the totals are arithmetic on actual data, not placeholders.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Revenue (all time)"
          value={formatMoney(revenue.totalCents)}
          hint={`${revenue.paidCount} paid payments`}
        />
        <Stat
          label="Join fees"
          value={formatMoney(revenue.joinFeesCents)}
          hint="paid per meetup"
        />
        <Stat label="Pass sales" value={formatMoney(revenue.passSalesCents)} hint="pre-bought credits" />
        <Stat
          label="Refunded"
          value={formatMoney(revenue.refundedCents)}
          tone={revenue.refundedCents ? 'warn' : 'neutral'}
          hint="cancellations inside the window"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Subscribers"
          value={subscribers.subscribers}
          hint={`of ${subscribers.totalMembers} members`}
        />
        <Stat label="MRR" value={formatMoney(subscribers.mrrCents)} hint="from passes currently held" />
        <Stat
          label="Credits outstanding"
          value={subscribers.creditsOutstanding}
          hint="joins already paid for"
        />
        <Stat
          label="Failed payments"
          value={revenue.failedCount}
          tone={revenue.failedCount ? 'bad' : 'good'}
          hint={`${revenue.pendingCount} awaiting capture`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Revenue, last 14 days">
          <DayChart
            rows={revenue.byDay.map((d) => ({ day: d.day, value: d.cents }))}
            format={formatMoney}
          />
        </Panel>
        <Panel title="New members, last 14 days">
          <DayChart
            rows={signups.map((d) => ({ day: d.day, value: d.count }))}
            format={(n) => `${n} ${n === 1 ? 'member' : 'members'}`}
          />
        </Panel>
      </div>

      <Panel title="Who holds what">
        <BarList
          rows={subscribers.byPass.map((pass) => ({
            label: pass.name,
            value: pass.members,
            hint:
              pass.id === 'payg'
                ? 'no recurring revenue'
                : `${formatMoney(pass.mrrCents)}/mo`,
          }))}
        />
      </Panel>

      <Panel title="Recent payments">
        {revenue.recent.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead className="border-b border-content/10 text-left text-xs uppercase tracking-wide text-content/50">
                <tr>
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3 font-semibold">For</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Gateway</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-content/8">
                {revenue.recent.map((payment) => (
                  <tr key={payment.id}>
                    <td className="whitespace-nowrap px-5 py-2.5 text-content/60">
                      {formatDateTime(payment.createdAt)}
                    </td>
                    <td className="px-5 py-2.5 capitalize text-content/80">
                      {payment.purpose === 'pass' ? `Pass — ${payment.passId ?? '—'}` : 'Meetup join'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 font-semibold tabular-nums text-content">
                      {formatMoney(payment.amountCents)}
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-bold capitalize',
                          STATUS_TONE[payment.status] ?? 'bg-content/10 text-content/60',
                        )}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 capitalize text-content/60">{payment.provider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-content/55">
            No payments yet. Join a paid meetup or buy a pass and it will appear here.
          </p>
        )}
      </Panel>
    </div>
  );
}
