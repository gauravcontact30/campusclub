import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema';
import { getMeetupBySlug, searchMeetups } from '@/lib/data/meetups';
import { getVouches } from '@/lib/data/vouches';
import { CATEGORIES, CITIES, FREE_CANCELLATION_HOURS, PASSES, SITE } from '@/lib/constants';
import { durationLabel, formatFee, formatMoney, formatDateTime } from '@/lib/utils';
import type { Level, MeetupSort, WhenFilter } from '@/types';

/**
 * The tools are what make the assistant answer about *this* board rather than
 * about meetups in general: every factual claim it makes comes back through one
 * of these, against the same data layer the pages render from.
 *
 * Each returns a compact string rather than raw rows. Model context is the
 * scarce resource here, and a meetup's full record — agenda, coordinates, the
 * host's whole bio — costs far more than the two lines a person asked for.
 *
 * Schemas are plain JSON Schema via `betaTool` rather than the SDK's zod
 * helper: that helper requires zod 4, and this app is on zod 3 for its form
 * validators. Argument validation is identical either way.
 */

const citySlugs = CITIES.map((c) => c.slug);
const categorySlugs = CATEGORIES.map((c) => c.slug);

export const searchMeetupsTool = betaTool({
  name: 'search_meetups',
  description:
    'Search what is on across VibeClub. Use for any question about things to join — by activity, city, ' +
    'neighbourhood, date, price or how full it is. Returns a shortlist with join fees and spots left.',
  inputSchema: {
    type: 'object',
    properties: {
      term: { type: 'string', description: 'Free text: an activity, a venue, a neighbourhood' },
      city: { type: 'string', enum: citySlugs },
      category: { type: 'string', enum: categorySlugs },
      when: {
        type: 'string',
        enum: ['any', 'today', 'tomorrow', 'weekend', 'week'],
        description: 'Time window. Default "any", which means everything upcoming.',
      },
      level: { type: 'string', enum: ['any', 'beginner', 'intermediate', 'serious'] },
      maxFeeRupees: { type: 'number', minimum: 0, description: 'Upper bound on the join fee, in rupees' },
      hasSpots: { type: 'boolean', description: 'Only meetups that still have room' },
      sort: { type: 'string', enum: ['soonest', 'filling', 'cheapest', 'rating'] },
      limit: { type: 'number', minimum: 1, maximum: 8, description: 'Default 5' },
    },
    additionalProperties: false,
  } as const,
  run: async ({ term, city, category, when, level, maxFeeRupees, hasSpots, sort, limit }) => {
    const { items, total } = await searchMeetups({
      term: term ?? '',
      city: city ?? '',
      category: category ?? '',
      when: (when as WhenFilter) ?? 'any',
      level: (level as Level) ?? 'any',
      maxFeeCents: maxFeeRupees ? Math.round(maxFeeRupees * 100) : undefined,
      hasSpots: hasSpots ?? false,
      sort: (sort as MeetupSort) ?? 'soonest',
      perPage: limit ?? 5,
    });

    if (!items.length) return 'Nothing matched. Suggest widening the time window or clearing the category.';

    const lines = items.map((m) => {
      const left = Math.max(0, m.spotsTotal - m.spotsTaken);
      return (
        `- ${m.title} (/meetups/${m.slug}) · ${formatDateTime(m.startsAt)} · ${m.area}, ${m.city} · ` +
        `${formatFee(m.joinFeeCents)} to join · ${left === 0 ? 'full, waitlist open' : `${left} of ${m.spotsTotal} spots left`} · ` +
        `hosted by ${m.host.name}`
      );
    });
    return `${total} match; showing ${items.length}:\n${lines.join('\n')}`;
  },
});

export const meetupDetailTool = betaTool({
  name: 'get_meetup',
  description:
    'Full detail for one meetup: what happens, what to bring, the host, the join fee and recent feedback. ' +
    'Call this after search_meetups when the visitor asks about a specific one.',
  inputSchema: {
    type: 'object',
    properties: {
      slug: { type: 'string', description: 'The slug from a search result URL' },
    },
    required: ['slug'],
    additionalProperties: false,
  } as const,
  run: async ({ slug }) => {
    const m = await getMeetupBySlug(slug);
    if (!m) return `No meetup with slug "${slug}".`;

    const vouches = (await getVouches(m.id)).slice(0, 3);
    const left = Math.max(0, m.spotsTotal - m.spotsTaken);
    const quotes = vouches.length
      ? vouches.map((v) => `  · ${v.rating}★ "${v.body.slice(0, 160)}"`).join('\n')
      : '  · No feedback yet — it has not run since it was listed.';

    return [
      `${m.title} — ${m.categorySlug} in ${m.area}, ${m.city}`,
      m.description,
      `When: ${formatDateTime(m.startsAt)}, runs ${durationLabel(m.startsAt, m.endsAt)}${m.cadence === 'once' ? '' : `, repeats ${m.cadence}`}`,
      `Venue: ${m.venueName} (exact address is shared only after joining)`,
      `Join fee: ${formatFee(m.joinFeeCents)} per person`,
      `Spots: ${left === 0 ? 'full, waitlist is free to join' : `${left} of ${m.spotsTotal} left`}`,
      `Level: ${m.level} · Open to: ${m.audience} · Language: ${m.language}`,
      m.bring.length ? `Bring: ${m.bring.join(', ')}` : '',
      `Host: ${m.host.name} — ${m.host.hostedCount} hosted, ${m.host.rating.toFixed(1)}★${m.host.verified ? ', verified' : ''}`,
      `Page: /meetups/${m.slug}`,
      'Recent feedback:',
      quotes,
    ]
      .filter(Boolean)
      .join('\n');
  },
});

export const siteFactsTool = betaTool({
  name: 'get_site_facts',
  description:
    'How VibeClub itself works: what the join fee is, how passes and credits work, refunds, waitlists, ' +
    'hosting, the cities it runs in and the kinds of meetup. Use before answering any "how does it work" ' +
    'or pricing question.',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        enum: ['joining', 'passes', 'refunds', 'hosting', 'cities', 'categories', 'safety'],
      },
    },
    required: ['topic'],
    additionalProperties: false,
  } as const,
  run: async ({ topic }) => {
    switch (topic) {
      case 'joining':
        return [
          `${SITE.name} is a board of local meetups. Every meetup carries a join fee its host sets, and paying that fee is the whole transaction.`,
          'No subscription is required — a member can use the site for a year paying only per meetup.',
          'Join fees typically run from free to about ₹499, and cover the host\'s costs: court hire, a gym day pass, a study room, the food.',
          'The exact street address is released only once someone has joined; the listing shows the venue name and neighbourhood.',
          'A full meetup still takes joins onto a free waitlist. Nothing is charged unless a spot opens and the member takes it.',
          'Payments run through Razorpay. Browse at /meetups.',
        ].join('\n');
      case 'passes':
        return [
          'Passes pre-buy joins at a lower price each. One credit covers one join on any meetup, whatever its fee.',
          ...PASSES.map(
            (p) =>
              `- ${p.name}: ${p.priceCents === 0 ? 'Free' : formatMoney(p.priceCents)} ${p.cadence}. ` +
              `${p.credits === null ? 'Unlimited joins.' : `${p.credits} credits.`} ${p.tagline} Includes: ${p.perks.join('; ')}.`,
          ),
          'Credits reset each month and do not roll over. Passes are at /passes.',
        ].join('\n');
      case 'refunds':
        return [
          `Cancel more than ${FREE_CANCELLATION_HOURS} hours before a meetup starts and the join fee is refunded automatically, or the pass credit returns to the balance.`,
          `Inside ${FREE_CANCELLATION_HOURS} hours it is not refunded, because the host has usually already paid for the venue.`,
          'If a host cancels a meetup, everyone who joined is refunded in full, always.',
          'Members manage and cancel their joins at /my-meetups.',
        ].join('\n');
      case 'hosting':
        return [
          'Anyone with an account can host, and listing is free. The host sets the spots, the level, who it is open to, and the join fee.',
          'The host keeps the whole join fee — no commission is taken while the product is finding its feet.',
          'VibeClub handles the payments, the waitlist, refunds and the reminder the night before.',
          'Start at /host.',
        ].join('\n');
      case 'cities':
        return CITIES.map((c) => `- ${c.name}, ${c.state} (/meetups?city=${c.slug}) — ${c.blurb}`).join('\n');
      case 'categories':
        return CATEGORIES.map((c) => `- ${c.name} (/meetups?category=${c.slug}) — ${c.blurb}`).join('\n');
      case 'safety':
        return [
          'Hosts can be verified — a confirmed phone number plus a public rating built only from people who actually attended.',
          'Only a member whose join was confirmed, on a meetup that has finished, can leave feedback. That is what keeps the ratings meaningful.',
          'The attendee count and first names are visible before paying, and hosts can open a meetup to women only.',
          'Reports are read by a person the same day. A removed host\'s upcoming meetups are cancelled and refunded in full.',
        ].join('\n');
    }
  },
});

export const CHAT_TOOLS = [searchMeetupsTool, meetupDetailTool, siteFactsTool];
