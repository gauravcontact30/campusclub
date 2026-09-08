'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Cadence } from '@/types';
import { hostProjection } from '@/lib/economics';
import { CADENCES, FEE_PRESETS } from '@/lib/constants';
import { cn, formatMoney, pluralize } from '@/lib/utils';

/**
 * What hosting pays, drawn as the thing it is: a payout slip.
 *
 * The page can say "you keep the whole join fee" as often as it likes and it
 * stays an abstraction until somebody sees ₹3,980 against their own Saturday.
 * So this is a receipt — dotted leaders, a commission line that reads −₹0, and
 * a ruled-off total — because a receipt is the one document nobody reads as
 * marketing. The line items are the arithmetic, itemised, which means the
 * claim and its proof are the same object.
 *
 * Three controls, because the listing form has exactly three fields that move
 * money: the fee, the spots and how often it runs. Everything else on that form
 * is about who turns up, not what you collect.
 *
 * The total is the *realistic* figure, not the ceiling. A full board every week
 * is what could happen; two-thirds of the spots is what a new listing on a
 * young board actually does, and a host who planned on the ceiling and got the
 * floor would rightly stop believing the rest of the page. The ceiling is still
 * printed, below the rule, where a ceiling belongs.
 *
 * The arithmetic lives in `lib/economics.ts` and is unit-tested there; what
 * this file owns is the input and the framing.
 */
export function EarningsCalculator() {
  const [fee, setFee] = useState(19900);
  const [spots, setSpots] = useState(8);
  const [cadence, setCadence] = useState<Cadence>('weekly');

  const p = hostProjection(fee, spots, cadence);
  const free = fee === 0;

  return (
    <section
      aria-labelledby="host-calc-heading"
      className="overflow-hidden rounded-2xl border border-content/10 bg-canvas-700 shadow-card"
    >
      {/* The controls sit on a recessed panel and the slip is printed on the
          card itself, so it is never in doubt which half you are operating and
          which half is answering. */}
      <div className="border-b border-dashed border-content/20 bg-canvas-600/45 p-6 sm:p-7">
        <h2 id="host-calc-heading" className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-content/45">
          Your numbers
        </h2>

        <Control label="Join fee" hint="What one spot costs. Free to ₹5,000, and all of it is yours.">
          <div className="flex flex-wrap gap-1.5">
            {FEE_PRESETS.map((preset) => (
              <Pill key={preset} on={fee === preset} onClick={() => setFee(preset)}>
                {formatMoney(preset)}
              </Pill>
            ))}
            <Pill on={free} onClick={() => setFee(0)}>
              Free
            </Pill>
          </div>
        </Control>

        <Control label="Spots" hint="How many people fit. Past the cap, the rest queue on the waitlist.">
          <div className="flex items-center gap-3">
            <Stepper
              label="One fewer spot"
              icon={<Minus size={15} />}
              onClick={() => setSpots((n) => Math.max(2, n - 1))}
              disabled={spots <= 2}
            />
            <input
              id="host-spots"
              type="number"
              min={2}
              max={60}
              value={spots}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSpots(Number.isFinite(next) ? Math.min(60, Math.max(2, Math.round(next))) : 2);
              }}
              aria-label="Spots"
              className="w-16 rounded-xl border border-content/15 bg-canvas-700 px-2 py-1.5 text-center font-display text-lg font-semibold tabular-nums text-content"
            />
            <Stepper
              label="One more spot"
              icon={<Plus size={15} />}
              onClick={() => setSpots((n) => Math.min(60, n + 1))}
              disabled={spots >= 60}
            />
          </div>
        </Control>

        <Control label="How often" hint="A one-off, or something people can build a week around.">
          <div className="flex flex-wrap gap-1.5">
            {CADENCES.map((option) => (
              <Pill key={option.value} on={cadence === option.value} onClick={() => setCadence(option.value)}>
                {option.label}
              </Pill>
            ))}
          </div>
        </Control>
      </div>

      <div className="p-6 sm:p-7">
        {free ? (
          <>
            <p className="font-display text-2xl font-semibold text-content">A free meetup collects nothing.</p>
            <p className="mt-3 text-sm leading-relaxed text-content/65">
              Which is the right call when there is nothing to cover — no court to hire, no room to book, no food to
              buy. It also fills fastest and has the worst no-show rate on the board, because nobody has committed
              anything. Charging ₹49 fixes most of both.
            </p>
          </>
        ) : (
          <>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-content/45">
              {p.runs > 1 ? 'A month of these' : 'One meetup'}
            </p>

            <dl className="mt-4">
              <LineItem
                label={`${formatMoney(fee)} × ${pluralize(p.filledPerRun, 'person', 'people')}`}
                value={formatMoney(fee * p.filledPerRun)}
              />
              {p.runs > 1 && <LineItem label={`× ${p.runs} runs a month`} value={formatMoney(p.realisticCents)} />}
              <LineItem label="CampusClub commission" value="−₹0" tone="text-signal-600" />
            </dl>

            {/* A double rule, because that is what a total sits under. Four
                pixels rather than three: `border-double` splits its width into
                line-gap-line, and at 3px the gap rounds away and it draws as a
                solid bar. */}
            <div className="mt-4 border-t-4 border-double border-content/30 pt-4">
              <div className="flex items-end justify-between gap-4">
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-content/60">You keep</span>
                <span className="font-display text-4xl font-semibold leading-none tabular-nums text-content">
                  {formatMoney(p.realisticCents)}
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-content/60">
              Costed on about two-thirds of your spots filling, which is what a new listing on a young board actually
              does. If every spot fills it is{' '}
              <span className="font-semibold tabular-nums text-content">{formatMoney(p.ifItFillsCents)}</span>.
            </p>

            {/* The two money facts a host would otherwise have to be told
                separately, kept here because this is the only place on the page
                where somebody is already thinking about the number. */}
            <ul className="mt-5 space-y-2 border-t border-dashed border-content/20 pt-5 text-xs leading-relaxed text-content/55">
              <li>
                A pass holder pays nothing at the door and you are still owed the full fee — it is settled out of pass
                revenue, not out of your take.
              </li>
              <li>
                Cancel more than six hours out and they are refunded and the waitlist fills the spot. Inside six hours
                the fee stands, because your court is already paid for.
              </li>
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function Control({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 first-of-type:mt-5">
      <p className="text-sm font-semibold text-content">{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-content/55">{hint}</p>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors',
        on
          ? 'border-brand bg-brand text-on-brand'
          : 'border-content/15 text-content/75 hover:border-content/40 hover:text-content',
      )}
    >
      {children}
    </button>
  );
}

/**
 * One line of the slip: label, a dotted leader that eats the slack, figure.
 *
 * The leader is a bordered flex child rather than a row of full stops — it
 * stretches to whatever space is left, so the figures line up in a column at
 * every width and no string has to be padded to make them.
 */
function LineItem({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline gap-2 py-1.5">
      <dt className="shrink-0 text-sm text-content/65">{label}</dt>
      <span aria-hidden className="min-w-4 flex-1 translate-y-[-0.2rem] border-b border-dotted border-content/25" />
      <dd className={cn('shrink-0 text-sm font-semibold tabular-nums', tone ?? 'text-content')}>{value}</dd>
    </div>
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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-content/15 text-content transition-colors hover:border-content/45 disabled:opacity-35 disabled:hover:border-content/15"
    >
      {icon}
    </button>
  );
}
