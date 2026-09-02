import type { Metadata } from 'next';
import { ClipboardList, HeartHandshake, MapPinned, MessageSquareQuote, ShieldCheck, Star } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Faq } from '@/components/home/faq';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'How SitNext matches six strangers to one table — and how the review directory stays honest.',
};

const DINNER_STEPS = [
  { icon: ClipboardList, title: '1. The questionnaire', body: 'Six questions about energy, curiosity, food and how late you stay. Two minutes, no photos, nothing public.' },
  { icon: HeartHandshake, title: '2. The matching', body: 'Every Monday the algorithm builds tables of six: balanced age spread, shared language, complementary conversational energy. Colleagues and blocked contacts are never seated together.' },
  { icon: MapPinned, title: '3. The reveal', body: 'Thirty-six hours before, the venue lands in your bookings page and inbox. It is always somewhere with a strong review record here.' },
  { icon: MessageSquareQuote, title: '4. The dinner', body: 'Arrive at 8. The conversation deck unlocks at 8:15 with a question nobody can answer in one word. Three hours later the bill splits evenly.' },
];

const TRUST = [
  { icon: ShieldCheck, title: 'One account, one review', body: 'Reviews are tied to a verified account and capped at one per business. Editing is fine; anonymity is not.' },
  { icon: Star, title: 'No paid placement', body: 'Owners cannot buy rank or delete criticism. Claimed listings get a badge and a public right of reply, nothing more.' },
  { icon: HeartHandshake, title: 'Safety at the table', body: 'Every venue is public and staffed. You can block a contact before the reveal, and report a guest afterwards — we act within 24 hours.' },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="bg-canvas py-16 text-content sm:py-24">
        <div className="container-page max-w-3xl">
          <p className="eyebrow">How it works</p>
          <h1 className="display-lg mt-3 text-content">A directory people trust, and a table worth turning up to.</h1>
          <p className="lede mt-5 text-content/70">
            One product, two halves. The reviews decide where the dinners happen; the dinners produce the people who
            write the reviews. Here is the full loop.
          </p>
        </div>
      </section>

      <section className="container-page py-20">
        <h2 className="display-lg max-w-2xl">The dinner, end to end</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {DINNER_STEPS.map((step) => (
            <div key={step.title} className="surface-card p-7">
              <step.icon size={24} className="text-brand" />
              <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-content/65">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-canvas-600/60 py-20">
        <div className="container-page">
          <h2 className="display-lg max-w-2xl">Why the reviews are worth reading</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TRUST.map((item) => (
              <div key={item.title} className="rounded-3xl bg-canvas-700 p-7">
                <item.icon size={24} className="text-brand" />
                <h3 className="mt-4 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-content/65">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/dinners/quiz" size="lg">
              Start the questionnaire
            </ButtonLink>
            <ButtonLink href="/businesses" variant="outline" size="lg">
              Read some reviews first
            </ButtonLink>
          </div>
        </div>
      </section>

      <Faq />
    </>
  );
}
