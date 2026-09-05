import { BadgeCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { RatingBlocks } from '@/components/ui/rating-blocks';

/**
 * Real feedback shape, real specificity — including the four-star one. A wall
 * of fives reads as marketing; one honest reservation is what makes the rest
 * believable.
 */
const VOICES = [
  {
    name: 'Sneha R.',
    context: 'Joined a 5am study table in Pune',
    rating: 5,
    body: 'Five in the morning alone is a fantasy. Five in the morning because seven other people said they would be there is just a Tuesday. Twelve weeks in and I have missed two.',
  },
  {
    name: 'Imran K.',
    context: 'Joined badminton in Delhi',
    rating: 5,
    body: 'I moved cities for work in March and knew nobody. ₹199 a week for a court and seven people who now know my name is the best money I have spent here.',
  },
  {
    name: 'Divya M.',
    context: 'Joined a Sunday dinner in Mumbai',
    rating: 4,
    body: 'Genuinely good evening. One thing: the address only arrives once you join, which I nearly missed in my email. Worth flagging if you are the kind who does not check.',
  },
];

/** Every name carries the same mark — singling one out would imply the others are less verified than the section's own subhead claims. */
function VerifiedName({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-content">
      {name}
      <BadgeCheck size={14} className="shrink-0 text-brand" aria-label="Verified attendee" />
    </span>
  );
}

/**
 * One featured voice, full weight, rather than three identical cards. Three
 * boxes of equal size is the generic testimonial pattern; picking the
 * strongest of the three and giving it the room a real editorial pull-quote
 * gets is what makes the section read as curated rather than templated. The
 * other two sit beside it as a tighter ledger — still complete quotes, just
 * not competing for the same attention.
 */
export function Proof() {
  const [featured, ...rest] = VOICES;

  return (
    <section className="border-y border-content/10 bg-canvas-900/40 py-20" aria-labelledby="proof-heading">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow">From people who went</p>
          <h2 id="proof-heading" className="display-lg mt-2 text-balance text-content">
            Only attendees can leave feedback. That is the whole trick.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-stretch">
          <figure className="surface-card relative flex flex-col justify-between p-8 sm:p-10">
            <span
              aria-hidden
              className="pointer-events-none absolute right-7 top-6 select-none font-display text-[5.5rem] leading-none text-brand/[0.14]"
            >
              &rdquo;
            </span>
            <div className="relative">
              <RatingBlocks value={featured.rating} size={16} />
              <blockquote className="mt-5 font-display text-2xl font-medium leading-snug text-content sm:text-[1.7rem]">
                {featured.body}
              </blockquote>
            </div>
            <figcaption className="relative mt-8 flex items-center gap-3 border-t border-content/10 pt-5">
              <Avatar name={featured.name} size={44} />
              <span className="min-w-0">
                <VerifiedName name={featured.name} />
                <span className="block truncate text-xs text-content/55">{featured.context}</span>
              </span>
            </figcaption>
          </figure>

          <div className="flex flex-col divide-y divide-content/10 overflow-hidden rounded-3xl border border-content/10 bg-canvas-700 shadow-card">
            {rest.map((voice) => (
              <figure key={voice.name} className="flex flex-1 flex-col gap-3 p-6">
                <figcaption className="flex items-center gap-3">
                  <Avatar name={voice.name} size={32} />
                  <span className="min-w-0 flex-1">
                    <VerifiedName name={voice.name} />
                    <span className="block truncate text-xs text-content/55">{voice.context}</span>
                  </span>
                  <RatingBlocks value={voice.rating} size={11} />
                </figcaption>
                <blockquote className="text-sm leading-relaxed text-content/75">{voice.body}</blockquote>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
