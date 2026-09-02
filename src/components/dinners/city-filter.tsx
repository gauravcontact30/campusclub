'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CITIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function CityFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get('city') ?? '';

  function go(city: string) {
    router.push(city ? `/dinners?city=${city}` : '/dinners');
  }

  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
      <button
        onClick={() => go('')}
        aria-pressed={active === ''}
        className={cn(
          'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
          active === '' ? 'border-ember bg-ember text-content' : 'border-content/15 text-content/70 hover:border-content/40',
        )}
      >
        All cities
      </button>
      {CITIES.map((city) => (
        <button
          key={city.slug}
          onClick={() => go(city.slug)}
          aria-pressed={active === city.slug}
          className={cn(
            'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            active === city.slug ? 'border-ember bg-ember text-content' : 'border-content/15 text-content/70 hover:border-content/40',
          )}
        >
          {city.name}
        </button>
      ))}
    </div>
  );
}
