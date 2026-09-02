import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'rouge' | 'blush' | 'petal' | 'dark';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-content/8 text-content/70 border-content/15',
    rouge: 'bg-rouge/15 text-rouge-700 border-rouge/35',
    blush: 'bg-blush/15 text-blush-600 border-blush/35',
    petal: 'bg-petal/15 text-petal border-petal/35',
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
