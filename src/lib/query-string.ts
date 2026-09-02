import type { BusinessQuery, PriceLevel } from '@/types';

/** URL search params → typed query. Shared by the page (server) and the client filters. */
export function parseBusinessQuery(params: Record<string, string | string[] | undefined>): BusinessQuery {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    term: get('term') ?? '',
    city: get('city') ?? '',
    category: get('category') ?? '',
    price: (get('price') ?? '')
      .split(',')
      .filter(Boolean)
      .map(Number)
      .filter((n): n is PriceLevel => n >= 1 && n <= 4),
    minRating: Number(get('minRating')) || 0,
    openNow: get('openNow') === 'true',
    sort: (get('sort') as BusinessQuery['sort']) ?? 'recommended',
    page: Number(get('page')) || 1,
  };
}

export function toSearchParams(query: BusinessQuery) {
  const params = new URLSearchParams();
  if (query.term) params.set('term', query.term);
  if (query.city) params.set('city', query.city);
  if (query.category) params.set('category', query.category);
  if (query.price?.length) params.set('price', query.price.join(','));
  if (query.minRating) params.set('minRating', String(query.minRating));
  if (query.openNow) params.set('openNow', 'true');
  if (query.sort && query.sort !== 'recommended') params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  return params;
}
