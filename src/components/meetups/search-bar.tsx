'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { CITIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * One control that answers "what" and "where" together, welded into a single
 * pill with a hairline between the fields and the submit riding inside the
 * right edge. It is the densest, most familiar way to start a local search, and
 * putting it in the header means the board is one keystroke away from anywhere
 * on the site.
 *
 * It submits as a real form, so Enter works from either field and the result is
 * a normal navigation to a URL somebody could have typed.
 */
export function SearchBar({
  defaultTerm = '',
  defaultCity = '',
  size = 'md',
  className,
}: {
  defaultTerm?: string;
  defaultCity?: string;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(defaultTerm);
  const [city, setCity] = useState(defaultCity);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (term.trim()) params.set('term', term.trim());
    if (city) params.set('city', city);
    router.push(`/meetups${params.toString() ? `?${params}` : ''}`);
  }

  const big = size === 'lg';

  return (
    <form onSubmit={onSubmit} role="search" className={cn('searchbar', big && 'shadow-lift', className)}>
      <label className="sr-only" htmlFor="q-what">
        What do you want to do?
      </label>
      <input
        id="q-what"
        name="term"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Study, badminton, 6am run…"
        className={cn('searchbar-field', big && 'py-4 text-base')}
      />

      <span className="searchbar-divide" aria-hidden />

      <label className="sr-only" htmlFor="q-where">
        Which city?
      </label>
      <select
        id="q-where"
        name="city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className={cn(
          'searchbar-field max-w-[9.5rem] cursor-pointer appearance-none font-medium',
          big && 'py-4 text-base',
        )}
      >
        <option value="">Any city</option>
        {CITIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        aria-label="Search meetups"
        className={cn(
          'm-1.5 flex shrink-0 items-center justify-center rounded-full bg-brand text-on-brand transition-colors hover:bg-brand-600',
          big ? 'h-12 w-12' : 'h-10 w-10',
        )}
      >
        <Search size={big ? 19 : 17} />
      </button>
    </form>
  );
}
