/**
 * A deliberately partial reader for OSM `opening_hours`.
 *
 * The full grammar has public holidays, sunset offsets, week numbers and
 * month ranges, and implementing it would be a library rather than a file.
 * This handles the four shapes that cover almost every Indian POI — a weekday
 * range, a list of days, split shifts, and 24/7 — and returns `{}` for
 * anything it does not recognise. An empty result costs a business one point
 * of completeness and hides it from the "open now" filter, which is the
 * honest outcome: we do not know when it is open.
 */

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_INDEX = {
  mo: 0, tu: 1, we: 2, th: 3, fr: 4, sa: 5, su: 6,
};

function minutesOf(clock) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(clock.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 24 || mins > 59) return null;
  return hours * 60 + mins;
}

/** "Mo-Fr", "Sa,Su", "Mo" → indices into DAY_KEYS. */
function daysOf(spec) {
  const out = new Set();

  for (const part of spec.split(',')) {
    const range = /^([A-Za-z]{2})\s*-\s*([A-Za-z]{2})$/.exec(part.trim());
    if (range) {
      const from = DAY_INDEX[range[1].toLowerCase()];
      const to = DAY_INDEX[range[2].toLowerCase()];
      if (from === undefined || to === undefined) continue;
      // Wraps across the end of the week: "Fr-Mo" is Fri, Sat, Sun, Mon.
      for (let i = from; ; i = (i + 1) % 7) {
        out.add(i);
        if (i === to) break;
      }
      continue;
    }
    const single = DAY_INDEX[part.trim().toLowerCase()];
    if (single !== undefined) out.add(single);
  }

  return [...out];
}

export function parseOpeningHours(raw) {
  const value = (raw ?? '').trim();
  if (!value) return {};

  if (/^24\s*\/\s*7$/.test(value)) {
    return Object.fromEntries(DAY_KEYS.map((d) => [d, [{ open: 0, close: 1440 }]]));
  }

  const hours = {};

  for (const rule of value.split(';')) {
    const trimmed = rule.trim();
    if (!trimmed) continue;

    const match = /^([A-Za-z]{2}(?:\s*[-,]\s*[A-Za-z]{2})*)\s+(.+)$/.exec(trimmed);
    if (!match) continue;

    const days = daysOf(match[1]);
    if (!days.length) continue;
    const rest = match[2].trim();

    // "Su off" / "Su closed" is information, not absence: record the empty day
    // so the UI can say "closed Sunday" rather than "hours unknown".
    if (/^(off|closed)$/i.test(rest)) {
      for (const d of days) hours[DAY_KEYS[d]] = [];
      continue;
    }

    const intervals = [];
    for (const span of rest.split(',')) {
      const parts = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.exec(span.trim());
      if (!parts) continue;
      const open = minutesOf(parts[1]);
      let close = minutesOf(parts[2]);
      if (open === null || close === null) continue;
      // 18:00-02:00 closes the next day. Keeping it as one interval past 1440
      // means "open now" stays a comparison rather than a special case.
      if (close <= open) close += 1440;
      intervals.push({ open, close });
    }

    if (intervals.length) {
      for (const d of days) hours[DAY_KEYS[d]] = intervals;
    }
  }

  return hours;
}
