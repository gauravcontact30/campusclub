import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'flame' | 'sage' | 'gold' | 'dark';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-ink/5 text-ink/70 border-ink/10',
    flame: 'bg-flame/10 text-flame-700 border-flame/20',
    sage: 'bg-sage/20 text-ink-600 border-sage/40',
    gold: 'bg-gold/20 text-ink-700 border-gold/40',
    dark: 'bg-ink text-cream border-ink',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
