import type { HostSummary, Meetup, MeetupQuery, MeetupWithHost, Paginated, WhenFilter } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cityBySlug, CITIES } from '@/lib/constants';
import { distanceKm, slugify } from '@/lib/utils';
import mapMeetup from './meetups-mapper';
import { db, nextId, withAggregates } from './store';
import { getHost, getHosts } from './hosts';

const DEFAULT_PER_PAGE = 12;

/* ------------------------------------------------------------------ */
/* Time windows                                                        */
/* ------------------------------------------------------------------ */

/**
 * The browse page's "when" chips, resolved to a concrete range. Everything is
 * evaluated in the visitor's own timezone, because "this weekend" means the
 * weekend where they live, not where the server is.
 */
export function whenRange(when: WhenFilter, now = new Date()): { from: Date; to: Date } {
  const from = new Date(now);
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  switch (when) {
    case 'today':
      return { from, to };
    case 'tomorrow': {
      const start = new Date(now);
      start.setDate(start.getDate() + 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    }
    case 'weekend': {
      // Saturday and Sunday of the current week. On a Saturday or Sunday that
      // is today and tomorrow; on a Wednesday it is three days out.
      const day = now.getDay(); // 0 = Sunday
      const daysToSaturday = day === 0 ? 0 : 6 - day;
      const start = new Date(now);
      start.setDate(start.getDate() + daysToSaturday);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + (day === 0 ? 0 : 1));
      end.setHours(23, 59, 59, 999);
      return { from: day === 0 ? from : start, to: end };
    }
    case 'week': {
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      return { from, to: end };
    }
    default: {
      const end = new Date(now);
      end.setFullYear(end.getFullYear() + 5);
      return { from, to: end };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

function matchesTerm(meetup: Meetup, term: string) {
  const haystack = [
    meetup.title,
    meetup.description,
    meetup.venueName,
    meetup.area,
    meetup.city,
    meetup.categorySlug,
    ...meetup.tags,
  ]
    .join(' ')
    .toLowerCase();
  return term
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function sortMeetups(items: Meetup[], sort: MeetupQuery['sort']) {
  const copy = [...items];
  switch (sort) {
    case 'nearest':
      return copy.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    case 'cheapest':
      return copy.sort((a, b) => a.joinFeeCents - b.joinFeeCents);
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating || b.vouchCount - a.vouchCount);
    case 'filling':
      // Proportion of spots gone, so a 7/8 beats a 12/20.
      return copy.sort((a, b) => b.spotsTaken / b.spotsTotal - a.spotsTaken / a.spotsTotal);
    default:
      return copy.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  }
}

export async function searchMeetups(query: MeetupQuery = {}): Promise<Paginated<MeetupWithHost>> {
  const page = Math.max(1, query.page ?? 1);
  const perPage = query.perPage ?? DEFAULT_PER_PAGE;
  const { from, to } = whenRange(query.when ?? 'any');

  let pool: Meetup[];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return emptyPage(page, perPage);
    let q = supabase
      .from('meetups_with_stats')
      .select('*')
      .gte('starts_at', from.toISOString())
      .lte('starts_at', to.toISOString());
    if (query.city) q = q.ilike('city', query.city.replace(/-/g, ' '));
    if (query.category) q = q.eq('category_slug', query.category);
    if (query.level && query.level !== 'any') q = q.eq('level', query.level);
    if (query.maxFeeCents) q = q.lte('join_fee_cents', query.maxFeeCents);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    pool = (data ?? []).map(mapMeetup);
  } else {
    pool = db()
      .meetups.map((m) => withAggregates(m))
      .filter((m) => {
        const starts = new Date(m.startsAt);
        return starts >= from && starts <= to;
      })
      .filter((m) => (query.city ? slugify(m.city) === slugify(query.city) : true))
      .filter((m) => (query.category ? m.categorySlug === query.category : true))
      .filter((m) => (query.level && query.level !== 'any' ? m.level === query.level : true))
      .filter((m) => (query.maxFeeCents ? m.joinFeeCents <= query.maxFeeCents : true));
  }

  if (query.term) pool = pool.filter((m) => matchesTerm(m, query.term!));
  if (query.hasSpots) pool = pool.filter((m) => m.spotsTaken < m.spotsTotal);

  if (query.near) {
    const origin = query.near;
    pool = pool.map((m) => ({ ...m, distanceKm: distanceKm(origin, { lat: m.lat, lng: m.lng }) }));
  }

  const sorted = sortMeetups(pool, query.sort);
  const total = sorted.length;
  const items = sorted.slice((page - 1) * perPage, page * perPage);

  return {
    items: await attachHosts(items),
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

function emptyPage(page: number, perPage: number): Paginated<MeetupWithHost> {
  return { items: [], total: 0, page, perPage, pages: 1 };
}

/** One host lookup for the whole page rather than one per card. */
export async function attachHosts(meetups: Meetup[]): Promise<MeetupWithHost[]> {
  if (!meetups.length) return [];
  const hosts = await getHosts([...new Set(meetups.map((m) => m.hostId))]);
  const byId = new Map(hosts.map((h) => [h.id, h]));
  return meetups.map((m) => ({ ...m, host: byId.get(m.hostId) ?? unknownHost(m.hostId) }));
}

function unknownHost(id: string): HostSummary {
  return {
    id,
    name: 'A VibeClub member',
    avatarUrl: null,
    city: '',
    bio: '',
    hostedCount: 0,
    rating: 0,
    verified: false,
    memberSince: new Date().toISOString(),
  };
}

export async function getMeetupBySlug(slug: string): Promise<MeetupWithHost | null> {
  let meetup: Meetup | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.from('meetups_with_stats').select('*').eq('slug', slug).maybeSingle();
    meetup = data ? mapMeetup(data) : null;
  } else {
    const found = db().meetups.find((m) => m.slug === slug);
    meetup = found ? withAggregates(found) : null;
  }

  if (!meetup) return null;
  const host = await getHost(meetup.hostId);
  return { ...meetup, host: host ?? unknownHost(meetup.hostId) };
}

export async function getMeetupById(id: string): Promise<Meetup | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.from('meetups_with_stats').select('*').eq('id', id).maybeSingle();
    return data ? mapMeetup(data) : null;
  }
  const found = db().meetups.find((m) => m.id === id);
  return found ? withAggregates(found) : null;
}

export async function getMeetupsByIds(ids: string[]): Promise<MeetupWithHost[]> {
  if (!ids.length) return [];
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase.from('meetups_with_stats').select('*').in('id', ids);
    return attachHosts((data ?? []).map(mapMeetup));
  }
  const found = db().meetups.filter((m) => ids.includes(m.id)).map((m) => withAggregates(m));
  return attachHosts(found);
}

/** The home page rail: soonest-starting meetups that still have room. */
export async function getUpcomingMeetups(limit = 6, city?: string): Promise<MeetupWithHost[]> {
  const { items } = await searchMeetups({ city, hasSpots: true, sort: 'soonest', perPage: limit });
  return items;
}

/** Meetups this member is running. */
export async function getMeetupsHostedBy(userId: string): Promise<MeetupWithHost[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from('meetups_with_stats')
      .select('*')
      .eq('host_id', userId)
      .order('starts_at');
    return attachHosts((data ?? []).map(mapMeetup));
  }
  const found = db()
    .meetups.filter((m) => m.hostId === userId)
    .map((m) => withAggregates(m))
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  return attachHosts(found);
}

/** How many upcoming meetups each city currently has — powers the city strip. */
export async function countMeetupsByCity(): Promise<Record<string, number>> {
  const { items } = await searchMeetups({ perPage: 1000 });
  return items.reduce<Record<string, number>>((acc, m) => {
    acc[m.city] = (acc[m.city] ?? 0) + 1;
    return acc;
  }, {});
}

export async function countMeetupsByCategory(): Promise<Record<string, number>> {
  const { items } = await searchMeetups({ perPage: 1000 });
  return items.reduce<Record<string, number>>((acc, m) => {
    acc[m.categorySlug] = (acc[m.categorySlug] ?? 0) + 1;
    return acc;
  }, {});
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export interface NewMeetup {
  title: string;
  categorySlug: string;
  description: string;
  city: string;
  area: string;
  venueName: string;
  address: string;
  startsAt: string;
  durationMins: number;
  spotsTotal: number;
  joinFeeCents: number;
  level: Meetup['level'];
  audience: Meetup['audience'];
  language: string;
  cadence: Meetup['cadence'];
  agenda: string[];
  bring: string[];
  tags: string[];
}

/** Slugs stay readable and stay unique — the id tail is the tiebreaker. */
function meetupSlug(title: string, city: string) {
  return `${slugify(title).slice(0, 60)}-${slugify(city)}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createMeetup(hostId: string, input: NewMeetup): Promise<Meetup> {
  const startsAt = new Date(input.startsAt).toISOString();
  const endsAt = new Date(new Date(startsAt).getTime() + input.durationMins * 60_000).toISOString();
  const slug = meetupSlug(input.title, input.city);
  // No geocoder in the stack, so a new meetup inherits its city's coordinates.
  // That is right to within a few kilometres and never silently wrong by an
  // ocean, which a default of 0,0 (the Atlantic) would be.
  const cityRow = cityBySlug(slugify(input.city)) ?? CITIES.find((c) => c.name === input.city);

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error('Database unavailable.');
    const { data, error } = await supabase
      .from('meetups')
      .insert({
        slug,
        title: input.title,
        category_slug: input.categorySlug,
        host_id: hostId,
        description: input.description,
        agenda: input.agenda,
        bring: input.bring,
        venue_name: input.venueName,
        address: input.address,
        area: input.area,
        city: input.city,
        state: cityRow?.state ?? '',
        lat: cityRow?.lat ?? null,
        lng: cityRow?.lng ?? null,
        starts_at: startsAt,
        ends_at: endsAt,
        spots_total: input.spotsTotal,
        join_fee_cents: input.joinFeeCents,
        level: input.level,
        audience: input.audience,
        language: input.language,
        cadence: input.cadence,
        tags: input.tags,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapMeetup({ ...data, rating: 0, vouch_count: 0 });
  }

  const store = db();
  const meetup: Meetup = {
    id: nextId('m'),
    slug,
    title: input.title,
    categorySlug: input.categorySlug,
    hostId,
    description: input.description,
    agenda: input.agenda,
    bring: input.bring,
    venueName: input.venueName,
    address: input.address,
    area: input.area,
    city: input.city,
    state: cityRow?.state ?? '',
    lat: cityRow?.lat ?? 0,
    lng: cityRow?.lng ?? 0,
    startsAt,
    endsAt,
    spotsTotal: input.spotsTotal,
    spotsTaken: 0,
    joinFeeCents: input.joinFeeCents,
    level: input.level,
    audience: input.audience,
    language: input.language,
    cadence: input.cadence,
    coverImage: null,
    tags: input.tags,
    createdAt: new Date().toISOString(),
    rating: 0,
    vouchCount: 0,
  };
  store.meetups.push(meetup);
  return meetup;
}

export async function cancelMeetup(hostId: string, meetupId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return false;
    const { error } = await supabase.from('meetups').delete().eq('id', meetupId).eq('host_id', hostId);
    return !error;
  }
  const store = db();
  const index = store.meetups.findIndex((m) => m.id === meetupId && m.hostId === hostId);
  if (index < 0) return false;
  store.meetups.splice(index, 1);
  store.joins = store.joins.filter((j) => j.meetupId !== meetupId);
  return true;
}
