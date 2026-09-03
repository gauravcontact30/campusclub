import { searchMeetups } from '@/lib/data/meetups';
import { CATEGORIES, CITIES, FREE_CANCELLATION_HOURS, PASSES, SITE } from '@/lib/constants';
import { formatDateTime, formatFee, formatMoney } from '@/lib/utils';
import type { MeetupWithHost, WhenFilter } from '@/types';

/**
 * What the panel answers with when no ANTHROPIC_API_KEY is set.
 *
 * This is retrieval, not intelligence, and the UI says so rather than passing
 * it off as the assistant. It exists because the whole app is built to run with
 * zero configuration — a dead chat panel would break that promise, and a
 * pretend one would be worse than dead.
 */
const STOPWORDS = new Set([
  'a','an','and','any','are','around','as','at','best','can','find','for','get','going','good','great','has',
  'have','how','i','in','is','it','join','joining','me','my','near','nearby','of','on','or','something',
  'meetup','meetups','show','some','somewhere','the','there','thing','things','this','to','today','tonight',
  'top','want','week','what','where','which','with','you','your',
]);

/**
 * The repository matches a term as a substring of one joined string, so a whole
 * sentence never matches anything. Pull the words that carry meaning and try
 * them longest-first — "something to do in Pune this week" has to become "pune"
 * via the city match and then an empty term.
 */
function keywords(question: string, cityName?: string): string[] {
  // Split the city into its own words, so a city already recognised separately
  // is not also tried as a search term and counted as a real text match.
  const cityWords = new Set((cityName ?? '').toLowerCase().split(/\s+/).filter(Boolean));
  return question
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !cityWords.has(w))
    .sort((a, b) => b.length - a.length);
}

/** "tomorrow morning" and "this weekend" are the two people actually type. */
function whenFrom(q: string): WhenFilter {
  if (/\btomorrow\b/.test(q)) return 'tomorrow';
  if (/\b(weekend|saturday|sunday)\b/.test(q)) return 'weekend';
  if (/\b(today|tonight|this evening)\b/.test(q)) return 'today';
  if (/\b(this week|next 7|coming week)\b/.test(q)) return 'week';
  return 'any';
}

function line(m: MeetupWithHost) {
  const left = Math.max(0, m.spotsTotal - m.spotsTaken);
  return (
    `• ${m.title} — ${formatDateTime(m.startsAt)} · ${m.area}, ${m.city} · ` +
    `${formatFee(m.joinFeeCents)} to join · ${left === 0 ? 'full, waitlist open' : `${left} spots left`} — /meetups/${m.slug}`
  );
}

export async function demoAnswer(question: string): Promise<string> {
  const q = question.toLowerCase();
  const city = CITIES.find((c) => q.includes(c.name.toLowerCase()));

  if (/(refund|cancel|money back)/.test(q)) {
    return [
      `Cancel more than ${FREE_CANCELLATION_HOURS} hours before a meetup starts and the join fee comes back automatically — a pass credit returns to your balance the same way.`,
      `Inside ${FREE_CANCELLATION_HOURS} hours it does not, because the host has usually already paid for the venue.`,
      'If a host cancels, everyone is refunded in full. Manage your joins on /my-meetups.',
    ].join('\n');
  }

  if (/(pass|credit|subscri|membership)/.test(q)) {
    const lines = PASSES.map(
      (p) =>
        `• ${p.name} — ${p.priceCents === 0 ? 'free' : `${formatMoney(p.priceCents)} ${p.cadence}`}. ${p.tagline}`,
    );
    return `You do not need a pass. The default is paying the join fee for the one meetup you want, and passes just pre-buy those joins for people who go several times a week.\n\n${lines.join('\n')}\n\nFull comparison on /passes.`;
  }

  if (/(price|cost|fee|how much|charge)/.test(q)) {
    return [
      'Every meetup carries a join fee its host sets — usually between free and about ₹499 — and that is the whole cost. It covers the host\'s costs: the court, a gym day pass, the study room, the food.',
      'There is no subscription unless you want one. Browse the fees on /meetups, or see /passes.',
    ].join('\n');
  }

  if (/(host|organis|organiz|list my|run a meetup)/.test(q)) {
    return 'Hosting is free and you keep the whole join fee. You set the spots, the level and the fee; we handle payments, the waitlist and refunds. Start at /host.';
  }

  const when = whenFrom(q);
  const words = keywords(question, city?.name);
  const category = CATEGORIES.find((c) =>
    words.some((w) => c.name.toLowerCase().includes(w) || c.slug.includes(w) || c.verb.toLowerCase().includes(w)),
  );

  let items: MeetupWithHost[] = [];
  let total = 0;
  let matchedTerm: string | null = null;

  // Longest word first, then a final pass with no term at all. That last pass
  // is only worth making when something else was recognised — a city, a
  // category, a time window — or when the question carried no real words to
  // begin with ("what is on?"). Otherwise showing four unrelated meetups under
  // "nothing matched" is worse than saying so plainly.
  const attempts = [words.join(' '), ...words].filter(Boolean);
  if (city || category || when !== 'any' || !attempts.length) attempts.push('');

  for (const term of attempts) {
    const result = await searchMeetups({
      term,
      city: city?.slug ?? '',
      category: category?.slug ?? '',
      when,
      perPage: 4,
    });
    if (result.items.length) {
      ({ items, total } = result);
      matchedTerm = term || null;
      break;
    }
  }

  if (items.length) {
    // Say when the words did not match and only the city or category did —
    // "4 meetups match that" would be a lie about a fallback.
    const lead = matchedTerm
      ? `${total} meetup${total === 1 ? '' : 's'} match that.`
      : `Nothing matched those words${city ? `, but here is what is on in ${city.name}` : ', but here is what is on'}.`;
    return `${lead}\n\n${items.map(line).join('\n')}`;
  }

  return `I could not find anything for that on the board. Try /meetups to see everything that is on, or /how-it-works for how joining and fees work on ${SITE.name}.`;
}
