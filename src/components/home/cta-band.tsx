import { ArrowRight, Check, Ticket } from 'lucide-react';
import { FREE_CANCELLATION_HOURS } from '@/lib/constants';
import { ButtonLink } from '@/components/ui/button';
import { getDictionary } from '@/lib/i18n/server';

/**
 * The last thing on the page, so it answers the last three objections rather
 * than repeating the pitch.
 *
 * Every one of these is a promise made somewhere above — in the FAQ, in the
 * steps, on a listing — restated here because this is the point where somebody
 * is deciding, and the reasons not to are cheaper to address than the reasons
 * to are to argue again.
 */
const REASSURANCES = ['No subscription to start', `Cancel more than ${FREE_CANCELLATION_HOURS} hours ahead for a full refund`, 'Verified hosts, public ratings'];

export async function CtaBand() {
  const t = await getDictionary();

  return (
    <section className="container-page pt-14 pb-6 sm:pt-20 sm:pb-8" aria-labelledby="first-meetup-heading">
      <div className="overflow-hidden rounded-3xl border border-brand/20 bg-canvas-700">
        <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-brand/5 p-7 sm:p-12 lg:p-14">
            <p className="eyebrow">One plan can change your week</p>
            <h2 id="first-meetup-heading" className="mt-4 scroll-mt-28 font-display text-[clamp(2rem,4vw,3.25rem)] font-medium leading-tight text-content">{t.cta.title}</h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-content/70">{t.cta.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/signup" size="lg" className="w-full sm:w-auto">{t.cta.primary}<ArrowRight size={17} aria-hidden /></ButtonLink>
              <ButtonLink href="/meetups" variant="outline" size="lg" className="w-full sm:w-auto">{t.cta.secondary}</ButtonLink>
            </div>
          </div>
          <div className="flex flex-col justify-center border-t border-dashed border-brand/25 p-7 sm:p-10 lg:border-l lg:border-t-0">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Ticket size={24} strokeWidth={1.5} aria-hidden /></span>
            <h3 className="font-display text-2xl font-medium text-content">Your first meetup starts here.</h3>
            <ol className="mt-6 space-y-5">
              {['Find something you like doing.', 'Choose a time that works for you.', 'Turn up. Meet your people.'].map((step, i) => (
                <li key={step} className="flex items-center gap-3 text-sm leading-relaxed text-content/70">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand/20 text-xs font-semibold tabular-nums text-brand">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <ul className="grid gap-4 border-t border-content/10 px-7 py-5 sm:px-12 lg:grid-cols-3">
          {REASSURANCES.map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-xs leading-relaxed text-content/65">
              <Check size={15} className="mt-0.5 shrink-0 text-brand" aria-hidden />{line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
