import type { HostSummary } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from './store';

type Row = Record<string, unknown>;

function fromRow(row: Row): HostSummary {
  return {
    id: String(row.id),
    name: String(row.full_name ?? 'A VibeClub member'),
    avatarUrl: (row.avatar_url as string | null) ?? null,
    city: String(row.city ?? ''),
    bio: String(row.bio ?? ''),
    hostedCount: Number(row.hosted_count ?? 0),
    rating: Number(row.host_rating ?? 0),
    verified: Boolean(row.verified),
    memberSince: String(row.created_at),
  };
}

export async function getHosts(ids: string[]): Promise<HostSummary[]> {
  if (!ids.length) return [];
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase.from('profiles_with_host_stats').select('*').in('id', ids);
    return (data ?? []).map(fromRow);
  }
  return db().hosts.filter((h) => ids.includes(h.id));
}

export async function getHost(id: string): Promise<HostSummary | null> {
  const [host] = await getHosts([id]);
  return host ?? null;
}
