/**
 * Which OpenStreetMap tags become which directory category.
 *
 * A whitelist, not a classifier. Anything not named here is skipped and
 * counted rather than swept into a "More" bucket: a directory that files a
 * bus shelter under Shopping is worse than one that admits it has not mapped
 * bus shelters. `npm run directory:check` reports the commonest skipped tags,
 * so this map grows from evidence rather than imagination.
 *
 * Imported by both `scripts/directory-import.mjs` and `tests/osm-mapping.test.ts`
 * — hence .mjs, which both a Node script and Vitest can read. The test is what
 * stops a typo here from silently dropping a whole category.
 */

export const OSM_CATEGORY_MAP = {
  /* food & drink */
  'amenity=restaurant':      'restaurants',
  'amenity=cafe':            'cafes',
  'amenity=fast_food':       'fast-food',
  'amenity=ice_cream':       'ice-cream',
  'amenity=food_court':      'fast-food',
  'shop=bakery':             'bakeries',
  'shop=pastry':             'bakeries',

  /* nightlife */
  'amenity=bar':             'bars',
  'amenity=pub':             'pubs',
  'amenity=nightclub':       'clubs',

  /* active life */
  'leisure=fitness_centre':  'gyms',
  'leisure=sports_centre':   'sports-venues',
  'leisure=pitch':           'sports-venues',
  'leisure=stadium':         'sports-venues',
  'leisure=swimming_pool':   'swimming',
  'leisure=park':            'parks',
  'leisure=garden':          'parks',
  'sport=yoga':              'yoga-studios',

  /* study & work */
  'amenity=library':         'libraries',
  'amenity=college':         'colleges',
  'amenity=university':      'colleges',
  'amenity=coworking_space': 'coworking',
  'office=coworking':        'coworking',
  'amenity=training':        'coaching-centres',
  'office=educational_institution': 'coaching-centres',

  /* beauty & spas */
  'shop=hairdresser':        'barbers',
  'shop=beauty':             'salons',
  'leisure=spa':             'spas',
  'shop=massage':            'spas',

  /* shopping */
  'shop=books':              'bookshops',
  'shop=clothes':            'clothing',
  'shop=shoes':              'clothing',
  'shop=electronics':        'electronics',
  'shop=mobile_phone':       'electronics',
  'shop=computer':           'electronics',
  'shop=supermarket':        'groceries',
  'shop=convenience':        'groceries',
  'shop=greengrocer':        'groceries',
  'shop=stationery':         'stationery',
  'shop=copyshop':           'stationery',

  /* home services */
  'shop=laundry':            'laundry',
  'shop=dry_cleaning':       'laundry',
  'shop=hardware':           'repairs',
  'shop=doityourself':       'repairs',
  'craft=electrician':       'repairs',
  'craft=plumber':           'repairs',
  'shop=car_repair':         'car-repair',

  /* health */
  'amenity=clinic':          'clinics',
  'amenity=doctors':         'clinics',
  'amenity=hospital':        'clinics',
  'amenity=pharmacy':        'pharmacies',
  'amenity=dentist':         'dentists',
};

/**
 * How the tags are batched into Overpass queries.
 *
 * One request per city per group rather than per tag: ~8 requests a city
 * instead of ~50, which is the difference between a half-hour run and a
 * rate-limited afternoon. Groups follow the top-level categories so a failure
 * is legible ("nightlife failed for Indore") rather than opaque.
 */
export const CATEGORY_GROUPS = [
  { group: 'food-drink',    tags: ['amenity=restaurant', 'amenity=cafe', 'amenity=fast_food', 'amenity=ice_cream', 'amenity=food_court', 'shop=bakery', 'shop=pastry'] },
  { group: 'nightlife',     tags: ['amenity=bar', 'amenity=pub', 'amenity=nightclub'] },
  { group: 'active-life',   tags: ['leisure=fitness_centre', 'leisure=sports_centre', 'leisure=pitch', 'leisure=stadium', 'leisure=swimming_pool', 'leisure=park', 'leisure=garden', 'sport=yoga'] },
  { group: 'study-work',    tags: ['amenity=library', 'amenity=college', 'amenity=university', 'amenity=coworking_space', 'office=coworking', 'amenity=training', 'office=educational_institution'] },
  { group: 'beauty-spas',   tags: ['shop=hairdresser', 'shop=beauty', 'leisure=spa', 'shop=massage'] },
  { group: 'shopping',      tags: ['shop=books', 'shop=clothes', 'shop=shoes', 'shop=electronics', 'shop=mobile_phone', 'shop=computer', 'shop=supermarket', 'shop=convenience', 'shop=greengrocer', 'shop=stationery', 'shop=copyshop'] },
  { group: 'home-services', tags: ['shop=laundry', 'shop=dry_cleaning', 'shop=hardware', 'shop=doityourself', 'craft=electrician', 'craft=plumber', 'shop=car_repair'] },
  { group: 'health',        tags: ['amenity=clinic', 'amenity=doctors', 'amenity=hospital', 'amenity=pharmacy', 'amenity=dentist'] },
];

/**
 * The first tag on the element that we recognise wins. Order matters only for
 * elements carrying two mapped tags (a cafe inside a bookshop), where the
 * more specific key is checked first.
 */
export function categoryForTags(tags = {}) {
  for (const key of ['amenity', 'shop', 'leisure', 'craft', 'office', 'sport']) {
    const value = tags[key];
    if (!value) continue;
    const slug = OSM_CATEGORY_MAP[`${key}=${value}`];
    if (slug) return slug;
  }
  return null;
}

/** OSM's `price:level` is 1–4 where it exists at all, which is rarely. */
export function priceBandForTags(tags = {}) {
  const raw = tags['price:level'];
  if (raw === undefined) return null;
  const value = Number(raw);
  if (!Number.isInteger(value)) return null;
  return Math.min(4, Math.max(1, value));
}
