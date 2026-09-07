import { SectionHead } from '@/components/home/section-head';
import { tintVars, type Tint } from '@/lib/tints';

/**
 * Four cards, not four rows.
 *
 * This was a numbered list beside a sticky heading, which is a fine shape for
 * prose and the wrong one for a sequence somebody is meant to picture
 * themselves moving through: the steps read as paragraphs to skim rather than
 * as four separate, finite things. Laid out as cards they are countable at a
 * glance, and the one that matters — the only step that costs anything —
 * carries its own colour and its own note rather than being the second
 * paragraph down.
 *
 * The numerals stay. Numbering is decoration on most pages, but this genuinely
 * is a sequence: you cannot pay before you have found something, and the
 * fourth step only exists because of the third.
 */
const STEPS: { title: string; body: string; note?: string; tint: Tint }[] = [
  {
    title: 'Find something near you',
    body: 'Search or filter by what you want to do, when you are free, and how far you will travel. Everything on the board is inside your city, and most of it is inside your neighbourhood.',
    note: 'Free to browse',
    tint: 'indigo',
  },
  {
    title: 'Pay that meetup’s join fee',
    body: 'One payment, for one meetup. It covers the host’s costs — the court, the day pass, the study room, the food. No subscription is needed to start, and the listing shows the exact amount first.',
    note: 'The only step you pay at',
    tint: 'amber',
  },
  {
    title: 'Turn up',
    body: 'You get the exact address, who else is coming, and what to bring. Most groups are between six and twelve people, and about half of everyone there came on their own the first time.',
    note: 'Six to twelve people',
    tint: 'emerald',
  },
  {
    title: 'Say how it went',
    body: 'Only people who actually attended can leave feedback, which is the entire reason the ratings here are worth reading before you spend anything.',
    note: 'Attendees only',
    tint: 'cyan',
  },
];

export function HowItWorks() {
  return (
    <section
      className="border-y border-content/10 bg-canvas-900/50 py-20"
      aria-labelledby="how-heading"
    >
      <div className="container-page">
        <SectionHead
          id="how-heading"
          eyebrow="How it works"
          title="Four steps, one payment."
          lede="Joining costs less than the coffee you would have had alone — and you only pay at the second step. Everything before it is free to look at, for as long as you like."
        />

        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              style={tintVars(step.tint)}
              className="relative flex flex-col overflow-hidden rounded-[1.75rem] border border-[rgb(var(--mark)/0.16)] bg-[rgb(var(--plate))] p-7"
            >
              {/* Set large and low-contrast behind the copy: the count is
                  something you read the shape of, not a label you stop on. */}
              <span
                aria-hidden
                className="pointer-events-none absolute right-5 top-5 select-none font-display text-[4rem] font-semibold leading-none text-[rgb(var(--mark)/0.2)] tabular-nums"
              >
                {i + 1}
              </span>

              <span className="relative inline-flex w-fit items-center rounded-full bg-[rgb(var(--mark)/0.14)] px-3 py-1 text-[0.7rem] font-bold text-[rgb(var(--mark))]">
                {step.note}
              </span>

              <h3 className="relative mt-5 font-display text-xl font-semibold leading-snug text-content">
                {step.title}
              </h3>
              <p className="relative mt-2.5 text-[0.9rem] leading-relaxed text-content/70">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
