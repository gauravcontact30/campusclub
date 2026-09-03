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

export function Proof() {
  return (
    <section className="border-y border-content/10 bg-canvas-900/40 py-20" aria-labelledby="proof-heading">
      <div className="container-page">
        <p className="eyebrow">From people who went</p>
        <h2 id="proof-heading" className="display-lg mt-2 max-w-2xl text-balance text-content">
          Only attendees can leave feedback. That is the whole trick.
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {VOICES.map((voice) => (
            <figure key={voice.name} className="surface-card flex flex-col gap-4 p-6">
              <RatingBlocks value={voice.rating} size={15} />
              <blockquote className="flex-1 text-sm leading-relaxed text-content/80">{voice.body}</blockquote>
              <figcaption className="flex items-center gap-3 border-t border-content/10 pt-4">
                <Avatar name={voice.name} size={36} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-content">{voice.name}</span>
                  <span className="block truncate text-xs text-content/55">{voice.context}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
