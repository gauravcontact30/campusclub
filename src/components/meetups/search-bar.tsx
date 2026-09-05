'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { CitySelect } from './city-select';
import { cn } from '@/lib/utils';

/**
 * One control that answers "what" and "where" together, welded into a single
 * pill with a hairline between the fields and the submit riding inside the
 * right edge. It is the densest, most familiar way to start a local search: the
 * hero opens with it, and the board keeps one above the results.
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
  // The header and a page body can both render a SearchBar at once — a fixed
  // id would collide and make both labels point at whichever input won,
  // which is invalid HTML and breaks the accessible name for the other.
  const id = useId();
  const whatId = `${id}-what`;
  const whereId = `${id}-where`;

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
      <label className="sr-only" htmlFor={whatId}>
        What do you want to do?
      </label>
      <input
        id={whatId}
        name="term"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Study, badminton, 6am run…"
        className={cn('searchbar-field', big && 'py-4 text-base')}
      />

      <span className="searchbar-divide" aria-hidden />

      <CitySelect id={whereId} value={city} onChange={setCity} size={size} />

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
