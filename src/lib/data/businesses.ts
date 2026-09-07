import type { Business, BusinessQuery, OpeningHours, Paginated, PriceBand } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BUSINESS_CATEGORIES } from '@/lib/constants';
import { isOpenAt } from '@/lib/directory/hours';
import { sortBusinesses } from '@/lib/directory/ranking';
import { db } from './store';

export const DIRECTORY_PER_PAGE = 20;

/**
 * Below this many listings a city page reads as broken rather than sparse, so
 * the page shows that city's meetup board instead. Better to show the thing we
 * do have than a directory with four entries in it.
 */
export const THIN_CITY_THRESHOLD = 12;

type Row = Record<string, unknown>;

function fromRow(row: Row): Business {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    citySlug: String(row.city_slug),
    categorySlug: String(row.category_slug),
    address: String(row.address ?? ''),
    locality: String(row.locality ?? ''),
    lat: Number(row.lat),
    lng: Number(row.lng),
    phone: (row.phone as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    hours: (row.hours as OpeningHours) ?? {},
    priceBand: (row.price_band as PriceBand | null) ?? null,
    attribution: String(row.attribution ?? 'OpenStreetMap contributors, ODbL'),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    completeness: Number(row.completeness ?? 0),
    claimedBy: (row.claimed_by as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

/**
 * A search term can name a business or a kind of business.
 *
 * "coffee" should find cafes, not only places with Coffee in the name, so the
 * term is resolved against the catalogue first and the resulting slugs widen
 * the match. Without this the commonest possible query returns almost nothing,
 * which is the sort of failure people do not report — they just leave.
 *
 * The match surface is name, slug, and blurb: "coffee" doesn't appear in the
 * name "Cafes" or the slug "cafes", but it does appear in that category's
 * blurb ("Coffee, and a table you can sit at for three hours."), which is
 * exactly the case this function exists to catch.
 */
function categorySlugsMatching(term: string): string[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  return BUSINESS_CATEGORIES
    .filter((c) =>
      c.name.toLowerCase().includes(needle) ||
      c.slug.includes(needle) ||
      c.blurb.toLowerCase().includes(needle),
    )
    .map((c) => c.slug);
}

function emptyPage(page: number, perPage: number): Paginated<Business> {
  return { items: [], total: 0, page, perPage, pages: 0 };
}

/**
 * PostgREST's filter DSL treats `,`, `(`, `)`, `%` and `*` as syntax, not
 * search text — an ordinary term like "cafe, tea" would otherwise break out
 * of the ilike clause it's meant to sit inside. Escaping them here is what
 * lets a search box accept whatever a person actually types.
 */
export function escapePostgrestFilter(value: string): string {
  return value.replace(/[,()%*]/g, (char) => `\\${char}`);
}

export async function listBusinesses(query: BusinessQuery): Promise<Paginated<Business>> {
  const perPage = query.perPage ?? DIRECTORY_PER_PAGE;
  const page = Math.max(1, query.page ?? 1);
  const term = (query.term ?? '').trim();
  const categoryHits = categorySlugsMatching(term);

  let rows: Business[];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return emptyPage(page, perPage);

    let builder = supabase.from('businesses').select('*');
    if (query.city) builder = builder.eq('city_slug', query.city);
    if (query.category) builder = builder.eq('category_slug', query.category);
    if (query.priceBand) builder = builder.eq('price_band', query.priceBand);
    if (term) {
      // Name match OR a category the term names. `or` takes a filter string,
      // and an empty `in.()` is a syntax error, hence the conditional. The
      // term is escaped because it lands inside that filter string too — an
      // unescaped comma or paren would break out of the ilike clause.
      const safeTerm = escapePostgrestFilter(term);
      const clauses = [`name.ilike.%${safeTerm}%`];
      if (categoryHits.length) clauses.push(`category_slug.in.(${categoryHits.join(',')})`);
      builder = builder.or(clauses.join(','));
    }

    const { data, error } = await builder;
    if (error) return emptyPage(page, perPage);
    rows = (data ?? []).map(fromRow);
  } else {
    rows = db().businesses.filter((b) => {
      if (query.city && b.citySlug !== query.city) return false;
      if (query.category && b.categorySlug !== query.category) return false;
      if (query.priceBand && b.priceBand !== query.priceBand) return false;
      if (term) {
        const named = b.name.toLowerCase().includes(term.toLowerCase());
        if (!named && !categoryHits.includes(b.categorySlug)) return false;
      }
      return true;
    });
  }

  // "Open now" cannot be an indexed predicate — it depends on the visitor's
  // clock — so it filters what came back. A page can therefore hold fewer than
  // `perPage` rows while it is on. See the spec's Known limitation.
  if (query.openNow) {
    const now = new Date();
    rows = rows.filter((b) => isOpenAt(b.hours, now));
  }

  const sorted = sortBusinesses(rows, query.sort ?? 'recommended', query.near);
  const start = (page - 1) * perPage;

  return {
    items: sorted.slice(start, start + perPage),
    total: sorted.length,
    page,
    perPage,
    pages: Math.ceil(sorted.length / perPage),
  };
}

export async function getBusiness(slug: string): Promise<Business | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.from('businesses').select('*').eq('slug', slug).maybeSingle();
    return data ? fromRow(data) : null;
  }
  return db().businesses.find((b) => b.slug === slug) ?? null;
}

/**
 * By id rather than slug, for the review form — which posts against the id it
 * was rendered with, not a slug that could have been re-pointed underneath it.
 */
export async function getBusinessById(id: string): Promise<Business | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.from('businesses').select('*').eq('id', id).maybeSingle();
    return data ? fromRow(data) : null;
  }
  return db().businesses.find((b) => b.id === id) ?? null;
}

/** The strip of strongest listings on a city page. */
export async function topBusinesses(citySlug: string, limit = 6): Promise<Business[]> {
  const page = await listBusinesses({ city: citySlug, sort: 'recommended', perPage: limit, page: 1 });
  return page.items;
}

export async function businessCountByCity(citySlug: string): Promise<number> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return 0;
    const { count } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('city_slug', citySlug);
    return count ?? 0;
  }
  return db().businesses.filter((b) => b.citySlug === citySlug).length;
}
