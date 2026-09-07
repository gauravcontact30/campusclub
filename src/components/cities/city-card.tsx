import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BedDouble, Dumbbell, Landmark, UtensilsCrossed } from 'lucide-react';
import type { City } from '@/types';
import { tierInfo } from '@/lib/constants';
import { cityGuide } from '@/lib/data/city-guide';
import { cityPhoto } from '@/lib/media/city-photos';

/**
 * One city, at the size where a city is worth reading about.
 *
 * The directory used to be a name and a number, on the argument that a hundred
 * and nineteen rows have no room for anything else. Six at a time is a
 * different constraint entirely — with a state chosen and a page of six, there
 * is room to answer the question a name alone leaves open: what is it actually
 * like there, and is there anything to do.
 *
 * The photograph is the whole reason the card works. Even a metro is a name
 * before it is a place to somebody who has not been, and Mainpuri and Etawah
 * are only names to almost everyone; one real photograph does more to make a
 * city legible than four lines of prose can. So it is a real photograph — the lead
 * image of that city's own Wikipedia article, or a named landmark in the same
 * district — and never a stock shot of Somewhere In India, which would make
 * every card a lie in the same direction.
 *
 * Two consequences follow, and both are deliberate:
 *
 *  • The credit is on the card, not in a footer. These are freely licensed
 *    photographs and attribution is the condition of using them, so it travels
 *    with the picture rather than being collected somewhere nobody scrolls.
 *  • The four detail sections are drawn only when there is something true to
 *    put in them, which is why a Bengaluru card is twice the height of a
 *    Mainpuri one. That unevenness is the honest shape of the data — see the
 *    note in `lib/data/city-guide.ts`.
 */
export function CityCard({ city, count }: { city: City; count: number }) {
  const guide = cityGuide(city.slug);
  const photo = cityPhoto(city.slug);
  const tier = tierInfo(city.tier);

  const sections = [
    { key: 'places', label: 'Known for', icon: Landmark, items: guide.places },
    { key: 'eat', label: 'Eat', icon: UtensilsCrossed, items: guide.eat },
    { key: 'stay', label: 'Stay', icon: BedDouble, items: guide.stay },
    { key: 'play', label: 'Play', icon: Dumbbell, items: guide.play },
  ].filter((section): section is typeof section & { items: string[] } => Boolean(section.items?.length));

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-content/10 bg-canvas-700 shadow-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden bg-content/10">
        {photo && (
          <Image
            src={photo.src}
            alt={`${photo.article}, ${city.name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}

        {/* The name sits on the photograph rather than under it. A card that
            captions its picture reads as an article; a card that titles it
            reads as the place itself, which is what this is. The scrim is
            weighted to the foot because that is the only part the type needs,
            and dimming the whole frame would flatten every photograph on the
            page to the same grey. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 via-55% to-black/10"
        />

        {/* Which tier, said on the picture rather than in the body copy. It is
            the one fact about a city that changes what somebody should expect
            of the board before they open it — a metro is already busy, a
            Tier-2 city is filling, a district town may be four people and a
            table — and it is the field the directory filters on, so a card that
            arrived from a filter should show what it matched. */}
        <span className="absolute left-5 top-5 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
          {tier.label}
        </span>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
          <div className="min-w-0">
            {/* Type over a photograph is white in both themes — the same
                decision AuthShell makes for the same reason: a photograph is
                the one surface here whose brightness the palette does not
                control, so text over it cannot be a palette colour. */}
            <h3 className="font-display text-2xl font-semibold leading-tight text-white">
              {/* The pseudo-element makes the whole card clickable without
                  nesting this link inside another one, which would be invalid
                  and unnavigable. Everything below that needs its own click
                  is lifted above it with `relative z-10`. */}
              <Link
                href={`/cities/${city.slug}`}
                className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:underline"
              >
                {city.name}
              </Link>
            </h3>
            <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white/70">{city.state}</p>
          </div>

          {count > 0 ? (
            <span className="relative z-10 shrink-0 rounded-full bg-brand px-2.5 py-1 text-[0.7rem] font-bold tabular-nums text-on-brand">
              {count}
              <span className="sr-only"> meetups on the board</span>
            </span>
          ) : (
            <span className="relative z-10 shrink-0 rounded-full border border-white/30 bg-black/25 px-2.5 py-1 text-[0.66rem] font-semibold text-white/85 backdrop-blur-sm">
              No board yet
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm leading-relaxed text-content/75">{city.blurb}</p>

        {sections.length > 0 ? (
          <dl className="mt-5 space-y-3.5 border-t border-content/10 pt-5">
            {sections.map(({ key, label, icon: Icon, items }) => (
              <div key={key} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand-700"
                >
                  <Icon size={13} />
                </span>
                <div className="min-w-0">
                  <dt className="text-[0.68rem] font-bold uppercase tracking-[0.13em] text-content/45">{label}</dt>
                  {/* One run of text rather than a bulleted list: four bullets
                      apiece across four sections is twenty-odd bullet points on
                      a card, and the eye stops reading any of them. */}
                  <dd className="mt-0.5 text-sm leading-relaxed text-content/75">{items.join(' · ')}</dd>
                </div>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-5 border-t border-content/10 pt-5 text-sm leading-relaxed text-content/50">
            We have not written this one up yet. If you live here, the city page is the place to tell us what belongs
            on this card.
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <span className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-content transition-colors group-hover:text-brand">
            What’s on in {city.name}
            <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </span>

          {photo?.artist && (
            <p className="shrink-0 text-right text-[0.62rem] leading-tight text-content/35">
              Photo: {photo.artist}
              {photo.licence && <span className="block">{photo.licence}</span>}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
