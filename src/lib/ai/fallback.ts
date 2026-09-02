import { searchBusinesses } from '@/lib/data/businesses';
import { getDinners } from '@/lib/data/dinners';
import { CATEGORIES, CITIES, PLANS, SITE } from '@/lib/constants';
import { formatMoneyForCity, openStatusLabel, priceLabel } from '@/lib/utils';

/**
 * What the panel answers with when no ANTHROPIC_API_KEY is set.
 *
 * This is retrieval, not intelligence, and the UI says so rather than passing
 * it off as the assistant. It exists because the whole app is built to run with
 * zero configuration — a dead chat panel would break that promise, and a
 * pretend one would be worse than dead.
 */
const STOPWORDS = new Set([
  'a','an','and','any','are','around','as','at','best','can','find','for','get','good','great','has','have',
  'how','i','in','is','it','me','my','near','nearby','of','on','or','place','places','rated','recommend',
  'show','some','somewhere','the','there','to','tonight','top','want','what','where','which','with','you',
]);

/**
 * The directory matches a term as a substring of one joined string, so a whole
 * sentence never matches anything. Pull the words that carry meaning and try
 * them longest-first — "best rated coffee in Bengaluru" has to become "coffee".
 */
function keywords(question: string, cityName?: string): string[] {
  // Split the city into its own words: filtering the whole name let "york"
  // through, which then matched the city text and looked like a real hit.
  const cityWords = new Set((cityName ?? '').toLowerCase().split(/\s+/).filter(Boolean));
  return question
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !cityWords.has(w))
    .sort((a, b) => b.length - a.length);
}

export async function demoAnswer(question: string): Promise<string> {
  const q = question.toLowerCase();
  const city = CITIES.find((c) => q.includes(c.name.toLowerCase()));

  if (/(price|cost|plan|membership|subscri|how much)/.test(q)) {
    const lines = PLANS.map(
      (p) => `• ${p.name} — ${p.priceCents === 0 ? 'free' : formatMoneyForCity(p.priceCents, 'Bengaluru')} ${p.cadence}. ${p.tagline}`,
    );
    return `Membership is only for the dinners; the directory and reviews are free forever.\n\n${lines.join('\n')}\n\nFull comparison on /pricing.`;
  }

  // "dinner in London" means a restaurant; only club-specific wording routes
  // here. The bare word "dinner" belongs to the directory, not the supper club.
  if (/(wednesday|stranger|dinner club|supper club|book a seat|seats? left|join a dinner|matching quiz)/.test(q)) {
    const events = (await getDinners(city?.name)).slice(0, 3);
    if (!events.length) return `No dinners are scheduled${city ? ` in ${city.name}` : ''} yet. See /dinners for every city.`;
    const lines = events.map((e) => {
      const left = Math.max(0, e.seatsTotal - e.seatsTaken);
      return `• ${e.city} · ${e.neighborhood} · ${new Date(e.startsAt).toDateString()} · ${left} of ${e.seatsTotal} seats left — /dinners/${e.id}`;
    });
    return `Dinners run every Wednesday at 8pm, six seats a table.\n\n${lines.join('\n')}\n\nEverything else is on /dinners.`;
  }

  const words = keywords(question, city?.name);
  const category = CATEGORIES.find((c) => words.some((w) => c.name.toLowerCase().includes(w) || c.slug.includes(w)));

  let items: Awaited<ReturnType<typeof searchBusinesses>>['items'] = [];
  let total = 0;
  let matchedTerm: string | null = null;
  for (const term of [words.join(' '), ...words, '']) {
    const result = await searchBusinesses({
      term,
      city: city?.name ?? '',
      category: category?.slug ?? '',
      perPage: 4,
    });
    if (result.items.length) {
      ({ items, total } = result);
      matchedTerm = term || null;
      break;
    }
    // The last pass drops the term entirely; if a city or category was
    // recognised that still answers, and if not there is genuinely nothing.
    if (!term && !city && !category) break;
  }

  if (items.length) {
    const lines = items.map(
      (b) =>
        `• ${b.name} — ${b.rating.toFixed(1)}★ · ${priceLabel(b.priceLevel, b.city)} · ${b.neighborhood}, ${b.city} · ${openStatusLabel(b.hours)} — /businesses/${b.slug}`,
    );
    // Say when the words did not match and only the city or category did —
    // "4 places match that" would be a lie about a fallback.
    const lead = matchedTerm
      ? `${total} place${total === 1 ? '' : 's'} match that.`
      : `Nothing matched those words${city ? `, but here is what is on ${city.name}` : ', but here is what is in the directory'}.`;
    return `${lead}\n\n${lines.join('\n')}`;
  }

  return `I could not find anything for that in the directory. Try /businesses to browse all ${SITE.name} listings, or /dinners for this week's tables.`;
}
