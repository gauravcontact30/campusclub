import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { recordEvent } from '@/lib/admin/events';
import { readVisitorId } from '@/lib/admin/visitor';
import { isTrackablePath } from '@/lib/admin/config';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * Page-view beacon.
 *
 * Views are reported from the browser rather than counted in the proxy on
 * purpose: the proxy also sees RSC payloads, prefetches and asset requests, so
 * counting there reports traffic rather than reading. One POST per completed
 * client navigation is what a person actually did.
 *
 * Deliberately not authenticated — anonymous visits are most of the traffic
 * and are the point. What that costs is that the numbers are only as
 * trustworthy as the public internet: anyone can POST to it. Everything is
 * therefore bounded (path length, known shape) and the visitor id comes from
 * the httpOnly cookie, never from the body, so a caller cannot attribute a
 * view to somebody else.
 */
const beaconSchema = z.object({
  path: z.string().min(1).max(512),
  referrer: z.string().max(512).optional().nullable(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = beaconSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  // Query strings are dropped: they carry search terms and filter choices, and
  // the dashboard reports which features get used, not what people typed.
  const path = parsed.data.path.split('?')[0].split('#')[0];
  if (!isTrackablePath(path)) return NextResponse.json({ ok: true });

  const visitorId = await readVisitorId();
  if (!visitorId) return NextResponse.json({ ok: true });

  const user = await getCurrentUser();

  await recordEvent({
    kind: 'page',
    path,
    visitorId,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    referrer: parsed.data.referrer || null,
    outcome: 'success',
  });

  return NextResponse.json({ ok: true });
}
