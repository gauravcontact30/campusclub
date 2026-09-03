import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * A table seen from above: a heavy ring of seats with one place still open, and
 * the person about to take it sitting in the gap. The silhouette is a C, so it
 * doubles as the monogram.
 *
 * The weight is the point. A hairline outline disappears against a strong red
 * at 16px and reads as timid at any size, so the ring is stroked at 6 on r=12 —
 * a solid band rather than a line — which is what lets the mark sit beside a
 * serif wordmark without looking like a diagram of one.
 *
 * The geometry is derived, not eyeballed: a 52° opening centred on 3 o'clock
 * puts the arc's ends at 26° and 334°, giving 308° of sweep — hence
 * large-arc-flag 1 — and a chord of 10.52 across the gap. The dot is 8 across,
 * so it clears the band by 1.26 on each side: near enough to belong to the
 * opening, far enough not to weld shut when the whole thing is 16 pixels wide.
 *
 * Everything is `currentColor` and nothing is knocked out in the page colour,
 * so one file serves the brand lockup, a stamped receipt and a disabled state.
 */
function CampusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn('h-8 w-8', className)}>
      <path
        d="M30.79 25.26 A12 12 0 1 1 30.79 14.74"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle
        cx="32"
        cy="20"
        r="4"
        fill="currentColor"
        className="origin-center transition-transform duration-500 group-hover:scale-[1.15]"
      />
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
      <CampusMark className="shrink-0 text-brand" />
      <span className="whitespace-nowrap">
        Campus<span className="text-brand">Club</span>
      </span>
    </Link>
  );
}
