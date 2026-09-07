import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * One heading treatment for every section down the landing page.
 *
 * The page used to open each section with whatever shape it happened to want:
 * a sticky editorial column here, a left-aligned pair there, two adjacent
 * sections inventing the same sticky layout twice. Six different rhythms is
 * what makes a long page read as assembled rather than designed, so the
 * sections below the fold now all start the same way — centred, narrow
 * measure, one optional line of support — and spend their differences on the
 * content underneath instead.
 *
 * Centred, because these sections are being read rather than used. The board
 * and the activity index above them stay left-aligned for the opposite reason.
 */
export function SectionHead({
  eyebrow,
  title,
  lede,
  id,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  /** Wire this to the section's own `aria-labelledby`. */
  id?: string;
  /** Buttons or links that belong with the heading rather than the content. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-3xl text-center', className)}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="section-title mt-3 text-balance text-content">
        {title}
      </h2>
      {lede && <p className="lede mx-auto mt-4 max-w-xl text-pretty">{lede}</p>}
      {children && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}
