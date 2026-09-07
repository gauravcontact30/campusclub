import Link from 'next/link';
import { ArrowUpRight, MessageCircle, Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'Do I have to buy a subscription?',
    a: 'No. The default is paying the join fee for the one meetup you want, and nothing else. Passes exist because people who go three times a week end up wanting them — they pre-buy joins at a lower unit price. You can use CampusClub for a year without ever holding one.',
  },
  {
    q: 'What does the join fee actually pay for?',
    a: 'The host’s real costs: court hire, a gym day pass, the study room, the food. Hosts set their own fee and the listing shows exactly what is included. Meetups where the fee looks like profit get very few joins, which sorts it out faster than any rule we could write.',
  },
  {
    q: 'Can I get my money back?',
    a: 'Cancel more than six hours before it starts and the fee comes back automatically. Inside six hours it does not, because the host has usually already paid for the court or the table. If a host cancels, everyone is refunded in full, always.',
  },
  {
    q: 'What if the meetup is full?',
    a: 'Join the waitlist — it costs nothing. You are only charged if a spot opens up and you take it. Pass holders move up the waitlist first.',
  },
  {
    q: 'Is it safe to meet strangers?',
    a: 'Every host has a verified phone number and a public rating from people who actually attended. Meetups happen in public venues, the attendee list is visible before you commit, and there are women-only options in every category. Report anything and we act the same day.',
  },
  {
    q: 'Can I host something myself?',
    a: 'Yes, and it is free to list. Set the spots and the fee, and we handle the payments, the waitlist and the refunds. Most hosts start by putting the thing they were already doing alone on the board.',
  },
];

/**
 * `compact` shows the four questions people actually ask before their first
 * join and links out to the help centre. /how-it-works renders all six, but
 * imports `FAQS` and lays them out itself rather than mounting this component —
 * it folds them into a section it already has, and this one brings a `<section>`
 * of its own. The array is still the single source, so an answer is never
 * edited in one place and stale in the other.
 *
 * These used to be six open paragraphs, on the argument that a section called
 * Straight answers should not hide anything behind a click. The promise is
 * about the answers, though, not about scroll depth — and six unfolded
 * paragraphs put a wall of small print between somebody and the sign-up block
 * that follows, which is its own way of not being read. Native `<details>`
 * keeps every answer one keystroke away, costs no JavaScript, stays open to
 * find-in-page and to print, and the first one starts open so the pattern is
 * obvious without a caption explaining it.
 */
export function Faq({ compact = false }: { compact?: boolean }) {
  const shown = compact ? FAQS.slice(0, 4) : FAQS;

  return (
    <section className="border-y border-content/10 bg-canvas-900/40 py-14 sm:py-20" aria-labelledby="faq-heading">
      <div className="container-page grid items-start gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <p className="eyebrow">Straight answers</p>
          <h2 id="faq-heading" className="section-title mt-3 scroll-mt-28 text-content">Before you join.</h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-content/65">A little clarity before your first hello. Here is what to know about fees, plans and changing your mind.</p>
          <Link href="/help" className="group mt-7 flex max-w-sm items-center gap-4 rounded-2xl border border-content/10 bg-canvas-700 p-5 transition-colors hover:border-brand/40">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><MessageCircle size={19} aria-hidden /></span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-content">Still have a question?</span>
              <span className="mt-1 block text-xs text-content/60">Explore the help centre</span>
            </span>
            <ArrowUpRight size={17} aria-hidden className="text-content/50 group-hover:text-brand" />
          </Link>
        </div>

        <div className="min-w-0 space-y-3">
          {shown.map((faq, i) => (
            <details key={faq.q} open={i === 0} className="group overflow-hidden rounded-2xl border border-content/10 bg-canvas-700 open:border-brand/30">
              <summary className="flex min-h-20 cursor-pointer list-none items-center gap-4 px-5 py-5 transition-colors hover:bg-brand/5 focus-visible:ring-inset sm:px-6 [&::-webkit-details-marker]:hidden">
                <span aria-hidden className="text-xs font-semibold tabular-nums text-content/40 group-open:text-brand">0{i + 1}</span>
                <h3 className="flex-1 font-sans text-sm font-semibold leading-relaxed tracking-normal text-content sm:text-base">{faq.q}</h3>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-content/15 text-content/60 group-open:border-brand/20 group-open:bg-brand/10 group-open:text-brand">
                  <Plus size={15} aria-hidden className="transition-transform duration-200 group-open:rotate-45" />
                </span>
              </summary>
              <p className="px-5 pb-6 text-sm leading-7 text-content/70 sm:pl-14 sm:pr-16">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export { FAQS };
