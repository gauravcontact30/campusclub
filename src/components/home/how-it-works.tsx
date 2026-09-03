/**
 * Numbered because it genuinely is a sequence — you cannot pay before you have
 * found something, and the fourth step only exists because of the third. The
 * numerals are set large in the display serif and carry the rhythm of the
 * section on their own, so each step needs no icon competing with them.
 */
const STEPS = [
  {
    title: 'Find something near you',
    body: 'Search or filter by what you want to do, when you are free, and how far you will travel. Everything on the board is inside your city, and most of it is inside your neighbourhood.',
  },
  {
    title: 'Pay that meetup’s join fee',
    body: 'One payment, for one meetup. It covers the host’s costs — the court, the day pass, the study room, the food. No subscription is needed to start, and the listing shows the exact amount first.',
  },
  {
    title: 'Turn up',
    body: 'You get the exact address, who else is coming, and what to bring. Most groups are between six and twelve people, and about half of everyone there came on their own the first time.',
  },
  {
    title: 'Say how it went',
    body: 'Only people who actually attended can leave feedback, which is the entire reason the ratings here are worth reading before you spend anything.',
  },
];

export function HowItWorks() {
  return (
    <section className="container-page py-20" aria-labelledby="how-heading">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">How it works</p>
          <h2 id="how-heading" className="display-lg mt-3 text-balance text-content">
            Joining costs less than the coffee you would have had alone.
          </h2>
          <p className="lede mt-5">
            Four steps, and you only pay at the second one. Everything before it is free to look at, for as long as
            you like.
          </p>
        </div>

        <ol className="space-y-px">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-6 border-t border-content/12 py-7 first:border-t-0 first:pt-0">
              <span
                className="font-display text-4xl font-semibold leading-none text-brand/35 tabular-nums"
                aria-hidden
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-xl font-semibold text-content">{step.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-content/70">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
