import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { SUPABASE_SERVICE_ROLE_KEY, isSupabaseConfigured } from '@/lib/env';
import { SEED_BUSINESSES, SEED_DINNERS } from '@/lib/data/seed';
import { CATEGORIES } from '@/lib/constants';

/**
 * Pushes the TypeScript seed dataset into Supabase so both backends show the
 * same directory. Guarded by the service-role key, which never reaches a client.
 *
 *   curl -X POST http://localhost:3000/api/admin/seed \
 *        -H "x-seed-key: $SUPABASE_SERVICE_ROLE_KEY"
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: 'Supabase is not configured — the app is running in demo mode.' }, { status: 400 });
  }

  const key = request.headers.get('x-seed-key');
  if (!SUPABASE_SERVICE_ROLE_KEY || key !== SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ message: 'Unauthorised.' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ message: 'Service-role client unavailable.' }, { status: 500 });
  }

  const categories = CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, blurb: c.blurb }));
  const { error: categoryError } = await supabase.from('categories').upsert(categories, { onConflict: 'slug' });
  if (categoryError) return NextResponse.json({ message: categoryError.message }, { status: 500 });

  const businesses = SEED_BUSINESSES.map((b) => ({
    slug: b.slug,
    name: b.name,
    category_slug: b.categorySlug,
    tags: b.tags,
    description: b.description,
    phone: b.phone,
    website: b.website,
    address: b.address,
    neighborhood: b.neighborhood,
    city: b.city,
    state: b.state,
    postal_code: b.postalCode,
    lat: b.lat,
    lng: b.lng,
    price_level: b.priceLevel,
    cover_image: b.coverImage,
    images: b.images,
    hours: b.hours,
    amenities: b.amenities,
    is_claimed: false,
  }));
  const { error: businessError } = await supabase.from('businesses').upsert(businesses, { onConflict: 'slug' });
  if (businessError) return NextResponse.json({ message: businessError.message }, { status: 500 });

  const dinners = SEED_DINNERS.map((d) => ({
    city: d.city,
    neighborhood: d.neighborhood,
    venue_name: d.venueName,
    venue_reveal_at: d.venueRevealAt,
    starts_at: d.startsAt,
    seats_total: d.seatsTotal,
    seats_taken: d.seatsTaken,
    price_cents: d.priceCents,
    language: d.language,
    vibe: d.vibe,
    cover_image: d.coverImage,
    host_notes: d.hostNotes,
  }));
  const { error: dinnerError } = await supabase.from('dinner_events').insert(dinners);
  if (dinnerError) return NextResponse.json({ message: dinnerError.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    seeded: { categories: categories.length, businesses: businesses.length, dinners: dinners.length },
  });
}
