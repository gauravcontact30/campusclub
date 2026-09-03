import type { Level, MeetupQuery, MeetupSort, WhenFilter } from '@/types';
import { CATEGORY_SLUGS, LEVELS, SORT_OPTIONS, WHEN_OPTIONS } from '@/lib/constants';

const LEVEL_VALUES = LEVELS.map((l) => l.value);
const WHEN_VALUES = WHEN_OPTIONS.map((w) => w.value);
const SORT_VALUES = SORT_OPTIONS.map((s) => s.value);

/** URL search params → typed query. Shared by the page (server) and the client filters. */
export function parseMeetupQuery(params: Record<string, string | string[] | undefined>): MeetupQuery {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const level = get('level');
  const when = get('when');
  const sort = get('sort');
  const category = get('category');

  return {
    term: get('term') ?? '',
    city: get('city') ?? '',
    // Anything not in the catalogue is dropped rather than passed to the query,
    // so a hand-edited URL cannot produce a confusing empty result page.
    category: category && CATEGORY_SLUGS.includes(category) ? category : '',
    level: level && LEVEL_VALUES.includes(level as Level) ? (level as Level) : 'any',
    when: when && WHEN_VALUES.includes(when as WhenFilter) ? (when as WhenFilter) : 'any',
    maxFeeCents: Number(get('maxFee')) || undefined,
    hasSpots: get('hasSpots') === 'true',
    sort: sort && SORT_VALUES.includes(sort as MeetupSort) ? (sort as MeetupSort) : 'soonest',
    page: Number(get('page')) || 1,
    near: coordsFrom(get('lat'), get('lng')),
  };
}

/** Coordinates only count when both halves parse and land on the globe. */
function coordsFrom(lat?: string, lng?: string) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!lat || !lng || Number.isNaN(latitude) || Number.isNaN(longitude)) return undefined;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return undefined;
  return { lat: latitude, lng: longitude };
}

export function toSearchParams(query: MeetupQuery) {
  const params = new URLSearchParams();
  if (query.term) params.set('term', query.term);
  if (query.city) params.set('city', query.city);
  if (query.category) params.set('category', query.category);
  if (query.level && query.level !== 'any') params.set('level', query.level);
  if (query.when && query.when !== 'any') params.set('when', query.when);
  if (query.maxFeeCents) params.set('maxFee', String(query.maxFeeCents));
  if (query.hasSpots) params.set('hasSpots', 'true');
  if (query.sort && query.sort !== 'soonest') params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.near) {
    params.set('lat', query.near.lat.toFixed(5));
    params.set('lng', query.near.lng.toFixed(5));
  }
  return params;
}

/** How many filters are on — drives the little count badge on the Filters button. */
export function activeFilterCount(query: MeetupQuery) {
  return [
    query.city,
    query.category,
    query.level && query.level !== 'any' ? query.level : '',
    query.when && query.when !== 'any' ? query.when : '',
    query.maxFeeCents,
    query.hasSpots ? 'spots' : '',
  ].filter(Boolean).length;
}
