'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  getCurrentUser,
  requestPasswordReset,
  signIn,
  signOut,
  signUp,
  updatePassword,
  updateProfile,
} from '@/lib/auth/session';
import { newPasswordSchema, profileSchema, resetRequestSchema, signInSchema, signUpSchema } from '@/lib/validators';
import { CATEGORY_SLUGS, SITE } from '@/lib/constants';
import { fieldErrors } from '@/lib/form';
import type { ActionResult } from '@/types';

/**
 * The origin this request actually arrived on.
 *
 * Emailed auth links have to point back at the deployment the visitor is
 * using — a preview URL, a custom domain, localhost — and a hardcoded
 * `SITE.url` sends every preview signup to production. The forwarded headers
 * are set by the platform, not by the browser, so they are safe to trust here;
 * `SITE.url` is the fallback when neither is present.
 */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return SITE.url;
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

/** Only ever redirect inside this site — `next` comes from a URL. */
function safeNext(value: FormDataEntryValue | null, fallback: string) {
  const next = String(value ?? '');
  return next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}

export async function signInAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const result = await signIn(parsed.data.email, parsed.data.password);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath('/', 'layout');
  redirect(safeNext(formData.get('next'), '/'));
}

export async function signUpAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const next = safeNext(formData.get('next'), '/profile/interests');
  const origin = await requestOrigin();

  const result = await signUp({
    ...parsed.data,
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
  });
  if (!result.ok) return { ok: false, message: result.message };

  // With "Confirm email" on there is no session yet, so redirecting would drop
  // a signed-out visitor onto a members-only page and look like a failed
  // sign-up. Tell them to go and click the link instead.
  if (result.needsEmailConfirmation) {
    return {
      ok: true,
      message: `Account created. Check ${parsed.data.email} for a confirmation link, then sign in.`,
    };
  }

  revalidatePath('/', 'layout');
  // Straight into picking interests — the feed is much better with them, and
  // this is the one moment a new member is willing to answer four questions.
  redirect(next);
}

export async function signOutAction() {
  await signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function requestPasswordResetAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const origin = await requestOrigin();
  const result = await requestPasswordReset(parsed.data.email, `${origin}/auth/callback?next=/reset-password`);
  if (!result.ok) return { ok: false, message: result.message };

  // Deliberately the same answer whether or not the address has an account —
  // anything else turns this form into an account-existence oracle.
  return {
    ok: true,
    message: `If ${parsed.data.email} has an account, a reset link is on its way. It expires in an hour.`,
  };
}

export async function updatePasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const result = await updatePassword(parsed.data.password);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath('/', 'layout');
  redirect('/my-meetups');
}

export async function updateProfileAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to update your profile.' };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const result = await updateProfile(user.id, parsed.data);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath('/profile');
  return { ok: true, message: 'Profile updated.' };
}

export async function saveInterestsAction(interests: string[]): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in first.' };

  // Never trust a client list of slugs — anything not in the catalogue is dropped.
  const clean = interests.filter((slug) => CATEGORY_SLUGS.includes(slug)).slice(0, 8);
  const result = await updateProfile(user.id, { interests: clean });
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath('/', 'layout');
  return { ok: true, message: 'Saved.' };
}
