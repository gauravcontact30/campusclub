import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * The opener every content page shares: an eyebrow, one headline in the display
 * serif, a lede, and optional actions. Having it in one place is what keeps
 * fourteen pages reading as one site rather than fourteen one-offs.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('border-b border-content/10', className)}>
      <div className="container-page py-14 sm:py-20">
        <div className="max-w-3xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="display-lg mt-3 text-balance text-content">{title}</h1>
          {lede && <p className="lede mt-5">{lede}</p>}
          {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
        </div>
      </div>
    </header>
  );
}

/**
 * Long-form body copy. Set in the UI face at a comfortable measure — a serif
 * body at this length is harder work than it looks, and the serif is doing
 * enough already in the headings.
 */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'max-w-[68ch] space-y-5 text-[0.98rem] leading-relaxed text-content/80',
        '[&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-content',
        '[&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-content',
        '[&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:list-disc [&_li]:marker:text-brand',
        '[&_ol]:space-y-2 [&_ol]:pl-5 [&_ol>li]:list-decimal',
        '[&_strong]:font-semibold [&_strong]:text-content',
        '[&_a]:underline [&_a]:decoration-brand [&_a]:decoration-2 [&_a]:underline-offset-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A "last reviewed" line for the legal set — undated policies age badly. */
export function Revised({ date }: { date: string }) {
  return (
    <p className="mb-10 text-sm text-content/55">
      Last reviewed {date}. We will say here when it changes, and email anyone it affects.
    </p>
  );
}

/** The cross-links at the foot of a content page, so nothing is a dead end. */
export function NextUp({ links }: { links: { href: string; label: string; blurb: string }[] }) {
  return (
    <section className="container-page border-t border-content/10 py-14" aria-labelledby="next-heading">
      <h2 id="next-heading" className="eyebrow">
        Next
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex h-full min-w-0 flex-col gap-1.5 rounded-2xl border border-content/12 bg-canvas-700 p-5 transition-colors hover:border-brand/45"
            >
              <span className="font-display text-lg font-semibold text-content group-hover:text-brand">
                {link.label}
              </span>
              <span className="text-sm leading-relaxed text-content/65">{link.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
