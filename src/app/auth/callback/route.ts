import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Where every emailed auth link lands: confirm-your-address, password
 * recovery, and email-change confirmations.
 *
 * Two shapes have to be handled, because which one arrives depends on the
 * project's email templates rather than on anything this app controls:
 *
 *   ?code=…                     the PKCE flow, which @supabase/ssr uses by
 *                               default — exchanged for a session
 *   ?token_hash=…&type=…        the older link format, still emitted by the
 *                               default templates on many projects — verified
 *                               as a one-time password
 *
 * Getting this wrong is the classic "confirmation link does nothing" bug: the
 * link works, Supabase marks the address confirmed, and the visitor is bounced
 * to a page with no session and no explanation.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  // Only ever redirect within this site. `next` arrives in a URL a stranger
  // could have written, and following an absolute one would make this an open
  // redirect with a freshly-minted session attached.
  const requested = searchParams.get('next') ?? '/';
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Accounts are not configured.')}`);
  }

  // Supabase reports a rejected link in the query string rather than by
  // failing the request, so read it before doing any work.
  const linkError = searchParams.get('error_description') ?? searchParams.get('error');
  if (linkError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(linkError)}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
    // A recovery link signs them in specifically so they can set a new
    // password; anything else would leave them on a page they cannot use.
    return NextResponse.redirect(`${origin}${type === 'recovery' ? '/reset-password' : next}`);
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('That link was missing its token. Ask for a new one.')}`,
  );
}
