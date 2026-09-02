import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Business } from '@/types';
import { BusinessCard } from '@/components/business/business-card';

export function FeaturedBusinesses({ businesses, savedIds }: { businesses: Business[]; savedIds: string[] }) {
  return (
    <section className="container-page py-20 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="eyebrow">Highest rated this month</p>
          <h2 className="display-lg mt-3">Places our members keep going back to.</h2>
        </div>
        <Link href="/businesses?sort=rating" className="group inline-flex items-center gap-1.5 text-sm font-semibold">
          Browse the full directory
          <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((business, i) => (
          <BusinessCard key={business.id} business={business} saved={savedIds.includes(business.id)} priority={i < 3} />
        ))}
      </div>
    </section>
  );
}
