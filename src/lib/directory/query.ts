import type { BusinessQuery, BusinessSort, PriceBand } from '@/types';
import { BUSINESS_CATEGORY_SLUGS, BUSINESS_SORT_OPTIONS } from '@/lib/constants';

/**
 * URL search params ↔ typed directory query, shared by the server page and the
 * client filter rail — the same split `src/lib/query-string.ts` makes for the
 * meetup board, and deliberately a separate file: the two share no parameter
 * names and merging them would mean one function full of "if directory".
 *
 * Anything unrecognised is dropped rather than passed through, so a
 * hand-edited or stale URL degrades to a broader page instead of an
 * unexplained empty one.
 */

const SORT_VALUES = BUSINESS_SORT_OPTIONS.map((s) => s.value);

export function parseBusinessQuery(
  params: Record<string, string | string[] | undefined>,
): BusinessQuery {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const category = get('cat');
  const sort = get('sort');
  const price = Number(get('price'));
  const page = Number(get('page'));

  return {
    term: get('q') ?? '',
    city: get('city') ?? '',
    category: category && BUSINESS_CATEGORY_SLUGS.includes(category) ? category : '',
    priceBand: Number.isInteger(price) && price >= 1 && price <= 4 ? (price as PriceBand) : undefined,
    openNow: get('open') === 'true',
    sort: sort && SORT_VALUES.includes(sort as BusinessSort) ? (sort as BusinessSort) : 'recommended',
    page: Number.isInteger(page) && page > 0 ? page : 1,
    near: coordsFrom(get('lat'), get('lng')),
  };
}

function coordsFrom(lat?: string, lng?: string) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!lat || !lng || Number.isNaN(latitude) || Number.isNaN(longitude)) return undefined;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return undefined;
  return { lat: latitude, lng: longitude };
}

export function toBusinessSearchParams(query: BusinessQuery) {
  const params = new URLSearchParams();
  if (query.term) params.set('q', query.term);
  if (query.city) params.set('city', query.city);
  if (query.category) params.set('cat', query.category);
  if (query.priceBand) params.set('price', String(query.priceBand));
  if (query.openNow) params.set('open', 'true');
  if (query.sort && query.sort !== 'recommended') params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.near) {
    params.set('lat', query.near.lat.toFixed(5));
    params.set('lng', query.near.lng.toFixed(5));
  }
  return params;
}

/** Drives the count badge on the Filters button. Sort and page are not filters. */
export function activeDirectoryFilterCount(query: BusinessQuery) {
  return [query.city, query.category, query.priceBand, query.openNow ? 'open' : '']
    .filter(Boolean).length;
}
