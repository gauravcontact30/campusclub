import type { Business, BusinessClaim, BusinessQuery, Paginated, PriceLevel } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { distanceKm, isOpenNow, slugify } from '@/lib/utils';
import { db, nextId, withAggregates } from './store';

/* ---------------------------------- mapping --------------------------------- */

type BusinessRow = Record<string, unknown>;

function fromRow(row: BusinessRow): Business {
  const stats = (row.business_stats ?? {}) as { rating?: number; review_count?: number } | null;
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    categorySlug: String(row.category_slug),
    tags: (row.tags as string[]) ?? [],
    description: String(row.description ?? ''),
    phone: String(row.phone ?? ''),
    website: String(row.website ?? ''),
    address: String(row.address ?? ''),
    neighborhood: String(row.neighborhood ?? ''),
    city: String(row.city ?? ''),
    state: String(row.state ?? ''),
    postalCode: String(row.postal_code ?? ''),
    lat: Number(row.lat ?? 0),
    lng: Number(row.lng ?? 0),
    priceLevel: (Number(row.price_level) || 2) as PriceLevel,
    coverImage: String(row.cover_image ?? ''),
    images: (row.images as string[]) ?? [],
    hours: row.hours as Business['hours'],
    amenities: (row.amenities as string[]) ?? [],
    ownerId: (row.owner_id as string | null) ?? null,
    isClaimed: Boolean(row.is_claimed),
    createdAt: String(row.created_at),
    rating: Number(row.rating ?? stats?.rating ?? 0),
    reviewCount: Number(row.review_count ?? stats?.review_count ?? 0),
  };
}

/* ---------------------------------- queries --------------------------------- */

const DEFAULT_PER_PAGE = 9;

function score(b: Business) {
  // "Recommended" = quality weighted by how much evidence backs it.
  return b.rating * Math.log10(b.reviewCount + 2) + (b.isClaimed ? 0.15 : 0);
}

/** Tags every result with how far it is from the visitor, when we know. */
function withDistance(items: Business[], near: BusinessQuery['near']): Business[] {
  if (!near) return items;
  return items.map((b) => ({ ...b, distanceKm: distanceKm(near, { lat: b.lat, lng: b.lng }) }));
}

function sortResults(items: Business[], sort: NonNullable<BusinessQuery['sort']>) {
  const sorters: Record<string, (a: Business, b: Business) => number> = {
    recommended: (a, b) => score(b) - score(a),
    rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
    reviews: (a, b) => b.reviewCount - a.reviewCount,
    price_asc: (a, b) => a.priceLevel - b.priceLevel,
    price_desc: (a, b) => b.priceLevel - a.priceLevel,
    distance: (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
  };
  return items.sort(sorters[sort] ?? sorters.recommended);
}

function applyDemoQuery(query: BusinessQuery): Paginated<Business> {
  const { term, city, category, price, minRating, openNow, near, sort = 'recommended' } = query;
  const page = Math.max(1, query.page ?? 1);
  const perPage = query.perPage ?? DEFAULT_PER_PAGE;

  let items = withDistance(db().businesses.map((b) => withAggregates(b)), near);

  if (term?.trim()) {
    const q = term.trim().toLowerCase();
    items = items.filter((b) =>
      [b.name, b.description, b.categorySlug, b.neighborhood, b.city, ...b.tags]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }
  if (city) items = items.filter((b) => slugify(b.city) === slugify(city));
  if (category) items = items.filter((b) => b.categorySlug === category);
  if (price?.length) items = items.filter((b) => price.includes(b.priceLevel));
  if (minRating) items = items.filter((b) => b.rating >= minRating);
  if (openNow) items = items.filter((b) => isOpenNow(b.hours));

  sortResults(items, sort);

  const total = items.length;
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function searchBusinesses(query: BusinessQuery = {}): Promise<Paginated<Business>> {
  if (!isSupabaseConfigured()) return applyDemoQuery(query);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return applyDemoQuery(query);

  const page = Math.max(1, query.page ?? 1);
  const perPage = query.perPage ?? DEFAULT_PER_PAGE;

  let q = supabase.from('businesses_with_stats').select('*', { count: 'exact' });

  if (query.term?.trim()) {
    const term = query.term.trim();
    q = q.or(`name.ilike.%${term}%,description.ilike.%${term}%,neighborhood.ilike.%${term}%`);
  }
  if (query.city) q = q.ilike('city', query.city.replace(/-/g, ' '));
  if (query.category) q = q.eq('category_slug', query.category);
  if (query.price?.length) q = q.in('price_level', query.price);
  if (query.minRating) q = q.gte('rating', query.minRating);

  const order: Record<string, [string, boolean]> = {
    recommended: ['rating', false],
    rating: ['rating', false],
    reviews: ['review_count', false],
    price_asc: ['price_level', true],
    price_desc: ['price_level', false],
    distance: ['rating', false],
  };
  const [column, ascending] = order[query.sort ?? 'recommended'];
  q = q.order(column, { ascending });

  // Distance and "open now" depend on the visitor (coordinates, clock), so those
  // two run in application code — which means the page has to be cut here too.
  const inAppPaging = Boolean(query.near) || Boolean(query.openNow);
  if (!inAppPaging) q = q.range((page - 1) * perPage, page * perPage - 1);
  else q = q.limit(200);

  const { data, count, error } = await q;
  if (error) throw new Error(error.message);

  let items = withDistance((data ?? []).map(fromRow), query.near);
  if (query.openNow) items = items.filter((b) => isOpenNow(b.hours));

  if (!inAppPaging) {
    const total = count ?? items.length;
    return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
  }

  sortResults(items, query.sort ?? 'recommended');
  const total = items.length;
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  if (!isSupabaseConfigured()) {
    const found = db().businesses.find((b) => b.slug === slug);
    return found ? withAggregates(found) : null;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from('businesses_with_stats').select('*').eq('slug', slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

export async function getRelatedBusinesses(business: Business, limit = 3): Promise<Business[]> {
  const { items } = await searchBusinesses({ category: business.categorySlug, perPage: limit + 4 });
  const sameCity = items.filter((b) => b.id !== business.id && b.city === business.city);
  const fallback = items.filter((b) => b.id !== business.id && b.city !== business.city);
  return [...sameCity, ...fallback].slice(0, limit);
}

export async function getFeaturedBusinesses(limit = 6): Promise<Business[]> {
  const { items } = await searchBusinesses({ sort: 'rating', perPage: limit });
  return items;
}

export async function getAllBusinessSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return db().businesses.map((b) => b.slug);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('businesses').select('slug');
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

export async function countBusinessesByCity(): Promise<Record<string, number>> {
  const all = isSupabaseConfigured()
    ? (await searchBusinesses({ perPage: 500 })).items
    : db().businesses.map((b) => withAggregates(b));
  return all.reduce<Record<string, number>>((acc, b) => {
    const key = slugify(b.city);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export interface NewBusinessInput {
  name: string;
  categorySlug: string;
  description: string;
  city: string;
  neighborhood: string;
  address: string;
  phone: string;
  website: string;
  priceLevel: PriceLevel;
  amenities: string[];
  ownerId: string | null;
}

export async function createBusiness(input: NewBusinessInput): Promise<Business> {
  const base = db().businesses[0];
  const record: Business = {
    id: nextId('b'),
    slug: `${slugify(input.name)}-${slugify(input.city)}`,
    name: input.name,
    categorySlug: input.categorySlug,
    tags: [],
    description: input.description,
    phone: input.phone,
    website: input.website,
    address: input.address,
    neighborhood: input.neighborhood,
    city: input.city,
    state: '',
    postalCode: '',
    lat: base.lat,
    lng: base.lng,
    priceLevel: input.priceLevel,
    coverImage: `/img/covers/cover-0${(db().businesses.length % 9) + 1}.svg`,
    images: [`/img/covers/cover-0${(db().businesses.length % 9) + 1}.svg`],
    hours: base.hours,
    amenities: input.amenities,
    ownerId: input.ownerId,
    isClaimed: Boolean(input.ownerId),
    createdAt: new Date().toISOString(),
    rating: 0,
    reviewCount: 0,
  };

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          slug: record.slug,
          name: record.name,
          category_slug: record.categorySlug,
          description: record.description,
          phone: record.phone,
          website: record.website,
          address: record.address,
          neighborhood: record.neighborhood,
          city: record.city,
          state: record.state,
          postal_code: record.postalCode,
          lat: record.lat,
          lng: record.lng,
          price_level: record.priceLevel,
          cover_image: record.coverImage,
          images: record.images,
          hours: record.hours,
          amenities: record.amenities,
          owner_id: record.ownerId,
          is_claimed: record.isClaimed,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return fromRow(data);
    }
  }

  db().businesses.unshift(record);
  return record;
}


/* ---------------------------------- claims ---------------------------------- */

export interface ClaimInput {
  businessId: string;
  userId: string;
  role: string;
  contactEmail: string;
  phone: string;
  note: string;
}

/**
 * Hands a listing to the member claiming it and files the claim for the record.
 * Claiming is instant while VibeClub is in beta; the filed claim is what a
 * human spot-checks afterwards.
 */
export async function claimBusiness(input: ClaimInput): Promise<Business | null> {
  const claim: BusinessClaim = {
    id: nextId('claim'),
    businessId: input.businessId,
    userId: input.userId,
    role: input.role,
    contactEmail: input.contactEmail,
    phone: input.phone,
    note: input.note,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;

    const { error: claimError } = await supabase.from('business_claims').insert({
      business_id: input.businessId,
      user_id: input.userId,
      role: input.role,
      contact_email: input.contactEmail,
      phone: input.phone,
      note: input.note,
    });
    if (claimError) throw new Error(claimError.message);

    const { data, error } = await supabase
      .from('businesses')
      .update({ owner_id: input.userId, is_claimed: true })
      .eq('id', input.businessId)
      .is('owner_id', null)
      .select('*')
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data) : null;
  }

  const store = db();
  const business = store.businesses.find((b) => b.id === input.businessId);
  if (!business || business.ownerId) return null;

  store.claims.push(claim);
  business.ownerId = input.userId;
  business.isClaimed = true;
  return withAggregates(business);
}

export async function getBusinessesOwnedBy(userId: string): Promise<Business[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase.from('businesses_with_stats').select('*').eq('owner_id', userId);
    return (data ?? []).map(fromRow);
  }
  return db().businesses.filter((b) => b.ownerId === userId).map((b) => withAggregates(b));
}
