import type { MeetupWithHost } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from './store';
import { getMeetupsByIds } from './meetups';

export async function getSavedMeetupIds(userId: string): Promise<string[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase.from('saves').select('meetup_id').eq('user_id', userId);
    return (data ?? []).map((r: { meetup_id: string }) => r.meetup_id);
  }
  return db().saves.filter((s) => s.userId === userId).map((s) => s.meetupId);
}

export async function getSavedMeetups(userId: string): Promise<MeetupWithHost[]> {
  const ids = await getSavedMeetupIds(userId);
  return getMeetupsByIds(ids);
}

/** Returns true when the meetup ends up saved. */
export async function toggleSave(userId: string, meetupId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from('saves')
        .select('meetup_id')
        .eq('user_id', userId)
        .eq('meetup_id', meetupId)
        .maybeSingle();
      if (data) {
        await supabase.from('saves').delete().eq('user_id', userId).eq('meetup_id', meetupId);
        return false;
      }
      await supabase.from('saves').insert({ user_id: userId, meetup_id: meetupId });
      return true;
    }
  }

  const store = db();
  const idx = store.saves.findIndex((s) => s.userId === userId && s.meetupId === meetupId);
  if (idx >= 0) {
    store.saves.splice(idx, 1);
    return false;
  }
  store.saves.push({ userId, meetupId });
  return true;
}
