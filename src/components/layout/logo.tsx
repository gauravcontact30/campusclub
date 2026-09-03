import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Two rings, and the overlap filled. A club is not one circle of people but two
 * that found each other — the vibe is the part they share, so it is the only
 * element solid.
 *
 * The geometry is derived, not eyeballed: equal radii of 11 on centres twelve
 * apart put the intersections at x = 20, y = 20 ± sqrt(11² − 6²), and each side
 * of the lens spans 114°, which is why both arcs carry large-arc-flag 0.
 *
 * Everything is `currentColor`, and the lens is a closed path rather than a
 * shape painted in the page colour — a knockout filled with the background
 * stops being a logo the moment it lands on a surface nobody anticipated.
 */
function OverlapMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn('h-9 w-9', className)}>
      <circle cx="14" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="26" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="3" />
      <path
        d="M20 10.78 A11 11 0 0 1 20 29.22 A11 11 0 0 1 20 10.78 Z"
        fill="currentColor"
        className="origin-center transition-transform duration-500 group-hover:scale-110"
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
      <OverlapMark className="text-brand" />
      <span>
        Vibe<span className="text-brand">Club</span>
      </span>
    </Link>
  );
}
