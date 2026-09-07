import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, HeartHandshake, MessageCircle, Plus, ShieldCheck, Users } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { tintVars, type Tint } from '@/lib/tints';
import { FAQS } from '@/components/home/faq';
import { FREE_CANCELLATION_HOURS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'Four steps, and you only pay at one of them. What the join fee covers, what hosts keep, how cancelling works, and what we check before somebody can host.',
};

/**
 * The member's path, and what each step costs.
 *
 * `cost` is the whole reason this is drawn as a journey rather than listed as
 * four bullets. "You only pay at the second one" is the page's headline claim
 * and it was, until now, only ever asserted — running a cost line under every
 * step proves it instead, because three of the four read ₹0 and you can see
 * that before reading a word.
 */
const JOURNEY = [
  {
    title: 'Find it',
    body: 'Filter the board by what you want to do, when you are free and how far you will go. Everything listed is inside your city, and most of it inside your neighbourhood.',
    cost: 'Free to browse',
    pays: false,
  },
  {
    title: 'Pay the join fee',
    body: 'One payment, for one meetup, through Razorpay. The listing shows the exact amount before you commit and says what it covers. No subscription stands between you and it.',
    cost: 'The join fee, once',
    pays: true,
  },
  {
    title: 'Get the address',
    body: 'The exact street address is released the moment you join — never published on the listing, because it is often somebody’s home.',
    cost: 'Nothing further',
    pays: false,
  },
  {
    title: 'Turn up, then say how it went',
    body: 'Only people whose join was confirmed and whose meetup has finished can leave feedback. That single rule is why the ratings here are worth reading.',
    cost: 'Nothing further',
    pays: false,
  },
];

/**
 * The three money facts, each really one number and a paragraph explaining it —
 * so the number gets its own column rather than being the thing you find in the
 * third line. Money questions are looked up, not read through.
 */
const MONEY = [
  {
    figure: '100%',
    figureNote: 'of the fee goes to the host',
    title: 'What you are paying for',
    body: 'The host’s real costs — court hire, a gym day pass, the study room, the food. Hosts set the fee themselves, between free and ₹5,000, and we take no commission from it.',
  },
  {
    figure: `${FREE_CANCELLATION_HOURS} hours`,
    figureNote: 'to change your mind',
    title: 'Cancelling',
    body: `Cancel more than ${FREE_CANCELLATION_HOURS} hours before the start and the fee is refunded automatically, or the pass credit returns to your balance. Inside that window it is not, because the host has usually already paid for the venue. If a host cancels, everyone is refunded in full.`,
  },
  {
    figure: '₹0',
    figureNote: 'to sit on a waitlist',
    title: 'Waitlists',
    body: 'A full meetup still takes your name, at no cost. You are only charged if a spot opens and you take it. Pass holders move up the list first.',
  },
];

const SAFETY: { icon: typeof Users; title: string; body: string; tint: Tint }[] = [
  {
    icon: ShieldCheck,
    title: 'Hosts are verified',
    body: 'A verified badge means a confirmed phone number and a public rating built from people who actually attended. A host with no history says so plainly rather than looking established.',
    tint: 'indigo',
  },
  {
    icon: Users,
    title: 'You see who is coming',
    body: 'First names and how many spots are gone, before you pay. Women-only meetups exist in every category and are set by the host, not by us.',
    tint: 'emerald',
  },
  {
    icon: HeartHandshake,
    title: 'Report anything',
    body: 'One report gets a human reading it the same day. Hosts and members are both removable, and a removed host’s upcoming meetups are cancelled and refunded in full.',
    tint: 'amber',
  },
];

/**
 * Two sections: your side of it, then theirs.
 *
 * This page ran to six — a hero, a sticky index, joining, the money, hosting,
 * safety and an FAQ — with a navigation bar whose only job was to cope with
 * the length it did not need to have. Everything on it is still here; what
 * changed is that the four money facts now sit inside the journey they are
 * facts about, and hosting, safety and the straight answers turn out to be one
 * subject — who is on the other side of the transaction and what stops them
 * behaving badly.
 *
 * Each half is drawn as the kind of thing it is. Joining is a sequence with a
 * running cost, so it is a rail with a meter under it. The rest is a set of
 * assurances, so it is prose, three marked cards and an accordion of the
 * questions people actually ask.
 */
export default function HowItWorksPage() {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* 1 — Your side: the four steps, and what each one costs            */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-content/10" aria-labelledby="joining-heading">
        <div className="container-page py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="eyebrow">How it works</p>
            <h1 id="joining-heading" className="display-lg mt-3 text-balance text-content">
              Four steps, and you only pay at one of them.
            </h1>
            <p className="lede mt-5 max-w-2xl text-pretty">
              CampusClub is a board of things happening near you, run by people who live near you. Every meetup carries
              a join fee its host sets, and that fee is the entire transaction — there is no membership standing
              between you and the first one.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/meetups" size="lg">
                See what’s on
              </ButtonLink>
              <ButtonLink href="/passes" variant="outline" size="lg">
                What a join costs
              </ButtonLink>
            </div>
          </div>

          {/* The journey. On a wide screen the four steps run left to right with
              a hairline threaded behind the numerals; below that they stack and
              the same hairline becomes a left-hand rail. One structure, two
              readings, and neither needs a second copy of the markup. */}
          <ol className="relative mt-14 grid gap-y-10 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-8">
            <span
              aria-hidden
              className="pointer-events-none absolute left-5 top-0 hidden h-full w-px bg-content/15 sm:block lg:left-0 lg:top-5 lg:h-px lg:w-full"
            />

            {JOURNEY.map((step, i) => (
              <li key={step.title} className="relative flex flex-col pl-16 sm:pl-16 lg:pl-0">
                <span
                  aria-hidden
                  className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-content/20 bg-canvas font-display text-sm font-semibold tabular-nums text-content lg:relative"
                >
                  {i + 1}
                </span>

                <h2 className="font-display text-lg font-semibold leading-snug text-content lg:mt-6">{step.title}</h2>
                <p className="mt-2 mb-5 max-w-md text-sm leading-relaxed text-content/70">{step.body}</p>

                {/* The meter. The one step that costs anything is the only one
                    drawn in the brand colour, so the claim in the headline is
                    visible before it is read.

                    `mt-auto` on a stretched grid item pushes all four chips to
                    a common baseline. Without it they float wherever their own
                    paragraph happened to end, and four chips at four heights
                    cannot be compared at a glance — which is the only thing
                    they are for. */}
                <p
                  className={
                    step.pays
                      ? 'mt-auto inline-flex w-fit items-center rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-on-brand'
                      : 'mt-auto inline-flex w-fit items-center rounded-full border border-content/15 px-3 py-1.5 text-xs font-semibold text-content/50'
                  }
                >
                  {step.cost}
                </p>
              </li>
            ))}
          </ol>

          {/* The three numbers that belong to the second step, kept in the same
              section as the step they qualify rather than exiled to a page of
              their own. */}
          <dl className="mt-16 border-t border-content/12">
            {MONEY.map((row) => (
              <div
                key={row.title}
                className="grid gap-x-12 gap-y-3 border-b border-content/12 py-7 md:grid-cols-[12rem_1fr] md:items-baseline"
              >
                <dt>
                  <span className="block font-display text-2xl font-semibold leading-none text-content">
                    {row.figure}
                  </span>
                  <span className="mt-1.5 block text-xs leading-snug text-content/55">{row.figureNote}</span>
                </dt>
                <dd className="min-w-0">
                  <h3 className="font-display text-lg font-semibold leading-snug text-content">{row.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-content/70">{row.body}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2 — Their side: who hosts, what we check, and the usual questions */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-canvas-900/40 py-14 sm:py-20" aria-labelledby="other-side-heading">
        <div className="container-page">
          <div className="max-w-3xl">
            <p className="eyebrow">The other side of it</p>
            <h2 id="other-side-heading" className="section-title mt-3 text-balance text-content">
              Who is running this, and what stops it going wrong.
            </h2>
          </div>

          <div className="mt-11 grid gap-x-16 gap-y-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h3 className="font-display text-xl font-semibold text-content">Free to list, and they keep the fee</h3>
              <p className="mt-4 text-base leading-relaxed text-content/75">
                Listing costs nothing and we take no commission while the product is finding its feet — the join fee
                goes to the host in full. In exchange, hosts carry the parts that make a meetup work: turning up early,
                starting on time, and telling people honestly what the session is.
              </p>
              <p className="mt-4 text-base leading-relaxed text-content/75">
                We handle the payments, the waitlist, the refunds when somebody drops out, and the reminder the night
                before. A host who cancels refunds everyone automatically — there is no discretion in it, and no way to
                keep the money.
              </p>
              <ButtonLink href="/host" variant="outline" className="mt-7">
                See what hosting involves
              </ButtonLink>
            </div>

            {/* The only cards left on the page, which is what gives them any
                weight — and the icons, which used to appear on everything,
                now appear once and therefore mean something. */}
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {SAFETY.map((item) => (
                <li
                  key={item.title}
                  style={tintVars(item.tint)}
                  className="flex gap-5 rounded-2xl border border-[rgb(var(--mark)/0.16)] bg-[rgb(var(--plate))] p-6"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--mark)/0.14)] text-[rgb(var(--mark))]">
                    <item.icon size={20} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold leading-snug text-content">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-content/70">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* The same six answers the landing page shows four of. One array,
              two renderings — an answer is never edited in one place and stale
              in the other. Native `<details>`: every answer stays one keystroke
              away, costs no JavaScript, and survives find-in-page and print. */}
          <div className="mt-16 grid items-start gap-8 border-t border-content/10 pt-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="eyebrow">Straight answers</p>
              <h3 className="section-title mt-3 text-content">Before you join.</h3>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-content/65">
                A little clarity before your first hello — fees, passes, and changing your mind.
              </p>
              <Link
                href="/help"
                className="group mt-7 flex max-w-sm items-center gap-4 rounded-2xl border border-content/10 bg-canvas-700 p-5 transition-colors hover:border-brand/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <MessageCircle size={19} aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-content">Still have a question?</span>
                  <span className="mt-1 block text-xs text-content/60">Explore the help centre</span>
                </span>
                <ArrowUpRight size={17} aria-hidden className="text-content/50 group-hover:text-brand" />
              </Link>
            </div>

            <div className="min-w-0 space-y-3">
              {FAQS.map((faq, i) => (
                <details
                  key={faq.q}
                  open={i === 0}
                  className="group overflow-hidden rounded-2xl border border-content/10 bg-canvas-700 open:border-brand/30"
                >
                  <summary className="flex min-h-20 cursor-pointer list-none items-center gap-4 px-5 py-5 transition-colors hover:bg-brand/5 focus-visible:ring-inset sm:px-6 [&::-webkit-details-marker]:hidden">
                    <span aria-hidden className="text-xs font-semibold tabular-nums text-content/40 group-open:text-brand">
                      0{i + 1}
                    </span>
                    <h4 className="flex-1 font-sans text-sm font-semibold leading-relaxed tracking-normal text-content sm:text-base">
                      {faq.q}
                    </h4>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-content/15 text-content/60 group-open:border-brand/20 group-open:bg-brand/10 group-open:text-brand">
                      <Plus size={15} aria-hidden className="transition-transform duration-200 group-open:rotate-45" />
                    </span>
                  </summary>
                  <p className="px-5 pb-6 text-sm leading-7 text-content/70 sm:pl-14 sm:pr-16">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
