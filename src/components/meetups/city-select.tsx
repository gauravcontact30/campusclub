'use client';

import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { CITIES } from '@/lib/constants';
import { ComboSelect, type ComboOption } from '@/components/ui/combo-select';
import { cn } from '@/lib/utils';

/**
 * The "where" half of the search bar.
 *
 * All of the behaviour — the portalled panel, the type-to-filter, the keyboard
 * walk, the clear row — now lives in ComboSelect, because the state filter on
 * /cities needs exactly the same control and was making do with a native
 * `<select>` that is unreadable in the dark theme. This file is just the city
 * list and the trigger's width.
 */
export function CitySelect({
  value,
  onChange,
  size = 'md',
  className,
  id,
}: {
  value: string;
  onChange: (slug: string) => void;
  size?: 'md' | 'lg';
  className?: string;
  id?: string;
}) {
  const options = useMemo<ComboOption[]>(
    () => CITIES.map((c) => ({ value: c.slug, label: c.name, sublabel: c.state })),
    [],
  );

  return (
    <ComboSelect
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      clearOption={{ value: '', label: 'Any city', sublabel: 'Everywhere we run' }}
      icon={MapPin}
      placeholder="Any city"
      srLabel="Which city? "
      listLabel="City"
      searchLabel="Search cities"
      searchPlaceholder="Search cities…"
      noun="city"
      size={size}
      // The cap tightens on small screens: at 11rem the city field and the
      // submit button between them left the "what" input about 58px of usable
      // width on a phone, so its placeholder read "Study, badm". The label
      // inside already truncates.
      className={cn('max-w-[8rem] sm:max-w-[11rem]', className)}
    />
  );
}
