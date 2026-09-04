import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * A place, not just a person: the product is local meetups, and a location
 * pin says "right here" before anyone reads a word of the wordmark next to
 * it. The three dots inside are the people already there — the same
 * attendee-cluster idea as the hero's avatar stack, just small enough to
 * live inside a pin head.
 *
 * The dots sit ON the pin's fill, so they use `--on-brand` — the token this
 * codebase already reserves for exactly that relationship — rather than
 * `--content`, which flips with the theme independently of what colour the
 * pin happens to be. One dot takes `--glint` instead, purely so three
 * identical white dots don't read as a single blob at 16px.
 *
 * The whole mark drops half a pixel on hover, like a map pin settling into
 * place — a smaller, quieter gesture than a scale, and one a pin shape
 * specifically earns.
 */
function CampusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn('h-8 w-8', className)}>
      <g className="origin-bottom transition-transform duration-300 group-hover:-translate-y-0.5">
        <path
          d="M20 3c-7.2 0-13 5.8-13 13 0 9.7 13 21 13 21s13-11.3 13-21c0-7.2-5.8-13-13-13z"
          fill="rgb(var(--brand))"
        />
        <circle cx="15.5" cy="17.5" r="3" fill="rgb(var(--glint))" />
        <circle cx="20.5" cy="14" r="3" fill="rgb(var(--on-brand))" />
        <circle cx="24.5" cy="18" r="3" fill="rgb(var(--on-brand))" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="CampusClub home"
      className={cn(
        // The wordmark sits in the display serif at a weight below its heaviest,
        // which is where Fraunces still shows its contrast instead of filling in.
        'group inline-flex items-center gap-2.5 font-display text-[1.4rem] font-semibold tracking-[-0.02em] text-content',
        className,
      )}
    >
      <CampusMark className="shrink-0" />
      <span className="whitespace-nowrap">
        Campus<span className="text-brand">Club</span>
      </span>
    </Link>
  );
}
