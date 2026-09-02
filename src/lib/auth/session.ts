import { cookies } from 'next/headers';
import type { SubscriptionPlanId, UserProfile } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db, nextId } from '@/lib/data/store';

export const DEMO_COOKIE = 'hm_demo_session';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
  secure: process.env.NODE_ENV === 'production',
};

/* ------------------------------------------------------------------ */
/* Reading the session                                                 */
/* ------------------------------------------------------------------ */

export async function getCurrentUser(): Promise<UserProfile | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    return {
      id: user.id,
      email: user.email ?? '',
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? 'SitNext member',
      avatarUrl: profile?.avatar_url ?? null,
      city: profile?.city ?? '',
      bio: profile?.bio ?? '',
      plan: (profile?.plan as SubscriptionPlanId) ?? 'free',
      createdAt: profile?.created_at ?? user.created_at,
    };
  }

  const store = await cookies();
  const id = store.get(DEMO_COOKIE)?.value;
  if (!id) return null;
  const user = db().users.find((u) => u.id === id);
  if (!user) return null;
  const { password: _password, ...profile } = user;
  return profile;
}

export async function requireUser(): Promise<UserProfile | null> {
  return getCurrentUser();
}

/* ------------------------------------------------------------------ */
/* Mutating the session                                                */
/* ------------------------------------------------------------------ */

export interface AuthOutcome {
  ok: boolean;
  message?: string;
}

export async function signIn(email: string, password: string): Promise<AuthOutcome> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { ok: false, message: 'Auth unavailable.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { ok: false, message: error.message } : { ok: true };
  }

  const user = db().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    return { ok: false, message: 'That email and password combination did not match.' };
  }
  (await cookies()).set(DEMO_COOKIE, user.id, COOKIE_OPTIONS);
  return { ok: true };
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  city: string;
}): Promise<AuthOutcome> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { ok: false, message: 'Auth unavailable.' };
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.fullName, city: input.city } },
    });
    if (error) return { ok: false, message: error.message };
    if (data.user) {
      await supabase
        .from('profiles')
        .upsert({ id: data.user.id, full_name: input.fullName, city: input.city }, { onConflict: 'id' });
    }
    return { ok: true };
  }

  const store = db();
  if (store.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
    return { ok: false, message: 'An account with that email already exists.' };
  }
  const user = {
    id: nextId('u'),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    fullName: input.fullName,
    avatarUrl: `/img/avatars/a-0${(store.users.length % 8) + 1}.svg`,
    city: input.city,
    bio: '',
    plan: 'free' as SubscriptionPlanId,
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  (await cookies()).set(DEMO_COOKIE, user.id, COOKIE_OPTIONS);
  return { ok: true };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
    return;
  }
  (await cookies()).delete(DEMO_COOKIE);
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<UserProfile, 'fullName' | 'city' | 'bio'>>,
): Promise<AuthOutcome> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { ok: false, message: 'Auth unavailable.' };
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: patch.fullName, city: patch.city, bio: patch.bio })
      .eq('id', userId);
    return error ? { ok: false, message: error.message } : { ok: true };
  }

  const user = db().users.find((u) => u.id === userId);
  if (!user) return { ok: false, message: 'Profile not found.' };
  Object.assign(user, patch);
  return { ok: true };
}

export async function setPlan(userId: string, plan: SubscriptionPlanId): Promise<AuthOutcome> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { ok: false, message: 'Auth unavailable.' };
    const { error } = await supabase.from('profiles').update({ plan }).eq('id', userId);
    return error ? { ok: false, message: error.message } : { ok: true };
  }
  const user = db().users.find((u) => u.id === userId);
  if (!user) return { ok: false, message: 'Profile not found.' };
  user.plan = plan;
  return { ok: true };
}
