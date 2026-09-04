import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * One figure. Deliberately plain: a dashboard's job is to be read at a glance
 * and then acted on, and every gradient added here is a millisecond spent not
 * reading the number.
 */
export function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}) {
  return (
    <div className="surface-card p-5">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-content/45">{label}</p>
      <p
        className={cn(
          'mt-2 font-display text-3xl font-semibold tabular-nums',
          tone === 'good' && 'text-signal-600',
          tone === 'warn' && 'text-brand',
          tone === 'bad' && 'text-brand-700',
          tone === 'neutral' && 'text-content',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-sm text-content/60">{hint}</p>}
    </div>
  );
}

/** A labelled section inside a dashboard page. */
export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('surface-card overflow-hidden', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-content/10 px-5 py-4">
        <h2 className="font-display text-base font-semibold text-content">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
