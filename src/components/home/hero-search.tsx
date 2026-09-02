'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORIES, CITIES } from '@/lib/constants';

const QUICK = ['Filter coffee', 'Natural wine', 'Reformer pilates', 'Plumber', 'Late night'];

export function HeroSearch() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [city, setCity] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (term.trim()) params.set('term', term.trim());
    if (city) params.set('city', city);
    router.push(`/businesses?${params.toString()}`);
  }

  return (
    <div className="rounded-4xl border border-cream/15 bg-cream/5 p-5 backdrop-blur sm:p-7">
      <p className="font-display text-lg font-semibold text-cream">What are you looking for tonight?</p>
      <p className="mt-1 text-sm text-cream/60">Search 200+ reviewed places, or start with a category.</p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div className="flex items-center gap-2 rounded-2xl bg-cream px-4 py-3">
          <Search size={18} className="shrink-0 text-ink/40" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Tacos, barbers, pilates…"
            aria-label="What are you looking for?"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-cream px-4 py-3">
          <MapPin size={18} className="shrink-0 text-ink/40" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="City"
            className="w-full bg-transparent text-sm text-ink focus:outline-none"
          >
            <option value="">Anywhere</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" size="lg" full>
          Search HomeMart
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => router.push(`/businesses?term=${encodeURIComponent(q)}`)}
            className="rounded-full border border-cream/20 px-3 py-1.5 text-xs text-cream/80 transition-colors hover:border-flame hover:text-flame"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5 border-t border-cream/10 pt-4">
        {CATEGORIES.slice(0, 4).map((c) => (
          <a
            key={c.slug}
            href={`/businesses?category=${c.slug}`}
            className="rounded-full bg-cream/10 px-3 py-1.5 text-xs text-cream/70 hover:bg-cream/20"
          >
            {c.name}
          </a>
        ))}
      </div>
    </div>
  );
}
