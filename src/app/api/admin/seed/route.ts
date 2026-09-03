import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { SUPABASE_SERVICE_ROLE_KEY, isSupabaseConfigured } from '@/lib/env';
import { SEED_MEETUPS, SEED_USERS } from '@/lib/data/seed';
import { CATEGORIES } from '@/lib/constants';

/**
 * Pushes the TypeScript seed dataset into Supabase so both backends show the
 * same board. Guarded by the service-role key, which never reaches a client.
 *
 *   curl -X POST http://localhost:3000/api/admin/seed \
 *        -H "x-seed-key: $SUPABASE_SERVICE_ROLE_KEY"
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { message: 'Supabase is not configured — the app is running in demo mode.' },
      { status: 400 },
    );
  }

  const key = request.headers.get('x-seed-key');
  if (!SUPABASE_SERVICE_ROLE_KEY || key !== SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ message: 'Unauthorised.' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ message: 'Service-role client unavailable.' }, { status: 500 });
  }

  const categories = CATEGORIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    verb: c.verb,
    blurb: c.blurb,
  }));
  const { error: categoryError } = await supabase.from('categories').upsert(categories, { onConflict: 'slug' });
  if (categoryError) return NextResponse.json({ message: categoryError.message }, { status: 500 });

  // Meetups reference a host in `profiles`, which is created by Supabase Auth.
  // Anything whose host has not signed up yet is skipped rather than inserted
  // with a dangling foreign key.
  const { data: profiles } = await supabase.from('profiles').select('id');
  const known = new Set((profiles ?? []).map((p: { id: string }) => p.id));
  const hostFallback = SEED_USERS.find((u) => known.has(u.id))?.id ?? [...known][0];

  if (!hostFallback) {
    return NextResponse.json(
      { message: 'No profiles exist yet — sign up at least one account before seeding meetups.' },
      { status: 409 },
    );
  }

  const meetups = SEED_MEETUPS.map((m) => ({
    slug: m.slug,
    title: m.title,
    category_slug: m.categorySlug,
    host_id: known.has(m.hostId) ? m.hostId : hostFallback,
    description: m.description,
    agenda: m.agenda,
    bring: m.bring,
    venue_name: m.venueName,
    address: m.address,
    area: m.area,
    city: m.city,
    state: m.state,
    lat: m.lat,
    lng: m.lng,
    starts_at: m.startsAt,
    ends_at: m.endsAt,
    spots_total: m.spotsTotal,
    spots_taken: m.spotsTaken,
    join_fee_cents: m.joinFeeCents,
    level: m.level,
    audience: m.audience,
    language: m.language,
    cadence: m.cadence,
    cover_image: m.coverImage,
    tags: m.tags,
  }));

  const { error: meetupError } = await supabase.from('meetups').upsert(meetups, { onConflict: 'slug' });
  if (meetupError) return NextResponse.json({ message: meetupError.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    seeded: { categories: categories.length, meetups: meetups.length },
  });
}
