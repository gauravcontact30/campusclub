import { cookies } from 'next/headers';
import type { PassId, UserProfile } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db, nextId } from '@/lib/data/store';

export const DEMO_COOKIE = 'cc_demo_session';

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
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? 'CampusClub member',
      avatarUrl: profile?.avatar_url ?? null,
      city: profile?.city ?? '',
      bio: profile?.bio ?? '',
      pass: (profile?.pass as PassId) ?? 'payg',
      credits: Number(profile?.credits ?? 0),
      interests: (profile?.interests as string[]) ?? [],
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
  /**
   * Supabase accepted the sign-up but issued no session, because the project
   * has *Authentication → Providers → Email → Confirm email* switched on.
   * The account exists and is unusable until the link is clicked, so there is
   * nothing to redirect into — the caller has to say so instead.
   */
  needsEmailConfirmation?: boolean;
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
      // Read back by the on_auth_user_created trigger, which is what actually
      // creates the profile row — see supabase/baseline.sql.
      options: { data: { full_name: input.fullName, city: input.city } },
    });
    if (error) return { ok: false, message: error.message };

    // Signing up with an address that already has an account is not an error
    // to Supabase — it returns a user with no identities rather than confirm
    // to a stranger that the address is registered. Without this the form
    // would report success and send them into an account that is not theirs.
    if (data.user && data.user.identities?.length === 0) {
      return { ok: false, message: 'An account with that email already exists. Sign in instead.' };
    }

    // No session means confirmation is on. The profile row is created by the
    // trigger when they confirm, so there is nothing to write here — and
    // nothing to sign in as.
    if (!data.session) return { ok: true, needsEmailConfirmation: true };

    // Belt and braces for a project whose trigger was never applied. It runs
    // as the newly signed-in user, so the "insert own profile" policy accepts
    // it; before the session check above it ran anonymously and RLS rejected
    // it every time, silently, because the error was never read.
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: data.user!.id, full_name: input.fullName, city: input.city }, { onConflict: 'id' });
    if (profileError) {
      // Not fatal: the account exists, and getCurrentUser falls back to the
      // signup metadata when no profile row is found. Worth seeing in logs.
      console.error('[auth] profile upsert after sign-up failed:', profileError.message);
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
    // Left null so the Avatar renders token-coloured initials, which follow
    // whichever theme the visitor is in.
    avatarUrl: null,
    city: input.city,
    bio: '',
    pass: 'payg' as PassId,
    credits: 0,
    interests: [],
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
  patch: Partial<Pick<UserProfile, 'fullName' | 'city' | 'bio' | 'interests'>>,
): Promise<AuthOutcome> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { ok: false, message: 'Auth unavailable.' };
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: patch.fullName, city: patch.city, bio: patch.bio, interests: patch.interests })
      .eq('id', userId);
    return error ? { ok: false, message: error.message } : { ok: true };
  }

  const user = db().users.find((u) => u.id === userId);
  if (!user) return { ok: false, message: 'Profile not found.' };
  Object.assign(user, patch);
  return { ok: true };
}

/**
 * Activates a pass and tops the member's credit balance up to what it includes.
 * `unlimited` carries no balance — `passCoversJoin` short-circuits on it — so
 * the credit count is left at zero rather than at a lie.
 */
export async function grantPass(userId: string, pass: PassId, credits: number | null): Promise<AuthOutcome> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { ok: false, message: 'Auth unavailable.' };
    const { error } = await supabase.from('profiles').update({ pass, credits: credits ?? 0 }).eq('id', userId);
    return error ? { ok: false, message: error.message } : { ok: true };
  }
  const user = db().users.find((u) => u.id === userId);
  if (!user) return { ok: false, message: 'Profile not found.' };
  user.pass = pass;
  user.credits = credits ?? 0;
  return { ok: true };
}
