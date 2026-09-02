import { CalendarCheck, MessagesSquare, UserRoundCheck } from 'lucide-react';

const STEPS = [
  {
    icon: UserRoundCheck,
    title: 'Answer six questions',
    body: 'Two minutes on how you talk, what you eat and how late you stay. No photos, no swiping, no profile to polish.',
  },
  {
    icon: CalendarCheck,
    title: 'We seat you with five people',
    body: 'The algorithm balances every table for age spread, language and conversational energy. The venue lands on your phone 36 hours before.',
  },
  {
    icon: MessagesSquare,
    title: 'Turn up. Talk. Rate the place.',
    body: 'Three hours, one long table. Afterwards you review the venue for everyone else — that is where the directory comes from.',
  },
];

export function HowItWorks() {
  return (
    <section className="container-page py-20 sm:py-24">
      <div className="max-w-2xl">
        <p className="eyebrow">The whole idea</p>
        <h2 className="display-lg mt-3">Two strangers away from a better Wednesday.</h2>
        <p className="lede mt-4">
          Reviews tell you where to go. Dinners give you someone to go with. SitNext runs both sides of that loop.
        </p>
      </div>

      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="surface-card group relative overflow-hidden p-7 transition-transform hover:-translate-y-1">
            <span className="font-display text-6xl font-semibold text-content/20 transition-colors group-hover:text-rouge/25">
              0{i + 1}
            </span>
            <step.icon size={26} className="mt-4 text-rouge" />
            <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-content/65">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
