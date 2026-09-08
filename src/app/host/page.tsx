import type { Metadata } from 'next';
import { CalendarClock, MapPin, RefreshCw, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { ButtonLink } from '@/components/ui/button';
import { HostForm } from '@/components/meetups/host-form';
import { EarningsCalculator } from '@/components/host/earnings-calculator';
import { CATEGORIES, CITIES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Host a meetup',
  description: `Put the thing you already do on the board. Set the spots and the join fee, keep the whole fee — CampusClub takes no commission — and we handle payments, the waitlist and refunds across ${CITIES.length} cities.`,
};

/**
 * Two sections, and they are the only two questions a prospective host has:
 * what does it pay, and what do I have to do.
 *
 * This page previously answered seven — the settlement, a calculator, the
 * five-step flow, the form, the listing fields, the money edge cases and an
 * FAQ — which is a good brochure and a bad decision aid. Somebody arrives here
 * already knowing what a meetup is; they are weighing one number and one
 * effort. Everything that was not one of those two things has gone to the
 * pages that own it: /how-it-works has the flow, /passes has what members pay,
 * /safety has the checks, /help has the long answers.
 *
 * The two money facts that survived the cut are printed on the payout slip
 * itself, because that is the one moment somebody is already holding the
 * number they apply to.
 */

/**
 * What the platform does so the host does not, as four words rather than four
 * paragraphs. Each is a real behaviour of the codebase, not a service promise:
 * payments and refunds run through the gateway, the waitlist promotes on
 * cancellation, and the address is withheld from the listing until a join
 * lands.
 */
const HANDLED = [
  { icon: Users, label: 'The waitlist', body: 'Queues past your cap at no charge, and promotes the moment somebody drops.' },
  { icon: RefreshCw, label: 'Refunds', body: 'Automatic inside the window. You are never chasing anybody for money.' },
  { icon: MapPin, label: 'The address', body: 'Public venue and area on the listing; the street address only after they join.' },
  { icon: CalendarClock, label: 'The reminder', body: 'Sent the night before, to everybody holding a spot.' },
];

export default async function HostPage() {
  const user = await getCurrentUser();

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* 1 — What it pays                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-content/10" aria-labelledby="host-pay-heading">
        <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-16">
          <div className="max-w-xl">
            <p className="eyebrow">Hosting</p>
            <h1 id="host-pay-heading" className="display-lg mt-3 text-balance text-content">
              Get paid for the thing you were doing anyway.
            </h1>
            <p className="lede mt-5">
              A 6am run, a study table, a Sunday dinner. Put it on the board, set what a spot costs, and keep every
              rupee of it — across {CITIES.length} cities and {CATEGORIES.length} kinds of meetup.
            </p>

            {/* Three lines of arithmetic that end in the whole fee. It used to
                be a sentence promising no commission, which is where a claim
                goes to be skimmed past; a settlement that reads to zero says
                it without a single adjective. */}
            <dl className="mt-9 max-w-sm border-t border-content/12">
              {[
                ['Listing a meetup', 'Free'],
                ['Our commission', '₹0'],
                ['You keep', 'The whole join fee'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 border-b border-content/12 py-3.5">
                  <dt className="text-sm text-content/65">{label}</dt>
                  <dd className="text-right font-display text-base font-semibold text-content">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {user ? (
                <ButtonLink href="#list-a-meetup" size="lg">
                  List a meetup
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/signup?next=/host" size="lg">
                    Create an account
                  </ButtonLink>
                  <ButtonLink href="/login?next=/host" variant="outline" size="lg">
                    Sign in to host
                  </ButtonLink>
                </>
              )}
            </div>
          </div>

          <EarningsCalculator />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2 — What you have to do                                           */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="list-a-meetup"
        className="scroll-mt-24 bg-canvas-900/40 py-14 sm:py-20"
        aria-labelledby="host-form-heading"
      >
        <div className="container-page">
          {user ? (
            <div className="mx-auto max-w-3xl rounded-2xl border border-content/10 bg-canvas-700 p-5 shadow-card sm:p-8">
              <h2 id="host-form-heading" className="section-title mb-2 text-content">
                Make it a meetup.
              </h2>
              <p className="mb-7 text-sm leading-relaxed text-content/60">
                Nothing here is permanent — every field stays editable until the first person joins.
              </p>
              <HostForm defaultCity={user.city} />
            </div>
          ) : (
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="host-form-heading" className="section-title text-content">
                Then the listing takes four minutes.
              </h2>
              <p className="lede mx-auto mt-4 text-pretty">
                What you are doing, when and where, and the spots and the fee. That is the whole form, and nothing on
                it is permanent until the first person joins.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <ButtonLink href="/signup?next=/host" size="lg">
                  Create an account
                </ButtonLink>
                <ButtonLink href="/login?next=/host" variant="outline" size="lg">
                  Sign in to host
                </ButtonLink>
              </div>
              <p className="mt-5 text-sm text-content/55">
                An account is free, and hosting stays free whether or not you ever join anything yourself.
              </p>
            </div>
          )}

          {/* The rest of the job, and it is ours. Four lines rather than four
              cards: this is reassurance, not a feature list, and it should be
              readable in the time it takes to decide to scroll past it. */}
          <ul className="mx-auto mt-12 grid max-w-4xl gap-x-10 gap-y-0 border-t border-content/12 sm:grid-cols-2">
            {HANDLED.map((item) => (
              <li key={item.label} className="flex gap-4 border-b border-content/12 py-5">
                <item.icon size={17} className="mt-0.5 shrink-0 text-brand" aria-hidden />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-snug text-content">{item.label}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-content/60">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-6 max-w-4xl text-sm text-content/55">
            Yours is turning up and starting on time — which, going by what attendees actually write afterwards, is
            most of what separates a good meetup from a bad one.
          </p>
        </div>
      </section>
    </>
  );
}
