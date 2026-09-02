import { NextResponse, type NextRequest } from 'next/server';
import { searchBusinesses } from '@/lib/data/businesses';
import type { PriceLevel } from '@/types';

/**
 * REST endpoint behind the directory's live filtering (TanStack Query).
 * The same repository powers the server-rendered first paint, so results are
 * identical whichever path a request takes.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    const result = await searchBusinesses({
      term: params.get('term') ?? undefined,
      city: params.get('city') ?? undefined,
      category: params.get('category') ?? undefined,
      price: (params.get('price') ?? '')
        .split(',')
        .filter(Boolean)
        .map(Number)
        .filter((n): n is PriceLevel => n >= 1 && n <= 4),
      minRating: Number(params.get('minRating')) || undefined,
      openNow: params.get('openNow') === 'true',
      sort: (params.get('sort') as never) ?? 'recommended',
      page: Number(params.get('page')) || 1,
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
