'use client';

import { useRouter } from 'next/navigation';
import type { MeetupQuery } from '@/types';
import { toSearchParams } from '@/lib/query-string';
import { SortSelect } from './filter-sidebar';

/** The desktop sort control, which lives above the results rather than in the rail. */
export function SortBar({ query }: { query: MeetupQuery }) {
  const router = useRouter();
  return (
    <SortSelect
      query={query}
      hasLocation={Boolean(query.near)}
      onChange={(patch) => router.push(`/meetups?${toSearchParams({ ...query, ...patch, page: 1 })}`, { scroll: false })}
    />
  );
}
