import type { PassId, UserProfile } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { authMessage, NO_BACKEND_MESSAGE } from './errors';

/**
 * Authentication is Supabase Auth, and only Supabase Auth.
 *
 * There is deliberately no local fallback. An app that quietly signs somebody
 * in against an in-memory list when the database is missing is an app that
 * will one day do that in production, and the failure mode — a session that
 * looks real and owns nothing — is far worse than a page that says the
 * backend is not configured.
 *
 * The data layer still runs in demo mode without Supabase; browsing works, and
 * only the member-account surfaces need a project behind them.
 */

export interface AuthOutcome {
  ok: boolean;
  message?: string;
  /**
   * Supabase accepted the sign-up but issued no session, because the project
   * has *Authentication → Providers → Email → Confirm email* switched on. The
   * account exists and is unusable until the link is clicked, so there is
   * nothing to redirect into — the caller has to say so instead.
   */
  needsEmailConfirmation?: boolean;
}

const NO_BACKEND: AuthOutcome = { ok: false, message: NO_BACKEND_MESSAGE };

/* ------------------------------------------------------------------ */
/* Reading the session                                                 */
/* ------------------------------------------------------------------ */

/**
 * The signed-in member, or null.
 *
 * `getUser()` rather than `getSession()`: the latter decodes whatever JWT is
 * in the cookie without asking the auth server whether it is still valid, so
 * on a server it is a claim from the client rather than a fact.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  // A missing profile row is survivable — the trigger may not have run yet on
  // a project set up by hand — so fall back to the signup metadata rather than
  // treating a real, authenticated member as signed out.
  const meta = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? '',
    fullName: profile?.full_name ?? (meta.full_name as string) ?? 'CampusClub member',
    avatarUrl: profile?.avatar_url ?? null,
    city: profile?.city ?? (meta.city as string) ?? '',
    bio: profile?.bio ?? '',
    pass: (profile?.pass as PassId) ?? 'payg',
    credits: Number(profile?.credits ?? 0),
    interests: (profile?.interests as string[]) ?? [],
    createdAt: profile?.created_at ?? user.created_at,
  };
}

export async function requireUser(): Promise<UserProfile | null> {
  return getCurrentUser();
}

/** Whether the account surfaces can work at all on this deployment. */
export function authAvailable() {
  return isSupabaseConfigured();
}

/* ------------------------------------------------------------------ */
/* Sign in                                                             */
/* ------------------------------------------------------------------ */

export async function signIn(email: string, password: string): Promise<AuthOutcome> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NO_BACKEND;

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  return error ? { ok: false, message: authMessage(error) } : { ok: true };
}

/* ------------------------------------------------------------------ */
/* Sign up                                                             */
/* ------------------------------------------------------------------ */

export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  city: string;
  /** Where the confirmation link should land. Absolute URL. */
  redirectTo?: string;
}): Promise<AuthOutcome> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NO_BACKEND;

  const email = input.email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      // Read back by the on_auth_user_created trigger, which is what creates
      // the profile row — see supabase/baseline.sql.
      data: { full_name: input.fullName.trim(), city: input.city },
      emailRedirectTo: input.redirectTo,
    },
  });

  if (error) return { ok: false, message: authMessage(error) };

  // Signing up with an address that already has an account is not an error to
  // Supabase — rather than confirm to a stranger that the address is
  // registered, it returns a user with an empty `identities` array. Without
  // this check the form reports success and sends them nowhere.
  if (data.user && data.user.identities?.length === 0) {
    return { ok: false, message: 'An account with that email already exists. Sign in instead.' };
  }

  // No session means confirmation is switched on. The profile row is written
  // by the trigger when the account is created, so there is nothing to do here
  // and nobody to sign in as.
  if (!data.session) return { ok: true, needsEmailConfirmation: true };

  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Sign out                                                            */
/* ------------------------------------------------------------------ */

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
}

/* ------------------------------------------------------------------ */
/* Password reset                                                      */
/* ------------------------------------------------------------------ */

/**
 * Always reports success.
 *
 * Telling an anonymous caller whether an address has an account turns this
 * form into an account-existence oracle, so the response is identical either
 * way and only the inbox differs.
 */
export async function requestPasswordReset(email: string, redirectTo: string): Promise<AuthOutcome> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NO_BACKEND;

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });

  // A send-rate error is worth surfacing — it is about their behaviour, not
  // about whether the account exists, so it leaks nothing.
  if (error && (error.code === 'over_email_send_rate_limit' || /rate limit/i.test(error.message))) {
    return { ok: false, message: authMessage(error) };
  }
  return { ok: true };
}

/** Sets a new password for the member whose recovery link is currently active. */
export async function updatePassword(password: string): Promise<AuthOutcome> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NO_BACKEND;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'That reset link has expired. Ask for a new one.' };

  const { error } = await supabase.auth.updateUser({ password });
  return error ? { ok: false, message: authMessage(error) } : { ok: true };
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<UserProfile, 'fullName' | 'city' | 'bio' | 'interests'>>,
): Promise<AuthOutcome> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NO_BACKEND;

  // Only send the columns that were actually passed, so a partial update does
  // not blank the rest of the row.
  const row: Record<string, unknown> = {};
  if (patch.fullName !== undefined) row.full_name = patch.fullName;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (patch.interests !== undefined) row.interests = patch.interests;
  if (!Object.keys(row).length) return { ok: true };

  const { error } = await supabase.from('profiles').update(row).eq('id', userId);
  return error ? { ok: false, message: error.message } : { ok: true };
}

/**
 * Activates a pass and tops the member's credit balance up to what it includes.
 * `unlimited` carries no balance — `passCoversJoin` short-circuits on it — so
 * the credit count is left at zero rather than at a lie.
 */
export async function grantPass(userId: string, pass: PassId, credits: number | null): Promise<AuthOutcome> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NO_BACKEND;

  const { error } = await supabase.from('profiles').update({ pass, credits: credits ?? 0 }).eq('id', userId);
  return error ? { ok: false, message: error.message } : { ok: true };
}
