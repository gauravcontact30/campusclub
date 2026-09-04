import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/env';
import { VISITOR_COOKIE, VISITOR_COOKIE_OPTIONS, newVisitorId } from '@/lib/admin/visitor';

/**
 * Issues the anonymous visitor cookie if this browser has not got one.
 *
 * The proxy is the only place that can set it before the first page renders,
 * which is what makes the very first page view attributable to a session
 * rather than arriving with no id at all. It is mirrored onto the request so
 * server components later in the same pass can read the value that is only
 * just being sent.
 */
function attachVisitorId(request: NextRequest, response: NextResponse) {
  if (request.cookies.get(VISITOR_COOKIE)) return;
  const id = newVisitorId();
  request.cookies.set(VISITOR_COOKIE, id);
  response.cookies.set(VISITOR_COOKIE, id, VISITOR_COOKIE_OPTIONS);
}

/** Refreshes the Supabase auth cookie on every request so RSCs see a live session. Called from `proxy.ts`. */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  attachVisitorId(request, response);
  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}
