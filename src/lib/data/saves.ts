import type { Business } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db, withAggregates } from './store';

export async function getSavedBusinessIds(userId: string): Promise<string[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase.from('saves').select('business_id').eq('user_id', userId);
    return (data ?? []).map((r: { business_id: string }) => r.business_id);
  }
  return db().saves.filter((s) => s.userId === userId).map((s) => s.businessId);
}

export async function getSavedBusinesses(userId: string): Promise<Business[]> {
  const ids = await getSavedBusinessIds(userId);
  if (!ids.length) return [];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase.from('businesses_with_stats').select('*').in('id', ids);
    const { items } = { items: (data ?? []) as Record<string, unknown>[] };
    const { default: mapper } = await import('./businesses-mapper');
    return items.map(mapper);
  }

  return db().businesses.filter((b) => ids.includes(b.id)).map((b) => withAggregates(b));
}

/** Returns true when the business ends up saved. */
export async function toggleSave(userId: string, businessId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from('saves')
        .select('business_id')
        .eq('user_id', userId)
        .eq('business_id', businessId)
        .maybeSingle();
      if (data) {
        await supabase.from('saves').delete().eq('user_id', userId).eq('business_id', businessId);
        return false;
      }
      await supabase.from('saves').insert({ user_id: userId, business_id: businessId });
      return true;
    }
  }

  const store = db();
  const idx = store.saves.findIndex((s) => s.userId === userId && s.businessId === businessId);
  if (idx >= 0) {
    store.saves.splice(idx, 1);
    return false;
  }
  store.saves.push({ userId, businessId });
  return true;
}
