import { NextResponse, type NextRequest } from 'next/server';
import { getDinners } from '@/lib/data/dinners';

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get('city') ?? undefined;
  try {
    const events = await getDinners(city);
    return NextResponse.json({ items: events, total: events.length });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Could not load dinners.' },
      { status: 500 },
    );
  }
}
