'use client';

import type { WeekHours } from '@/types';
import { WEEKDAYS } from '@/lib/constants';
import { to12h, weekIndex, cn } from '@/lib/utils';
import { useClientValue } from '@/hooks/use-client-value';

export function HoursTable({ hours }: { hours: WeekHours }) {
  // Highlighting "today" is clock-dependent, so it resolves after hydration.
  const today = useClientValue(() => weekIndex());

  return (
    <dl className="divide-y divide-ink/10">
      {WEEKDAYS.map((day, i) => (
        <div
          key={day}
          className={cn('flex items-center justify-between py-2.5 text-sm', today === i && 'font-semibold text-ink')}
        >
          <dt className={today === i ? '' : 'text-ink/60'}>{day}</dt>
          <dd className={hours[i].open ? '' : 'text-ink/40'}>
            {hours[i].open && hours[i].close ? `${to12h(hours[i].open!)} – ${to12h(hours[i].close!)}` : 'Closed'}
          </dd>
        </div>
      ))}
    </dl>
  );
}
