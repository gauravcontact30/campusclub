import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Three people arriving from three directions and just touching: not a fused
 * huddle, which reads as one smudged blob at 16px, but three discrete discs
 * pulled in until their edges meet. That is the whole idea in one shape —
 * separate people, converging — and it is what a ring or a single monogram
 * cannot say.
 *
 * Colour carries the same hierarchy the rest of the product uses: brand for
 * the one in front, ink for the one it just meets, signal for the one still
 * arriving. Ink rather than a second brand tint, because two reds a step
 * apart collapse into each other at favicon size, where the point is three
 * legible people, not a gradient.
 *
 * The pairwise gaps are −0.1 to 2.4 units — deliberately near zero rather than
 * generously overlapped or generously spaced, so the cluster survives being
 * shrunk to a 16px tab icon without either fusing into a blob or scattering
 * into three unrelated dots.
 */
function CampusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn('h-8 w-8', className)}>
      <circle cx="21" cy="10" r="6" fill="rgb(var(--signal))" />
      <circle cx="29" cy="22" r="8.5" fill="rgb(var(--content))" />
      <circle
        cx="13"
        cy="24"
        r="10"
        fill="rgb(var(--brand))"
        className="origin-[13px_24px] transition-transform duration-500 group-hover:scale-[1.06]"
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
