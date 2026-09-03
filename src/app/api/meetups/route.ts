import { NextResponse, type NextRequest } from 'next/server';
import { searchMeetups } from '@/lib/data/meetups';
import { parseMeetupQuery } from '@/lib/query-string';

/**
 * Read-only JSON over the same repository the pages use, so the browse page's
 * client-side filtering and anything external agree on what a meetup is.
 */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = parseMeetupQuery(params);

  try {
    const result = await searchMeetups({ ...query, perPage: Math.min(Number(params.perPage) || 12, 48) });
    return NextResponse.json(result, {
      headers: { 'cache-control': 'public, s-maxage=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Search failed.' },
      { status: 500 },
    );
  }
}
