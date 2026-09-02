import { NextResponse, type NextRequest } from 'next/server';
import { searchBusinesses } from '@/lib/data/businesses';
import { parseBusinessQuery } from '@/lib/query-string';
import type { PriceLevel } from '@/types';

/**
 * REST endpoint behind the directory's live filtering (TanStack Query).
 * The same repository powers the server-rendered first paint, so results are
 * identical whichever path a request takes.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    // One parser for the page and the endpoint, so both read a URL the same way.
    const parsed = parseBusinessQuery(Object.fromEntries(params));
    const result = await searchBusinesses({
      ...parsed,
      price: (parsed.price ?? []).filter((n): n is PriceLevel => n >= 1 && n <= 4),
      perPage: Number(params.get('perPage')) || 9,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Search failed.' },
      { status: 500 },
    );
  }
}
