import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Two circles: places, and people. SitNext is both — a directory of somewhere to
 * go, and a table of who to go with — and the business is the part where they
 * meet. So the overlap is the only thing filled in.
 *
 * Geometry is exact rather than eyeballed. Equal radii of 11 on centres twelve
 * apart put the intersections at x = 20, y = 20 ± sqrt(11² − 6²), and each side
 * of the lens spans 114°, which is why both arcs take large-arc-flag 0.
 *
 * Everything is `currentColor` and the lens is a closed path rather than a shape
 * painted in the page colour — the mark is genuinely one colour on any ground,
 * which is what lets it survive a letterhead, a receipt, or a favicon.
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
      aria-label="SitNext home"
      className={cn(
        'group inline-flex items-center gap-2.5 font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-content',
        className,
      )}
    >
      <OverlapMark className="text-brand" />
      <span>
        Sit<span className="text-brand">Next</span>
      </span>
    </Link>
  );
}
