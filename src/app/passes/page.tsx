import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth/session';
import { getJoinsForUser } from '@/lib/data/joins';
import { PassGrid } from '@/components/passes/pass-grid';
import { PassCalculator } from '@/components/passes/pass-calculator';
import { PASSES, FREE_CANCELLATION_HOURS } from '@/lib/constants';
import { memberSpend, monthlyJoinRate } from '@/lib/economics';
import { PAYMENT_MODE } from '@/lib/payments/config';

export const metadata: Metadata = {
  title: 'Passes',
  description:
    'Every meetup carries a join fee its host sets. A pass just pre-buys those joins at a lower price each — one credit covers any meetup on the board, whatever it costs. No subscription is required to use CampusClub.',
};

/**
 * Two sections: what a join costs, then what the passes are.
 *
 * The page used to run to four — an opener, the grid, the calculator and the
 * small print — which meant the one idea that makes any of it make sense was
 * spread across the whole scroll. That idea is small enough to draw: a credit
 * is one join whatever the meetup charges, so a pass is worth most to somebody
 * going to the expensive things and worth nothing to somebody going twice a
 * month to a ₹99 run.
 *
 * So the first section explains — the price of a join, drawn to scale, and the
 * calculator that turns it into this reader's own answer. The second features
 * the four options and closes with the terms. Nothing else survived, because
 * nothing else changes the decision.
 */

/**
 * The three meetups in the credit demonstration.
 *
 * Real shapes off the board rather than "Meetup A / B / C" — the fees are
 * three of the presets a host can actually pick, and the bar widths are drawn
 * from those numbers rather than chosen to look good. The point only lands if
 * the ₹499 bar is genuinely ten times the ₹49 one.
 */
const EXAMPLES = [
  { name: 'A sunrise 5K by the lake', rupees: 49 },
  { name: 'A three-hour deep-work table', rupees: 199 },
  { name: 'A six-strangers dinner', rupees: 499 },
];

/** The span a host is allowed to charge inside, and the band most sit in. */
const FEE_FLOOR = 49;
const FEE_CEILING = 499;
const TYPICAL = [99, 199] as const;

function pct(rupees: number) {
  return ((rupees - FEE_FLOOR) / (FEE_CEILING - FEE_FLOOR)) * 100;
}

const NOTES = [
  {
    q: 'You do not need one of these',
    a: 'The default is paying the join fee for the one meetup you want. Passes exist because people who go three times a week end up wanting them, not because the product needs a subscription to work.',
  },
  {
    q: 'A credit is one join, on any meetup',
    a: 'It does not matter whether the meetup costs ₹49 or ₹499 — one credit covers it. So passes are worth most to people who go to the expensive things.',
  },
  {
    q: 'Unused credits do not roll over',
    a: 'They reset each month. If you are consistently not using them, drop to a smaller pass or back to pay as you go — the switch is instant and takes effect immediately.',
  },
  {
    q: 'Cancelling gives the credit back',
    a: `Cancel more than ${FREE_CANCELLATION_HOURS} hours before a meetup starts and the credit returns to your balance, the same way a paid fee is refunded.`,
  },
];

export default async function PassesPage() {
  const user = await getCurrentUser();

  // Seed the calculator from what this member actually does, so a signed-in
  // visitor lands on their own answer rather than a made-up default.
  const joins = user ? await getJoinsForUser(user.id) : [];
  const spend = memberSpend(joins);
  const typicalJoins = user ? monthlyJoinRate(spend.joins, user.createdAt) : 4;

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* 1 — What a join costs, and whether a pass beats it                */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-content/10" aria-labelledby="passes-explain-heading">
        <div className="container-page py-12 sm:py-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,32rem)] lg:gap-16">
            <div className="max-w-xl">
              <p className="eyebrow">Join fees &amp; passes</p>
              <h1 id="passes-explain-heading" className="display-lg mt-3 text-balance text-content">
                Pay for what you go to.
              </h1>
              <p className="lede mt-5 text-pretty">
                Every meetup carries a join fee its host sets, and that fee is the whole transaction. A pass does one
                thing: it buys those joins up front, at a lower price each.
              </p>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-content/65">
                Which is why the honest answer for most people is the first option on this page — and why the
                calculator below will often tell you so.
              </p>
            </div>

            {/*
             * The whole model, drawn once.
             *
             * A credit is one join whatever the meetup charges, and that is a
             * sentence people read past. Three bars at true relative width,
             * each stopped by an identical credit chip, is the same claim as a
             * picture — and the picture also carries the consequence, which the
             * sentence does not: the chips are the same size and the bars are
             * not, so a pass is obviously worth most on the expensive things.
             */}
            <figure className="rounded-2xl border border-content/10 bg-canvas-700 p-6 shadow-card sm:p-7">
              <figcaption className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-content/45">
                One credit covers any of these
              </figcaption>

              <ul className="mt-6 space-y-5">
                {EXAMPLES.map((example) => (
                  <li key={example.name}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="min-w-0 truncate text-sm text-content/75">{example.name}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-content">
                        ₹{example.rupees}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      {/* Width is the fee against the ceiling a host may set,
                          so the ₹499 bar really is ten times the ₹49 one. */}
                      <span aria-hidden className="h-2.5 flex-1 rounded-full bg-content/10">
                        <span
                          className="block h-full rounded-full bg-brand"
                          style={{ width: `${(example.rupees / FEE_CEILING) * 100}%` }}
                        />
                      </span>
                      <span className="shrink-0 rounded-full bg-brand/12 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-brand-700">
                        1 credit
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* The same axis, doing its second job: where a fee can sit at
                  all, and where most of them actually do. */}
              <div className="mt-7 border-t border-content/10 pt-6">
                <p className="text-sm font-semibold text-content">Where join fees sit</p>
                <div
                  className="relative mt-3 h-2.5 rounded-full bg-content/12"
                  role="img"
                  aria-label={`Join fees run from ₹${FEE_FLOOR} to ₹${FEE_CEILING}. Most fall between ₹${TYPICAL[0]} and ₹${TYPICAL[1]}.`}
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 rounded-full bg-brand"
                    style={{ left: `${pct(TYPICAL[0])}%`, right: `${100 - pct(TYPICAL[1])}%` }}
                  />
                </div>
                <div aria-hidden className="mt-2.5 flex justify-between text-xs font-medium tabular-nums text-content/55">
                  <span>₹{FEE_FLOOR}</span>
                  <span>₹{FEE_CEILING}</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-content/65">
                  Most sit in the marked band, between ₹{TYPICAL[0]} and ₹{TYPICAL[1]}. Hosts set it themselves and keep
                  all of it, so it tracks what they are actually paying out — the court, the day pass, the room, the
                  food.
                </p>
              </div>
            </figure>
          </div>

          <div className="mt-14">
            <PassCalculator
              currentPass={user?.pass}
              defaultJoins={typicalJoins}
              defaultFeeCents={spend.typicalFeeCents}
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2 — The four options, and the terms                               */}
      {/* ---------------------------------------------------------------- */}
      <section id="pass-options" className="scroll-mt-24 bg-canvas-900/40 py-14 sm:py-20" aria-labelledby="options-heading">
        <div className="container-page">
          <h2 id="options-heading" className="section-title text-content">
            One credit, one meetup.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-content/65">
            Four options, and the first one is not a pass at all. Start at the top — that is where most people should
            stop.
          </p>

          {PAYMENT_MODE === 'demo' && (
            <p className="mt-7 rounded-2xl border border-signal/40 bg-signal/10 px-5 py-4 text-sm text-content/80">
              <strong className="font-semibold text-content">Demo checkout.</strong> You can explore the pass flow here.
              No real payment will be taken.
            </p>
          )}

          <div className="mt-8">
            <PassGrid passes={PASSES} user={user} />
          </div>

          {/* The terms, as a ruled ledger rather than four boxes: these are
              four definitions read once and scanned, and a grid of identical
              cards would give four unrelated facts the same weight as the set
              of options above them that you are actually choosing between.

              The counted numerals are what make it scannable as a set — a
              visible 01–04 tells you how much of this there is before you
              start, which is most of what anybody wants from small print. */}
          <div className="mt-16 border-t border-content/10 pt-12">
            <h3 className="font-display text-2xl font-semibold text-content">The small print, in plain words</h3>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-content/65">
              Four things worth knowing before you buy one. There is no fifth — nothing here renews at a price you were
              not shown, and nothing locks you in for a month you did not ask for.
            </p>

            <dl className="mt-8 border-t border-content/12">
              {NOTES.map((note, i) => (
                <div
                  key={note.q}
                  className="grid gap-2 border-b border-content/12 py-6 md:grid-cols-[18rem_1fr] md:gap-12"
                >
                  <dt className="flex gap-3.5 font-display text-base font-semibold leading-snug text-content">
                    <span aria-hidden className="pt-1 font-sans text-xs font-bold tabular-nums text-content/30">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {note.q}
                  </dt>
                  <dd className="max-w-2xl text-sm leading-relaxed text-content/70 md:pt-0.5">{note.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
