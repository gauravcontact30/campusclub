import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Three friends, not three dots: a head-and-shoulders silhouette reads as a
 * person the instant it is seen, which an abstract disc has to be told to
 * mean. Each shoulder shape is an arc anchored below the visible frame, so it
 * is cropped by the root `<svg>`'s own viewport clip rather than a hand-drawn
 * outline — the same trick a generic "account" glyph uses, borrowed here
 * three times over.
 *
 * The small fourth circle top-right is the conversation, not a fourth person:
 * a lone accent standing in for a raised hand or a word dropped into the
 * circle, which is cheaper to read at a glance than an actual speech-bubble
 * tail and survives shrinking far better.
 *
 * Colour keeps the hierarchy the rest of the product already uses: brand for
 * the friend in front, ink for the one beside them, signal for the one just
 * arriving — so the mark and a spots-left meter never disagree about what a
 * colour means.
 */
function CampusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn('h-8 w-8', className)}>
      <path d="M4 34a7 7 0 0 1 14 0z" fill="rgb(var(--signal))" />
      <circle cx="11" cy="16" r="6.6" fill="rgb(var(--signal))" />

      <path d="M21 34a7.4 7.4 0 0 1 14.8 0z" fill="rgb(var(--content))" />
      <circle cx="28.4" cy="15" r="6.9" fill="rgb(var(--content))" />

      <g className="origin-[20px_28px] transition-transform duration-500 group-hover:scale-[1.05]">
        <path d="M12 40a8.2 8.2 0 0 1 16.4 0z" fill="rgb(var(--brand))" />
        <circle cx="20.2" cy="20.5" r="7.6" fill="rgb(var(--brand))" />
      </g>

      <circle cx="30" cy="7" r="4.6" fill="rgb(var(--glint))" />
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
