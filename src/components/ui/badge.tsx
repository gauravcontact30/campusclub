import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'ember' | 'marigold' | 'honey' | 'dark';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-content/8 text-content/70 border-content/15',
    ember: 'bg-ember/15 text-ember-700 border-ember/35',
    marigold: 'bg-marigold/15 text-marigold-600 border-marigold/35',
    honey: 'bg-honey/15 text-honey border-honey/35',
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
