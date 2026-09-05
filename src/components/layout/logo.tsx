import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * A crest, not a pin. The product spans two audiences with one artifact each
 * already recognises: a campus ID or society crest for students, a
 * credential or "verified" badge for professionals. A shield is the one
 * shape native to both worlds, rather than the overlapping-circles
 * "connection" mark every meetup/social app reaches for.
 *
 * The two lower fields are `--brand` and `--signal` — the same coordinated
 * pair every palette already defines (rose+teal, blue+amber, purple+brass…),
 * so the crest repaints correctly under all of them without a second colour
 * system of its own. The split itself is the one holdover from the
 * "two people/two things meeting" idea: still there, just load-bearing
 * inside a shape that means something on its own.
 *
 * The dark chief band and its single mark are `--content` and `--canvas` —
 * always each other's opposite by definition in this token system — rather
 * than a literal black-and-white pair, so the contrast holds regardless of
 * theme or palette instead of relying on one specific combination staying
 * lucky forever.
 */
function CampusMark({ id, className }: { id: string; className?: string }) {
  const clipId = `${id}-shield`;
  const shadowId = `${id}-shadow`;

  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn('h-8 w-8 overflow-visible', className)}>
      <defs>
        <clipPath id={clipId}>
          <path d="M6,8 L34,8 L34,19 C34,29 27,34 20,37 C13,34 6,29 6,19 Z" />
        </clipPath>
        <filter id={shadowId} x="-50%" y="-30%" width="200%" height="180%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="rgb(var(--brand))" floodOpacity="0.35" />
        </filter>
      </defs>
      <g
        className="origin-bottom transition-transform duration-300 group-hover:-translate-y-0.5"
        filter={`url(#${shadowId})`}
      >
        <g clipPath={`url(#${clipId})`}>
          <path d="M20,8 L6,8 L6,37 L20,37 Z" fill="rgb(var(--brand))" />
          <path d="M20,8 L34,8 L34,37 L20,37 Z" fill="rgb(var(--signal))" />
          <rect x="4" y="8" width="32" height="7" fill="rgb(var(--content))" />
          <circle cx="20" cy="11.5" r="2.1" fill="rgb(var(--canvas))" />
        </g>
      </g>
    </svg>
  );
}

/**
 * `id` disambiguates the SVG clip-path/filter ids when more than one Logo
 * renders on the same page — the header's and the footer's, today. A plain
 * prop rather than `useId()`, since exactly two call sites exist and both
 * already know which one they are.
 */
export function Logo({ id, className }: { id: string; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="CampusClub home"
      className={cn(
        // The wordmark sits in the display serif at a weight below its heaviest,
        // which is where Fraunces still shows its contrast instead of filling in.
        'group inline-flex items-center gap-2 font-display text-[1.4rem] font-semibold tracking-[-0.025em] text-content',
        className,
      )}
    >
      <CampusMark id={id} className="shrink-0" />
      <span className="whitespace-nowrap">
        Campus<span className="text-brand transition-colors duration-300 group-hover:text-brand-600">Club</span>
      </span>
    </Link>
  );
}
