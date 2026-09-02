import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js 16 renamed `middleware` to `proxy`. The runtime is Node.js and is not
 * configurable, which suits us — refreshing the Supabase auth cookie needs no
 * edge-specific behaviour.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|img|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
};
