import type { BookingStatus, DinnerBooking, DinnerEvent, QuizAnswers } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hashIndex, slugify } from '@/lib/utils';
import { db, nextId } from './store';
import { SEED_USERS } from './seed';

type Row = Record<string, unknown>;

function fromRow(row: Row): DinnerEvent {
  return {
    id: String(row.id),
    city: String(row.city),
    neighborhood: String(row.neighborhood ?? ''),
    venueName: String(row.venue_name ?? ''),
    venueRevealAt: String(row.venue_reveal_at),
    startsAt: String(row.starts_at),
    seatsTotal: Number(row.seats_total ?? 6),
    seatsTaken: Number(row.seats_taken ?? 0),
    priceCents: Number(row.price_cents ?? 0),
    language: String(row.language ?? 'English'),
    vibe: String(row.vibe ?? ''),
    coverImage: String(row.cover_image ?? ''),
    hostNotes: String(row.host_notes ?? ''),
  };
}

export async function getDinners(city?: string): Promise<DinnerEvent[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let q = supabase.from('dinner_events').select('*').gte('starts_at', new Date().toISOString());
      if (city) q = q.ilike('city', city.replace(/-/g, ' '));
      const { data, error } = await q.order('starts_at');
      if (error) throw new Error(error.message);
      return (data ?? []).map(fromRow);
    }
  }
  const items = db().dinners.filter((d) => (city ? slugify(d.city) === slugify(city) : true));
  return items.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
}

export async function getDinner(id: string): Promise<DinnerEvent | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.from('dinner_events').select('*').eq('id', id).maybeSingle();
      return data ? fromRow(data) : null;
    }
  }
  return db().dinners.find((d) => d.id === id) ?? null;
}

export async function getBookingsForUser(userId: string): Promise<(DinnerBooking & { event: DinnerEvent })[]> {
  let bookings: DinnerBooking[];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase.from('dinner_bookings').select('*').eq('user_id', userId);
    bookings = (data ?? []).map((r: Row) => ({
      id: String(r.id),
      eventId: String(r.event_id),
      userId: String(r.user_id),
      status: String(r.status) as BookingStatus,
      seatNumber: Number(r.seat_number ?? 1),
      createdAt: String(r.created_at),
    }));
  } else {
    bookings = db().bookings.filter((b) => b.userId === userId);
  }

  const withEvents = await Promise.all(
    bookings.map(async (b) => {
      const event = await getDinner(b.eventId);
      return event ? { ...b, event } : null;
    }),
  );
  return withEvents
    .filter((b): b is DinnerBooking & { event: DinnerEvent } => b !== null)
    .sort((a, b) => +new Date(a.event.startsAt) - +new Date(b.event.startsAt));
}

export async function getBookingForEvent(userId: string, eventId: string): Promise<DinnerBooking | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from('dinner_bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();
    if (!data) return null;
    return {
      id: String(data.id),
      eventId: String(data.event_id),
      userId: String(data.user_id),
      status: String(data.status) as BookingStatus,
      seatNumber: Number(data.seat_number ?? 1),
      createdAt: String(data.created_at),
    };
  }
  return db().bookings.find((b) => b.userId === userId && b.eventId === eventId && b.status !== 'cancelled') ?? null;
}

export async function bookSeat(userId: string, eventId: string): Promise<DinnerBooking> {
  const event = await getDinner(eventId);
  if (!event) throw new Error('That dinner no longer exists.');

  const existing = await getBookingForEvent(userId, eventId);
  if (existing) return existing;

  const full = event.seatsTaken >= event.seatsTotal;
  const status: BookingStatus = full ? 'waitlisted' : 'confirmed';

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('dinner_bookings')
        .insert({ event_id: eventId, user_id: userId, status, seat_number: event.seatsTaken + 1 })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      if (!full) await supabase.rpc('increment_seats_taken', { p_event_id: eventId });
      return {
        id: String(data.id),
        eventId,
        userId,
        status,
        seatNumber: Number(data.seat_number),
        createdAt: String(data.created_at),
      };
    }
  }

  const store = db();
  const booking: DinnerBooking = {
    id: nextId('bk'),
    eventId,
    userId,
    status,
    seatNumber: event.seatsTaken + 1,
    createdAt: new Date().toISOString(),
  };
  store.bookings.push(booking);
  const target = store.dinners.find((d) => d.id === eventId);
  if (target && !full) target.seatsTaken += 1;
  return booking;
}

export async function cancelBooking(userId: string, bookingId: string) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from('dinner_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', userId)
        .select('event_id')
        .maybeSingle();
      if (data) await supabase.rpc('decrement_seats_taken', { p_event_id: data.event_id });
      return;
    }
  }
  const store = db();
  const booking = store.bookings.find((b) => b.id === bookingId && b.userId === userId);
  if (!booking) return;
  if (booking.status === 'confirmed') {
    const event = store.dinners.find((d) => d.id === booking.eventId);
    if (event) event.seatsTaken = Math.max(0, event.seatsTaken - 1);
  }
  booking.status = 'cancelled';
}

/* --------------------------- matching questionnaire -------------------------- */

export async function saveQuiz(userId: string, answers: QuizAnswers) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      await supabase.from('quiz_responses').upsert({ user_id: userId, answers }, { onConflict: 'user_id' });
      return;
    }
  }
  db().quiz[userId] = answers;
}

export async function getQuiz(userId: string): Promise<QuizAnswers | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.from('quiz_responses').select('answers').eq('user_id', userId).maybeSingle();
    return (data?.answers as QuizAnswers) ?? null;
  }
  return db().quiz[userId] ?? null;
}

export interface TableMate {
  name: string;
  avatar: string | null;
  ageBand: string;
  works: string;
  sharedInterest: string;
}

const OCCUPATIONS = ['Architect', 'Nurse', 'Teacher', 'Sound engineer', 'Founder', 'Illustrator', 'Physiotherapist', 'Data analyst', 'Chef', 'Lawyer'];
const INTERESTS = ['live music', 'long walks with no destination', 'natural wine', 'film photography', 'sci-fi paperbacks', 'open-water swimming', 'street food crawls', 'board games'];
const AGE_BANDS = ['21–29', '30–39', '40–49'];

/**
 * The table is revealed as five anonymised profiles — first names only, like
 * the real product. Deterministic from the booking so it never re-shuffles.
 */
export function buildTable(eventId: string, userId: string): TableMate[] {
  const pool = SEED_USERS.filter((u) => u.id !== userId);
  return Array.from({ length: 5 }, (_, i) => {
    const person = pool[hashIndex(`${eventId}:${userId}:${i}`, pool.length)];
    return {
      name: person.fullName.split(' ')[0],
      avatar: person.avatarUrl,
      ageBand: AGE_BANDS[hashIndex(`${eventId}:age:${i}`, AGE_BANDS.length)],
      works: OCCUPATIONS[hashIndex(`${eventId}:job:${i}`, OCCUPATIONS.length)],
      sharedInterest: INTERESTS[hashIndex(`${eventId}:int:${i}`, INTERESTS.length)],
    };
  });
}
