import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * The mark is the product in one glyph: a round table, five seats taken, and one
 * still open — the seat you are being offered. The open seat is the only thing
 * drawn in parrot green, so it reads as the subject even at favicon size.
 *
 * Geometry is on a 40×40 grid with the seats on a circle of radius 14.5 about
 * the centre, so the mark stays optically balanced at any size.
 */
function TableMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn('h-9 w-9', className)}>
      <circle cx="20" cy="20" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.95" />
      {/* Five taken seats, clockwise from the top */}
      <circle cx="20" cy="5.5" r="2.75" fill="currentColor" opacity="0.55" />
      <circle cx="32.6" cy="12.8" r="2.75" fill="currentColor" opacity="0.55" />
      <circle cx="32.6" cy="27.2" r="2.75" fill="currentColor" opacity="0.55" />
      <circle cx="20" cy="34.5" r="2.75" fill="currentColor" opacity="0.55" />
      <circle cx="7.4" cy="27.2" r="2.75" fill="currentColor" opacity="0.55" />
      {/* The open seat. Slightly larger, and the one element that carries colour. */}
      <circle
        cx="7.4"
        cy="12.8"
        r="3.4"
        className="fill-parrot origin-[7.4px_12.8px] transition-transform duration-300 group-hover:scale-125"
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
        'group inline-flex items-center gap-2.5 font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-frost',
        className,
      )}
    >
      <TableMark className="text-orchid" />
      <span>
        Sit<span className="text-orchid">Next</span>
      </span>
    </Link>
  );
}
