'use client';

import { useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import type { PassId } from '@/types';
import { comparePasses } from '@/lib/economics';
import { FEE_PRESETS } from '@/lib/constants';
import { cn, formatMoney, pluralize } from '@/lib/utils';

/**
 * The honest version of a pricing page.
 *
 * Somebody looking at four tiers has exactly one question — "is this worth it
 * for me" — and the only way to answer it is with their own numbers. So they
 * set how often they go and what they typically pay, and the table works out
 * what each option would actually cost.
 *
 * It recommends pay-as-you-go for anyone going fewer than about three times a
 * month, which is most people. A calculator that always finds a reason to
 * upsell is not a calculator, and the moment somebody notices it is one, the
 * price list stops being believable too.
 */
export function PassCalculator({
  currentPass,
  defaultJoins = 4,
  defaultFeeCents = 14900,
}: {
  currentPass?: PassId;
  defaultJoins?: number;
  defaultFeeCents?: number;
}) {
  const [joins, setJoins] = useState(defaultJoins);
  const [fee, setFee] = useState(defaultFeeCents);

  const rows = comparePasses(joins, fee);
  const best = rows.find((r) => r.cheapest)!;
  const payg = rows.find((r) => r.pass.id === 'payg')!;

  return (
    <section className="surface-card overflow-hidden" aria-labelledby="calc-heading">
      <div className="border-b border-content/10 p-6 sm:p-8">
        <h2 id="calc-heading" className="display-md text-content">
          Work out whether a pass is worth it
        </h2>
        <p className="lede mt-2">Your numbers, not an average. Most people should stay on pay as you go.</p>

        <div className="mt-7 grid gap-7 sm:grid-cols-2">
          <div>
            <label htmlFor="joins-per-month" className="block text-sm font-semibold text-content">
              Meetups a month
            </label>
            <p className="mt-1 text-xs text-content/55">Be honest rather than aspirational.</p>
            <div className="mt-3 flex items-center gap-3">
              <Stepper
                label="One fewer meetup a month"
                icon={<Minus size={16} />}
                onClick={() => setJoins((n) => Math.max(0, n - 1))}
                disabled={joins <= 0}
              />
              <input
                id="joins-per-month"
                type="range"
                min={0}
                max={20}
                value={joins}
                onChange={(e) => setJoins(Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-content/15 accent-[rgb(var(--brand))]"
              />
              <Stepper
                label="One more meetup a month"
                icon={<Plus size={16} />}
                onClick={() => setJoins((n) => Math.min(20, n + 1))}
                disabled={joins >= 20}
              />
              <span className="w-10 shrink-0 text-right font-display text-xl font-semibold tabular-nums text-content">
                {joins}
              </span>
            </div>
          </div>

          <fieldset>
            <legend className="block text-sm font-semibold text-content">Typical join fee</legend>
            <p className="mt-1 text-xs text-content/55">What the things you go to usually cost.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {FEE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFee(preset)}
                  aria-pressed={fee === preset}
                  className={cn(
                    'rounded-full border px-3.5 py-2 text-sm font-medium tabular-nums transition-colors',
                    fee === preset
                      ? 'border-brand bg-brand/15 text-brand-700'
                      : 'border-content/15 text-content/75 hover:border-content/40',
                  )}
                >
                  {formatMoney(preset)}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      {/* The verdict, before the table — the table is the working, not the answer. */}
      <div className="border-b border-content/10 bg-brand/8 px-6 py-5 sm:px-8">
        {joins === 0 ? (
          <p className="text-content/75">
            Going nowhere costs nothing. Pay as you go is the only sensible option until that changes.
          </p>
        ) : best.pass.id === 'payg' ? (
          <p className="text-[0.98rem] leading-relaxed text-content/85">
            At <strong className="font-semibold text-content">{pluralize(joins, 'meetup')} a month</strong> you are
            better off on <strong className="font-semibold text-content">pay as you go</strong> —{' '}
            {formatMoney(payg.monthlyCents)} a month. Every pass would cost you more than paying at the door.
          </p>
        ) : (
          <p className="text-[0.98rem] leading-relaxed text-content/85">
            At <strong className="font-semibold text-content">{pluralize(joins, 'meetup')} a month</strong>,{' '}
            <strong className="font-semibold text-content">{best.pass.name}</strong> works out cheapest —{' '}
            {formatMoney(best.monthlyCents)} against {formatMoney(payg.monthlyCents)} at the door, saving{' '}
            <strong className="font-semibold text-content">{formatMoney(best.savesCents)}</strong> a month.
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-content/12 text-xs font-bold uppercase tracking-[0.12em] text-content/45">
              <th scope="col" className="px-6 py-3 sm:px-8">
                Option
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                A month
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Per join
              </th>
              <th scope="col" className="px-6 py-3 text-right sm:px-8">
                vs. at the door
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.pass.id}
                className={cn('border-b border-content/8 last:border-0', row.cheapest && 'bg-brand/6')}
              >
                <th scope="row" className="px-6 py-4 font-normal sm:px-8">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-content">{row.pass.name}</span>
                    {row.cheapest && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[0.68rem] font-bold text-on-brand">
                        <Check size={11} /> Cheapest for you
                      </span>
                    )}
                    {currentPass === row.pass.id && (
                      <span className="rounded-full border border-content/25 px-2 py-0.5 text-[0.68rem] font-semibold text-content/65">
                        Your pass
                      </span>
                    )}
                  </span>
                  {row.overflowCents > 0 && (
                    <span className="mt-0.5 block text-xs text-content/55">
                      {row.pass.priceCents > 0 && `${formatMoney(row.pass.priceCents)} + `}
                      {formatMoney(row.overflowCents)} in fees beyond the credits
                    </span>
                  )}
                </th>
                <td className="px-4 py-4 text-right font-display text-base font-semibold tabular-nums text-content">
                  {formatMoney(row.monthlyCents)}
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-content/70">
                  {row.perJoinCents === null ? '—' : formatMoney(row.perJoinCents)}
                </td>
                <td
                  className={cn(
                    'px-6 py-4 text-right font-medium tabular-nums sm:px-8',
                    row.savesCents > 0 ? 'text-signal-600' : 'text-content/45',
                  )}
                >
                  {row.savesCents > 0
                    ? `saves ${formatMoney(row.savesCents)}`
                    : row.savesCents < 0
                      ? `+${formatMoney(-row.savesCents)}`
                      : 'the same'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stepper({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-content/20 text-content transition-colors hover:border-content/45 disabled:opacity-35"
    >
      {icon}
    </button>
  );
}
