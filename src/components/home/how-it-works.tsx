import { CalendarCheck, CreditCard, Search, Users } from 'lucide-react';

/**
 * Numbered because it genuinely is a sequence — you cannot pay before you have
 * found something, and the fourth step only exists because of the third.
 */
const STEPS = [
  {
    icon: Search,
    title: 'Find something near you',
    body: 'Filter by what you want to do, how far you will travel, and when you are free. Everything on the board is within your city.',
  },
  {
    icon: CreditCard,
    title: 'Pay that meetup’s join fee',
    body: 'One payment, for one meetup. It covers the host’s costs — the court, the day pass, the food. No subscription needed to start.',
  },
  {
    icon: Users,
    title: 'Turn up',
    body: 'You get the exact address, who else is coming, and what to bring. Most groups are between six and twelve people.',
  },
  {
    icon: CalendarCheck,
    title: 'Say how it went',
    body: 'Only people who actually attended can leave feedback, which is why the ratings here mean something.',
  },
];

export function HowItWorks() {
  return (
    <section className="container-page py-20" aria-labelledby="how-heading">
      <p className="eyebrow">Four steps</p>
      <h2 id="how-heading" className="display-lg mt-3 max-w-2xl text-balance text-content">
        Joining costs less than the coffee you would have had alone.
      </h2>

      <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="surface-card flex flex-col gap-3 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12 text-brand">
                <step.icon size={19} />
              </span>
              <span className="font-display text-sm font-bold tabular-nums text-content/35">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="font-display text-lg font-bold text-content">{step.title}</h3>
            <p className="text-sm leading-relaxed text-content/70">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
