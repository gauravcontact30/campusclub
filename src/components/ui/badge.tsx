import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'signal' | 'glint' | 'dark';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-content/8 text-content/70 border-content/15',
    brand: 'bg-brand/15 text-brand-700 border-brand/35',
    signal: 'bg-signal/15 text-signal-600 border-signal/35',
    glint: 'bg-glint/15 text-glint border-glint/35',
    dark: 'bg-canvas-600 text-content border-content/20',
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
