import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * A V inside a ring — the members-club badge, which is the register the name
 * asks for. The ring is the club; the V is the name.
 *
 * The V is drawn as three points rather than a glyph so it never depends on a
 * font being available, and it sits a touch below the ring's centre because a
 * V carries its visual weight high — optically centred, not mathematically.
 *
 * Everything is `currentColor` and equal-stroke throughout, so one file serves
 * the lockup, the favicon and any single-colour use.
 */
function ClubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn('h-9 w-9', className)}>
      <circle
        cx="20"
        cy="20"
        r="14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="origin-center transition-transform duration-500 group-hover:scale-105"
      />
      <path
        d="M13 14.5 L20 27 L27 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="VibeClub home"
      className={cn(
        'group inline-flex items-center gap-2.5 font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-content',
        className,
      )}
    >
      <ClubMark className="text-brand" />
      <span>
        Vibe<span className="text-brand">Club</span>
      </span>
    </Link>
  );
}
