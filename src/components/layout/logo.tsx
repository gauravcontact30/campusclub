import Link from 'next/link';
import { cn } from '@/lib/utils';

const ROUGE = '#F43F5E';
const BLUSH = '#FF8FA3';

/**
 * Six people seated around a round table, seen from above: each is a head with
 * a shoulder cap curving behind it, facing in.
 *
 * The seats alternate between the two rose tones and between two silhouettes —
 * a plain head, and a head with hair gathered above it — so the group reads as
 * mixed rather than as six copies of one person. The hair is a separate small
 * disc rather than a wider head, because at 32px a wider head just reads as a
 * bigger head; a detached mark still reads as a different hairstyle.
 *
 * Every seat is the same figure rotated about the table centre, so the ring
 * stays perfectly even however the geometry is tuned. The shoulder cap is
 * struck about the head, not about the table, which is what stops it drifting
 * off as a crescent.
 */
const SEATS = [0, 60, 120, 180, 240, 300];

function Seat({ angle, index }: { angle: number; index: number }) {
  const gathered = index % 2 === 1;
  const fill = gathered ? BLUSH : ROUGE;
  return (
    <g transform={`rotate(${angle} 20 20)`}>
      <path d="M16.5 6 A3.5 3.5 0 0 1 23.5 6" fill="none" stroke={fill} strokeWidth="1.9" strokeLinecap="round" />
      {gathered && <circle cx="20" cy="2.9" r="1.1" fill={fill} />}
      <circle cx="20" cy="6" r="2" fill={fill} />
    </g>
  );
}

function TableMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn('h-9 w-9', className)}>
      <circle cx="20" cy="20" r="8.6" fill={ROUGE} opacity="0.22" />
      <circle cx="20" cy="20" r="8.6" fill="none" stroke={ROUGE} strokeWidth="1.9" />
      {SEATS.map((angle, i) => (
        <Seat key={angle} angle={angle} index={i} />
      ))}
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="SitNext home"
      className={cn(
        'group inline-flex items-center gap-2.5 font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-pearl',
        className,
      )}
    >
      {/* The table turns on hover — the one animation the mark asks for */}
      <TableMark className="transition-transform duration-500 group-hover:rotate-[60deg]" />
      <span>
        Sit<span className="text-rouge">Next</span>
      </span>
    </Link>
  );
}
