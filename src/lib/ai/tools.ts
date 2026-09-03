import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema';
import { searchBusinesses, getBusinessBySlug } from '@/lib/data/businesses';
import { getDinners } from '@/lib/data/dinners';
import { getReviews } from '@/lib/data/reviews';
import { CATEGORIES, CITIES, PLANS, SITE } from '@/lib/constants';
import { formatMoneyForCity, openStatusLabel, priceLabel, to12h } from '@/lib/utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * The tools are what make the assistant answer about *this* site rather than
 * about restaurants in general: every factual claim it makes comes back through
 * one of these, against the same data layer the pages render from.
 *
 * Each returns a compact string rather than raw rows. Model context is the
 * scarce resource here, and a listing's full record — photos, geo, hours for
 * seven days — costs far more than the two lines a person actually asked for.
 *
 * Schemas are plain JSON Schema via `betaTool` rather than the SDK's zod
 * helper: that helper requires zod 4, and this app is on zod 3 for its form
 * validators. Argument validation is identical either way.
 */

const citySlugs = CITIES.map((c) => c.slug);
const categorySlugs = CATEGORIES.map((c) => c.slug);

export const searchPlacesTool = betaTool({
  name: 'search_places',
  description:
    'Search the VibeClub business directory. Use for any question about places to eat, drink, or use — ' +
    'by name, cuisine, neighbourhood, city, category, price or rating. Returns a ranked shortlist.',
  inputSchema: {
    type: 'object',
    properties: {
      term: { type: 'string', description: 'Free text: a name, cuisine, or what the visitor is after' },
      city: { type: 'string', enum: citySlugs },
      category: { type: 'string', enum: categorySlugs },
      openNow: { type: 'boolean', description: 'Only places open at this moment' },
      minRating: { type: 'number', minimum: 0, maximum: 5 },
      limit: { type: 'number', minimum: 1, maximum: 8, description: 'Default 5' },
    },
    additionalProperties: false,
  } as const,
  run: async ({ term, city, category, openNow, minRating, limit }) => {
    const { items, total } = await searchBusinesses({
      term: term ?? '',
      city: city ?? '',
      category: category ?? '',
      openNow: openNow ?? false,
      minRating: minRating ?? 0,
      perPage: limit ?? 5,
    });
    if (!items.length) return 'No places matched. Suggest widening the search.';
    const lines = items.map(
      (b) =>
        `- ${b.name} (/businesses/${b.slug}) · ${b.rating.toFixed(1)}★ from ${b.reviewCount} reviews · ` +
        `${priceLabel(b.priceLevel, b.city)} · ${b.neighborhood}, ${b.city} · ${openStatusLabel(b.hours)}`,
    );
    return `${total} match; showing ${items.length}:\n${lines.join('\n')}`;
  },
});

export const placeDetailTool = betaTool({
  name: 'get_place',
  description:
    'Full detail for one business: description, address, contact, opening hours and recent review quotes. ' +
    'Call this after search_places when the visitor asks about a specific place.',
  inputSchema: {
    type: 'object',
    properties: {
      slug: { type: 'string', description: 'The slug from a search result URL, e.g. "the-clerkenwell-table-london"' },
    },
    required: ['slug'],
    additionalProperties: false,
  } as const,
  run: async ({ slug }) => {
    const b = await getBusinessBySlug(slug);
    if (!b) return `No business with slug "${slug}".`;
    const reviews = (await getReviews(b.id, 'recent')).slice(0, 3);
    const hours = b.hours
      .map((h, i) => `${DAYS[i]}: ${h.open && h.close ? `${to12h(h.open)}–${to12h(h.close)}` : 'closed'}`)
      .join('; ');
    const quotes = reviews.length
      ? reviews.map((r) => `  · ${r.rating}★ "${r.body.slice(0, 160)}"`).join('\n')
      : '  · No reviews yet.';
    return [
      `${b.name} — ${b.categorySlug} in ${b.neighborhood}, ${b.city}`,
      b.description,
      `Rating ${b.rating.toFixed(1)}★ from ${b.reviewCount} reviews · ${priceLabel(b.priceLevel, b.city)}`,
      `Address: ${b.address}, ${b.city} ${b.postalCode}`,
      b.phone ? `Phone: ${b.phone}` : '',
      b.website ? `Web: ${b.website}` : '',
      `Hours — ${hours}`,
      `Status: ${openStatusLabel(b.hours)}`,
      `Page: /businesses/${b.slug}`,
      'Recent reviews:',
      quotes,
    ]
      .filter(Boolean)
      .join('\n');
  },
});

export const dinnersTool = betaTool({
  name: 'list_dinners',
  description:
    'Upcoming VibeClub dinners — the Wednesday tables where six strangers eat together. ' +
    'Use for availability, dates, cities and seats left.',
  inputSchema: {
    type: 'object',
    properties: { city: { type: 'string', enum: citySlugs } },
    additionalProperties: false,
  } as const,
  run: async ({ city }) => {
    const cityName = city ? CITIES.find((c) => c.slug === city)?.name : undefined;
    const events = (await getDinners(cityName)).slice(0, 8);
    if (!events.length) return 'No dinners scheduled for that city yet.';
    return events
      .map((e) => {
        const when = new Date(e.startsAt);
        const seatsLeft = Math.max(0, e.seatsTotal - e.seatsTaken);
        return (
          `- ${e.city} · ${e.neighborhood} · ${when.toDateString()} ${to12h(when.toISOString().slice(11, 16))} · ` +
          `${seatsLeft} of ${e.seatsTotal} seats left · ${formatMoneyForCity(e.priceCents, e.city)} · ` +
          `${e.vibe} · ${e.language} · /dinners/${e.id}`
        );
      })
      .join('\n');
  },
});

export const siteFactsTool = betaTool({
  name: 'get_site_facts',
  description:
    'How VibeClub itself works: membership plans and prices, the cities it runs in, the categories in the ' +
    'directory, and the rules of the dinners. Use before answering any "how does it work" or pricing question.',
  inputSchema: {
    type: 'object',
    properties: { topic: { type: 'string', enum: ['plans', 'cities', 'categories', 'dinner_rules'] } },
    required: ['topic'],
    additionalProperties: false,
  } as const,
  run: async ({ topic }) => {
    switch (topic) {
      case 'plans':
        return PLANS.map(
          (p) =>
            `- ${p.name}: ${p.priceCents === 0 ? 'Free' : formatMoneyForCity(p.priceCents, 'Bengaluru')} ${p.cadence}. ` +
            `${p.tagline} Includes: ${p.perks.join('; ')}.`,
        ).join('\n');
      case 'cities':
        return CITIES.map((c) => `- ${c.name}, ${c.country} (/businesses?city=${c.slug}) — ${c.blurb}`).join('\n');
      case 'categories':
        return CATEGORIES.map((c) => `- ${c.name} (/businesses?category=${c.slug}) — ${c.blurb}`).join('\n');
      case 'dinner_rules':
        return [
          `${SITE.name} runs two things: a review directory, and a weekly dinner.`,
          'Dinners are every Wednesday at 8pm. Six seats per table, five strangers plus you.',
          'A six-question matching quiz (/dinners/quiz) decides who you are seated with.',
          'The venue is revealed 36 hours before, by email and on your bookings page.',
          'If a table is full you join the waitlist and get first call on a drop-out.',
          'Reviews and the directory are free forever; membership is only for the dinners.',
        ].join('\n');
    }
  },
});

export const CHAT_TOOLS = [searchPlacesTool, placeDetailTool, dinnersTool, siteFactsTool];
