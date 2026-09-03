import type { Vouch } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db, nextId } from './store';

type Row = Record<string, unknown>;

function fromRow(row: Row): Vouch {
  return {
    id: String(row.id),
    meetupId: String(row.meetup_id),
    userId: String(row.user_id),
    authorName: String(row.author_name ?? 'A VibeClub member'),
    authorAvatar: (row.author_avatar as string | null) ?? null,
    rating: Number(row.rating ?? 0),
    body: String(row.body ?? ''),
    highlights: (row.highlights as string[]) ?? [],
    createdAt: String(row.created_at),
    hostReply: (row.host_reply as string | null) ?? null,
    hostReplyAt: (row.host_reply_at as string | null) ?? null,
  };
}

export type VouchSort = 'recent' | 'rating';

export async function getVouches(meetupId: string, sort: VouchSort = 'recent'): Promise<Vouch[]> {
  let items: Vouch[];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase.from('vouches_with_author').select('*').eq('meetup_id', meetupId);
    items = (data ?? []).map(fromRow);
  } else {
    items = db().vouches.filter((v) => v.meetupId === meetupId);
  }

  return sort === 'rating'
    ? [...items].sort((a, b) => b.rating - a.rating)
    : [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

/** The 1–5 histogram under the rating, so the average is never the whole story. */
export function ratingBreakdown(vouches: Vouch[]) {
  const counts = [0, 0, 0, 0, 0];
  vouches.forEach((v) => {
    const idx = Math.min(4, Math.max(0, Math.round(v.rating) - 1));
    counts[idx] += 1;
  });
  return counts.map((count, i) => ({
    stars: i + 1,
    count,
    share: vouches.length ? count / vouches.length : 0,
  }));
}

/** The highlights attendees ticked most often — a chip rail on the detail page. */
export function topHighlights(vouches: Vouch[], limit = 4) {
  const tally = new Map<string, number>();
  vouches.forEach((v) => v.highlights.forEach((h) => tally.set(h, (tally.get(h) ?? 0) + 1)));
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

export async function addVouch(input: {
  meetupId: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  body: string;
  highlights: string[];
}): Promise<Vouch> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error('Database unavailable.');
    const { data, error } = await supabase
      .from('vouches')
      .insert({
        meetup_id: input.meetupId,
        user_id: input.userId,
        rating: input.rating,
        body: input.body,
        highlights: input.highlights,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return fromRow({ ...data, author_name: input.authorName, author_avatar: input.authorAvatar });
  }

  const vouch: Vouch = {
    id: nextId('v'),
    meetupId: input.meetupId,
    userId: input.userId,
    authorName: input.authorName,
    authorAvatar: input.authorAvatar,
    rating: input.rating,
    body: input.body,
    highlights: input.highlights,
    createdAt: new Date().toISOString(),
    hostReply: null,
    hostReplyAt: null,
  };
  db().vouches.unshift(vouch);
  return vouch;
}

/** A host answering feedback on their own meetup. */
export async function replyToVouch(hostId: string, vouchId: string, body: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return false;
    const { error } = await supabase.rpc('reply_to_vouch', {
      p_vouch_id: vouchId,
      p_host_id: hostId,
      p_body: body,
    });
    return !error;
  }

  const store = db();
  const vouch = store.vouches.find((v) => v.id === vouchId);
  if (!vouch) return false;
  const meetup = store.meetups.find((m) => m.id === vouch.meetupId);
  if (!meetup || meetup.hostId !== hostId) return false;
  vouch.hostReply = body;
  vouch.hostReplyAt = new Date().toISOString();
  return true;
}

/** Every vouch left on any meetup this member hosts. */
export async function getVouchesForHost(hostId: string): Promise<Vouch[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase.from('vouches_with_author').select('*').eq('host_id', hostId);
    return (data ?? []).map(fromRow);
  }
  const store = db();
  const mine = new Set(store.meetups.filter((m) => m.hostId === hostId).map((m) => m.id));
  return store.vouches.filter((v) => mine.has(v.meetupId));
}
