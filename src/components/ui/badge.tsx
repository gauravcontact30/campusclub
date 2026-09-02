import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'orchid' | 'parrot' | 'zest' | 'dark';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-frost/8 text-frost/70 border-frost/15',
    orchid: 'bg-orchid/15 text-orchid-700 border-orchid/35',
    parrot: 'bg-parrot/15 text-parrot-600 border-parrot/35',
    zest: 'bg-zest/15 text-zest border-zest/35',
    dark: 'bg-noir-600 text-frost border-frost/20',
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
