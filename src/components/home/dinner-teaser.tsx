import type { DinnerEvent } from '@/types';
import { ButtonLink } from '@/components/ui/button';
import { DinnerCard } from '@/components/dinners/dinner-card';

export function DinnerTeaser({ events }: { events: DinnerEvent[] }) {
  return (
    <section className="bg-noir py-20 text-pearl sm:py-24">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Wednesday dinners</p>
            <h2 className="display-lg mt-3 text-pearl">
              One table.
              <br />
              Six people who have never met.
            </h2>
            <p className="lede mt-5 text-pearl/70">
              You answer six questions. We handle the seating, the booking and the awkward first two minutes — there is
              a conversation deck on your phone at 8:15. All you do is show up hungry.
            </p>

            <dl className="mt-9 grid grid-cols-2 gap-6 border-t border-pearl/15 pt-8 sm:grid-cols-3">
              {[
                ['92%', 'would come again'],
                ['6', 'seats per table'],
                ['3 hrs', 'average dinner'],
              ].map(([stat, label]) => (
                <div key={label}>
                  <dt className="font-display text-3xl font-semibold text-blush">{stat}</dt>
                  <dd className="mt-1 text-sm text-pearl/60">{label}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/dinners/quiz" size="lg">
                Take the 2-minute quiz
              </ButtonLink>
              <ButtonLink href="/how-it-works" variant="secondary" size="lg">
                How it works
              </ButtonLink>
            </div>
          </div>

          <div className="grid gap-4 text-pearl sm:grid-cols-2">
            {events.slice(0, 4).map((event) => (
              <DinnerCard key={event.id} event={event} compact />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
