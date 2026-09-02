import type { Metadata } from 'next';
import { BusinessSearch } from '@/components/business/business-search';
import { searchBusinesses } from '@/lib/data/businesses';
import { getCurrentUser } from '@/lib/auth/session';
import { getSavedBusinessIds } from '@/lib/data/saves';
import { parseBusinessQuery } from '@/lib/query-string';

export const metadata: Metadata = {
  title: 'Discover local places',
  description: 'Search reviewed restaurants, cafés, bars, services and studios across six cities.',
};

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseBusinessQuery(params);

  const [results, user] = await Promise.all([searchBusinesses(query), getCurrentUser()]);
  const savedIds = user ? await getSavedBusinessIds(user.id) : [];

  return <BusinessSearch initialQuery={query} initialData={results} savedIds={savedIds} />;
}
