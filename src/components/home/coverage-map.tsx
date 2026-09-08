'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { CityTier } from '@/types';

/** One city, already projected on the server — see `city-strip.tsx`. */
export interface CityPoint {
  slug: string;
  name: string;
  state: string;
  tier: CityTier;
  x: number;
  y: number;
  count: number;
}

/** Labelled so the cloud reads as a country: one per compass corner. */
const ANCHORS = new Set(['Delhi', 'Mumbai', 'Chennai', 'Kolkata']);

/**
 * Dot radius by tier.
 *
 * The plot used to size by "has something on the board", which at thirty-eight
 * cities said nothing a visitor could use — every dot was one of two sizes and
 * the two were a day's scheduling apart. Tier is the stable fact, and sizing by
 * it makes the shape of the network legible without a legend: the big marks are
 * the metros, and the map is visibly not only made of them.
 */
const RADIUS: Record<CityTier, number> = { 1: 3.4, 2: 2.8, 3: 2.2 };

/**
 * Coverage, plotted — and the plot and the list are one control.
 *
 * The map answers "is this a real network" at a glance; the list answers "can I
 * click through to my city". They used to be two things sitting beside each
 * other, which meant the map was decoration: nothing you did to it did
 * anything. Linking them makes each the legend for the other — point at Delhi
 * in the list and the dot lights up in the north; point at a dot in the south
 * and it names itself.
 *
 * Hovering anything dims everything else. That is the whole point of the
 * gesture: the useful question is never "where is this dot" but "which of
 * these is the one I mean", and dropping the rest back is what answers it. It
 * mattered most at 119 marks, mattered least at ten, and matters again at
 * thirty-eight — which is why it survived the years the map was small.
 *
 * The dots are mouse affordances only — `aria-hidden`, and out of the tab order
 * — because a row of tabbable circles is a worse route to a city page than the
 * list beside them. The list is the accessible control, and focusing a name there
 * drives the same highlight a hover does, so keyboard users get the map too.
 */
export function CoverageMap({
  points,
  width,
  height,
  named,
  remaining,
  stats,
}: {
  points: CityPoint[];
  width: number;
  height: number;
  /** The handful spelled out beside the plot. */
  named: CityPoint[];
  remaining: number;
  stats: { value: string; label: string }[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const current = active ? points.find((p) => p.slug === active) : undefined;

  const clear = () => setActive(null);

  return (
    <div className="grid items-center gap-8 p-6 sm:p-8 md:grid-cols-[20rem_1fr] md:gap-10">
      <div className="relative w-full" onMouseLeave={clear}>
        {/* One soft wash behind the plot so the cloud sits on something rather
            than floating on the card. A token gradient, so it follows the
            palette and the light/dark switch. */}
        <div aria-hidden className="pointer-events-none absolute inset-6 rounded-full bg-brand/[0.07] blur-2xl" />

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="relative h-auto w-full text-brand"
          role="img"
          aria-label={`${points.length} cities with a board, plotted across India`}
        >
          <g aria-hidden>
            {points.map((point) => {
              const on = active === point.slug;
              const anchor = ANCHORS.has(point.name);
              const dimmed = Boolean(active) && !on;

              return (
                <Link
                  key={point.slug}
                  href={`/meetups?city=${point.slug}`}
                  tabIndex={-1}
                  aria-hidden
                  onMouseEnter={() => setActive(point.slug)}
                  className="outline-none"
                >
                  {/* A 2.6px dot is not a hit target. The transparent disc over
                      it is, and it is what makes the cloud usable with a mouse
                      at all. */}
                  <circle cx={point.x} cy={point.y} r={7} fill="transparent" className="cursor-pointer" />

                  {on && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={7}
                      fill="currentColor"
                      fillOpacity={0.18}
                      className="pointer-events-none"
                    />
                  )}

                  {/* Size is the tier; opacity is whether anything is on the
                      board there today. Two facts, two channels, so neither
                      has to be guessed from the other. */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={on ? RADIUS[point.tier] + 1 : RADIUS[point.tier]}
                    fill="currentColor"
                    fillOpacity={on ? 1 : dimmed ? 0.2 : point.count > 0 || anchor ? 0.95 : 0.5}
                    className="pointer-events-none transition-all duration-200"
                  />
                </Link>
              );
            })}

            {/* The four corner labels step aside while something is selected —
                the floating label is saying the same kind of thing, louder. */}
            {points
              .filter((p) => ANCHORS.has(p.name))
              .map((point) => (
                <text
                  key={point.slug}
                  x={point.x + 6}
                  y={point.y + 3.2}
                  className={`pointer-events-none fill-content/70 text-[9px] font-semibold transition-opacity duration-200 ${
                    active ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {point.name}
                </text>
              ))}
          </g>
        </svg>

        {/* An HTML label rather than SVG text: it gets the card's own border,
            shadow and type tokens for free, and SVG has no way to size a
            rounded plate to a string without measuring it first. */}
        {current && (
          <span
            aria-hidden
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-content/10 bg-canvas-700 px-2.5 py-1.5 text-xs shadow-card"
            style={{
              left: `${(current.x / width) * 100}%`,
              top: `calc(${(current.y / height) * 100}% - 0.6rem)`,
            }}
          >
            <span className="font-semibold text-content">{current.name}</span>
            <span className="text-content/55"> · {current.state}</span>
            {current.count > 0 && (
              <span className="ml-1.5 font-semibold text-brand-700">{current.count} on the board</span>
            )}
          </span>
        )}
      </div>

      <div className="min-w-0 md:self-start md:pt-2">
        <dl className="flex gap-10">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dd className="font-display text-3xl font-semibold leading-none text-content tabular-nums">
                {stat.value}
              </dd>
              <dt className="mt-1.5 max-w-[9rem] text-xs leading-snug text-content/60">{stat.label}</dt>
            </div>
          ))}
        </dl>

        {/* Named, not listed. A run of chips reads as a tag cloud; a sentence of
            links reads as prose that happens to be navigable, which is what it
            is — and each name drives the plot beside it. */}
        <p
          className="mt-7 border-t border-content/10 pt-6 text-sm leading-relaxed text-content/60"
          onMouseLeave={clear}
        >
          {named.map((point, i) => (
            <span key={point.slug}>
              {i > 0 && <span aria-hidden> · </span>}
              <Link
                href={`/meetups?city=${point.slug}`}
                onMouseEnter={() => setActive(point.slug)}
                onFocus={() => setActive(point.slug)}
                onBlur={clear}
                className={`rounded font-medium underline-offset-4 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
                  active === point.slug ? 'text-brand-700 underline' : 'text-content/80'
                }`}
              >
                {point.name}
              </Link>
            </span>
          ))}
          {/* Every city is named when they all fit, and a list that ends
              "and 0 more" is worse than one that simply ends. */}
          {remaining > 0 && (
            <>
              <span aria-hidden> · </span>
              <span>and {remaining} more.</span>
            </>
          )}
        </p>

        <Link
          href="/cities"
          className="link-underline mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-content"
        >
          See the full directory <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
