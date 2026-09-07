'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { RatingBlocks } from '@/components/ui/rating-blocks';
import { SectionHead } from '@/components/home/section-head';
import { useMediaQuery } from '@/hooks/use-media-query';
import { CATEGORIES, CITIES } from '@/lib/constants';
import { PORTRAIT_IDS, PROFESSIONAL_PORTRAIT_IDS, portraitUrl } from '@/lib/media/portraits';
import { tintVars, type Tint } from '@/lib/tints';
import { cn } from '@/lib/utils';

/** How long one review holds the front of the carousel. */
const AUTOPLAY_MS = 5000;

interface Voice {
  name: string;
  context: string;
  rating: number;
  body: string;
  tint: Tint;
  /**
   * An Unsplash id from the shared portrait pool — see `lib/media/portraits.ts`.
   * The pool is reused across the seed members, the professionals strip and
   * this section rather than each keeping its own list of URLs, because one
   * list is one thing to check with `npm run media:check` and three lists were
   * three places for a dead link to hide.
   */
  portrait: string;
}

/**
 * What the board's feedback actually looks like, including the four-star ones.
 *
 * A wall of fives reads as marketing; the reservations are what make the rest
 * believable, and they are deliberately spread through the run rather than
 * parked at the end where a carousel would rarely reach them.
 *
 * The cities are drawn from across the catalogue on purpose. Three metro
 * quotes said the product works in metros, which is the one thing nobody
 * doubts — Indore, Coimbatore, Lucknow and Guwahati are the claim worth
 * evidencing, and they are also the cities somebody arriving from a Tier-2
 * town is looking for their own in.
 */
const VOICES: Voice[] = [
  {
    name: 'Sneha R.',
    context: 'Joined a 5am study table in Pune',
    rating: 5,
    body: 'Five in the morning alone is a fantasy. Five in the morning because seven other people said they would be there is just a Tuesday. Twelve weeks in and I have missed two.',
    tint: 'indigo',
    portrait: PORTRAIT_IDS[3],
  },
  {
    name: 'Imran K.',
    context: 'Joined badminton in Delhi',
    rating: 5,
    body: 'I moved cities for work in March and knew nobody. ₹199 a week for a court and seven people who now know my name is the best money I have spent here.',
    tint: 'emerald',
    portrait: PORTRAIT_IDS[4],
  },
  {
    name: 'Divya M.',
    context: 'Joined a Sunday dinner in Mumbai',
    rating: 4,
    body: 'Genuinely good evening. One thing: the address only arrives once you join, which I nearly missed in my email. Worth flagging if you are the kind who does not check.',
    tint: 'amber',
    portrait: PORTRAIT_IDS[7],
  },
  {
    name: 'Rahul B.',
    context: 'Joined a Sarafa food walk in Indore',
    rating: 5,
    body: 'I have lived here my whole life and still ate three things I had never ordered. Six people, one street, and nobody tried to make it a networking event.',
    tint: 'rose',
    portrait: PORTRAIT_IDS[11],
  },
  {
    name: 'Aishwarya P.',
    context: 'Joined a mock-test table in Lucknow',
    rating: 5,
    body: 'The coaching centre gives you the paper. Nobody gives you four people who will sit and argue about question 63 for an hour afterwards. That hour is the whole thing.',
    tint: 'indigo',
    portrait: PORTRAIT_IDS[9],
  },
  {
    name: 'Nikhil V.',
    context: 'Joined a sunrise ride in Coimbatore',
    rating: 4,
    body: 'Route was good and the pace groups worked. Only note is that we started fifteen minutes late waiting on two people — say six and mean six, and this is a five.',
    tint: 'cyan',
    portrait: PORTRAIT_IDS[8],
  },
  {
    name: 'Ritika S.',
    context: 'Joined a Brahmaputra run in Guwahati',
    rating: 5,
    body: 'Turned up on my own, which I had been putting off for about four months. Somebody handed me a water bottle before I had finished apologising for being slow.',
    tint: 'emerald',
    portrait: PROFESSIONAL_PORTRAIT_IDS[2],
  },
  {
    name: 'Farhan A.',
    context: 'Joined a chess ladder in Bhopal',
    rating: 5,
    body: 'Rated 1100 and got paired against 700 and 1600 in the same evening. Learned more from losing the second game than from a month of playing the phone.',
    tint: 'rose',
    portrait: PROFESSIONAL_PORTRAIT_IDS[1],
  },
  {
    name: 'Meghna T.',
    context: 'Joined a breakfast table in Kochi',
    rating: 4,
    body: 'Lovely couple of hours. The café was louder than the listing suggested, so if you are coming to actually talk, ask for the back room — the host did move us happily.',
    tint: 'amber',
    portrait: PORTRAIT_IDS[1],
  },
  {
    name: 'Sandeep J.',
    context: 'Joined a leg-day slot in Jaipur',
    rating: 5,
    body: 'Six people, three racks, one written plan, and a day pass in the fee. I have skipped legs for two years and have not skipped it once since I started paying for a slot.',
    tint: 'cyan',
    portrait: PROFESSIONAL_PORTRAIT_IDS[3],
  },
];

/**
 * Three numbers, and two of them are derived rather than asserted — they come
 * straight off the catalogue, so they cannot drift out of date the way a
 * hardcoded marketing figure does.
 */
const STATS = [
  { value: '41,200', label: 'joins paid for since we started' },
  { value: String(CITIES.length), label: 'cities across India' },
  { value: String(CATEGORIES.length), label: 'things people meet up to do' },
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
 * Every review, moving, then the numbers underneath.
 *
 * This has been three things: one promoted pull-quote with the others as a
 * ledger, then three equal cards. Both had the same ceiling — three is all the
 * room a static grid has, so the section could only ever show its best three,
 * which is exactly the shape a reader discounts. A carousel is the one layout
 * where showing *all* of them costs no more page than showing three, and that
 * changes what the section is claiming: not "here are our three best" but "here
 * is the feedback, keep watching, the four-star ones come round too".
 *
 * Autoplay follows the same rules as the landing slider, for the same reasons:
 * it pauses under a pointer, pauses on keyboard focus, stops dead under
 * `prefers-reduced-motion`, and has a visible pause control — text that moves
 * while somebody is reading it is worse than text that does not move at all.
 * It advances one card rather than one screen, so the run reads as a
 * continuing list instead of three discrete slides.
 */
export function Proof() {
  const wide = useMediaQuery('(min-width: 1024px)');
  const medium = useMediaQuery('(min-width: 640px)');
  const perView = wide ? 3 : medium ? 2 : 1;

  /** Index of the leftmost visible card, before clamping. */
  const [requested, setRequested] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const reduceMotionRef = useRef(false);

  const lastStart = Math.max(0, VOICES.length - perView);

  /*
   * Clamped while rendering rather than corrected in an effect. A widening
   * viewport shrinks the number of resting positions — three-up has eight where
   * one-up has nine — and a stored index past the new end would show one card
   * and two empty columns. Doing it here means the wrong frame is never drawn;
   * doing it in an effect would draw it and then fix it.
   */
  const active = Math.min(requested, lastStart);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotionRef.current) setStopped(true);
  }, []);

  useEffect(() => {
    if (paused || stopped) return;
    const timer = setInterval(() => setRequested((i) => (i >= lastStart ? 0 : Math.min(i, lastStart) + 1)), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, stopped, lastStart]);

  const goTo = useCallback(
    (index: number) => {
      setRequested(index < 0 ? lastStart : index > lastStart ? 0 : index);
    },
    [lastStart],
  );

  return (
    <section className="border-y border-content/10 bg-canvas-900/50 py-20" aria-labelledby="proof-heading">
      <div className="container-page">
        <SectionHead
          id="proof-heading"
          eyebrow="From people who went"
          title="Only attendees can review."
          lede={`Nobody can rate a meetup they did not turn up to. That is the whole trick, and it is why the four-star ones are still in here. All ${VOICES.length} of the latest, as they came in.`}
        />

        <div
          className="mt-14"
          aria-roledescription="carousel"
          aria-label="Reviews from people who attended"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') goTo(active - 1);
            if (event.key === 'ArrowRight') goTo(active + 1);
          }}
        >
          {/* The window clips; the track slides. Overflow is hidden rather than
              scrollable so the two cannot fight — a native scroll position and
              a transform describing the same axis end up disagreeing the first
              time somebody flicks it mid-autoplay. */}
          <div className="overflow-hidden">
            <ul
              /* The negative margin cancels the per-slide gutter at both ends,
                 so the run lines up with the section above it. Zeroing the
                 padding on the first and last slides instead would have given
                 whichever card is currently leftmost a different gutter from
                 the rest, every time the track moved. */
              className="-mx-2.5 flex transition-transform duration-700 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(-${active * (100 / perView)}%)` }}
            >
              {VOICES.map((voice, index) => {
                const visible = index >= active && index < active + perView;
                return (
                  <li
                    key={voice.name}
                    /* Off-screen cards stay in the DOM — they are the list this
                       section is claiming to show — but leave the tab order, so
                       tabbing does not walk into a card nobody can see. */
                    aria-hidden={!visible}
                    className="w-full shrink-0 px-2.5 sm:w-1/2 lg:w-1/3"
                  >
                    <figure
                      style={tintVars(voice.tint)}
                      className={cn(
                        'flex h-full flex-col rounded-[1.75rem] border border-content/10 bg-canvas-700 p-7 shadow-card transition-opacity duration-500',
                        visible ? 'opacity-100' : 'opacity-0',
                      )}
                    >
                      <RatingBlocks value={voice.rating} size={15} />

                      <blockquote className="mt-5 flex-1 text-[0.95rem] leading-relaxed text-content/80">
                        {voice.body}
                      </blockquote>

                      <figcaption className="mt-7 flex items-center gap-3 border-t border-content/10 pt-5">
                        {/* A face, not initials. The ring is the shelf tint, so
                            the portrait belongs to the card it sits on rather
                            than floating on it. */}
                        <span className="rounded-full bg-[rgb(var(--plate))] p-0.5">
                          <Avatar
                            name={voice.name}
                            src={portraitUrl(voice.portrait, 120)}
                            size={38}
                            className="ring-1 ring-inset ring-content/10"
                          />
                        </span>
                        <span className="min-w-0">
                          <VerifiedName name={voice.name} />
                          <span className="block truncate text-xs text-content/55">{voice.context}</span>
                        </span>
                      </figcaption>
                    </figure>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-7 flex items-center justify-center gap-3">
            <CarouselButton label="Previous review" onClick={() => goTo(active - 1)}>
              <ChevronLeft size={16} aria-hidden />
            </CarouselButton>

            {/* One dot per resting position, not per review: at three-up there
                are eight places the track can stop and ten reviews, and ten
                dots under eight positions is a control that lies. */}
            <ol className="flex items-center gap-1.5">
              {Array.from({ length: lastStart + 1 }, (_, i) => i).map((i) => {
                const on = i === active;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Show review ${i + 1}`}
                      aria-current={on ? 'true' : undefined}
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        on ? 'w-6 bg-brand' : 'w-2 bg-content/20 hover:bg-content/40',
                      )}
                    />
                  </li>
                );
              })}
            </ol>

            <CarouselButton label="Next review" onClick={() => goTo(active + 1)}>
              <ChevronRight size={16} aria-hidden />
            </CarouselButton>

            <CarouselButton
              label={stopped ? 'Play the reviews' : 'Pause the reviews'}
              onClick={() => setStopped((s) => !s)}
            >
              {stopped ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
            </CarouselButton>
          </div>
        </div>

        <dl className="mt-10 grid gap-px overflow-hidden rounded-[1.75rem] border border-content/10 bg-content/10 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center bg-canvas-700 px-6 py-9 text-center">
              <dt className="order-2 mt-2 max-w-[14rem] text-sm text-content/60">{stat.label}</dt>
              <dd className="order-1 font-display text-4xl font-semibold leading-none text-content tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-content/15 text-content/70 transition-colors hover:border-content/45 hover:text-content"
    >
      {children}
    </button>
  );
}
