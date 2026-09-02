'use client';

import type { WeekHours } from '@/types';
import { cn, isOpenNow, openStatusLabel } from '@/lib/utils';
import { useClientValue } from '@/hooks/use-client-value';

/**
 * Open/closed depends on the visitor's clock, so it is resolved after hydration.
 * Rendering it on the server would risk a mismatch at the exact minute a venue
 * opens or closes.
 */
export function OpenNowBadge({ hours, className }: { hours: WeekHours; className?: string }) {
  const open = useClientValue(() => isOpenNow(hours));
  const label = useClientValue(() => openStatusLabel(hours));

  if (open === null || label === null) {
    return <span className={cn('inline-block h-5 w-24 rounded-full bg-pearl/5', className)} aria-hidden />;
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', open ? 'bg-blush-600' : 'bg-rouge')} />
      <span className={open ? 'text-blush-600' : 'text-pearl/55'}>
        {open ? 'Open now' : 'Closed'} · {label}
      </span>
    </span>
  );
}
