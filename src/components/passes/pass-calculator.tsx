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

  // When paying at the door already wins, "you save nothing" is not a reading
  // worth printing. The useful second number is the pass that came closest and
  // what it would have cost you on top — that is the figure somebody is
  // actually weighing when they wonder whether to buy one anyway.
  const nearestPass = rows
    .filter((r) => r.pass.id !== 'payg')
    .reduce((a, b) => (b.monthlyCents < a.monthlyCents ? b : a));

  const figures: { label: string; value: string; tone: string }[] =
    best.pass.id === 'payg'
      ? [
          { label: 'At the door', value: formatMoney(payg.monthlyCents), tone: 'text-content' },
          {
            label: `${nearestPass.pass.name}, the nearest pass`,
            value: `+${formatMoney(nearestPass.monthlyCents - payg.monthlyCents)}`,
            tone: 'text-content/60',
          },
        ]
      : [
          { label: `On ${best.pass.name}`, value: formatMoney(best.monthlyCents), tone: 'text-content' },
          { label: 'At the door', value: formatMoney(payg.monthlyCents), tone: 'text-content/60' },
          { label: 'You save', value: formatMoney(best.savesCents), tone: 'text-signal-600' },
        ];

  return (
    <section className="surface-card overflow-hidden" aria-labelledby="calc-heading">
      {/* The instrument and its reading are two different things, so they get
          two different grounds: you set your numbers on the recessed panel,
          and the answer is drawn on the card itself underneath. */}
      <div className="border-b border-content/10 bg-canvas-600/45 p-6 sm:p-8">
        <h2 id="calc-heading" className="display-md text-balance text-content">
          Find your fit
        </h2>
        <p className="lede mt-2 max-w-xl text-pretty">
          Two numbers of your own, and the table below works out what each option would actually cost you. Most people
          should stay on pay as you go.
        </p>

        <div className="mt-8 grid gap-7 divide-content/12 sm:grid-cols-2 sm:gap-10 sm:divide-x">
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

          <fieldset className="sm:pl-10">
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

      {/* The verdict, before the table — the table is the working, not the answer.

          Set as a reading rather than a sentence: the condition as an eyebrow,
          the answer in display type, and the numbers it rests on as a small
          ledger beside it. As prose it was one undifferentiated line in which
          the winning option, its cost, the door price and the saving all
          carried equal weight, so the reader had to parse a paragraph to
          recover the one thing they came for. `aria-live` hands the same
          answer to anyone changing the inputs without watching this band. */}
      <div
        className="border-b border-content/10 bg-brand/8 px-6 py-6 sm:px-8 sm:py-7"
        aria-live="polite"
        aria-atomic="true"
      >
        {joins === 0 ? (
          <p className="text-content/75">
            Going nowhere costs nothing. Pay as you go is the only sensible option until that changes.
          </p>
        ) : (
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
            <div className="max-w-md">
              <p className="eyebrow text-brand-700">At {pluralize(joins, 'meetup')} a month</p>
              <p className="mt-2 font-display text-[1.3rem] font-semibold leading-snug text-content sm:text-2xl">
                {best.pass.name} works out cheapest
              </p>
              <p className="mt-2 text-sm leading-relaxed text-content/65">
                {best.pass.id === 'payg'
                  ? 'Every pass would cost you more than paying at the door.'
                  : `That is ${formatMoney(best.perJoinCents ?? 0)} a join, against ${formatMoney(fee)} at the door.`}
              </p>
            </div>

            {/* Wrapping rather than a fixed set of columns: the label under a
                figure is a phrase, not a word, and three of them held to
                thirds of a phone screen break mid-word. */}
            <dl className="flex flex-wrap items-end gap-x-8 gap-y-4 sm:gap-x-10">
              {figures.map((figure) => (
                <div key={figure.label}>
                  <dt className="text-xs font-medium text-content/55">{figure.label}</dt>
                  <dd
                    className={cn(
                      'mt-1 font-display text-xl font-semibold tabular-nums sm:text-[1.4rem]',
                      figure.tone,
                    )}
                  >
                    {figure.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-content/12 text-xs font-semibold text-content/50">
              <th scope="col" className="px-6 py-3.5 sm:px-8">
                Option
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                A month
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Per join
              </th>
              <th scope="col" className="px-6 py-3.5 text-right sm:px-8">
                Against paying at the door
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
