'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn, signOut, signUp, updateProfile, getCurrentUser, setPlan } from '@/lib/auth/session';
import { profileSchema, signInSchema, signUpSchema } from '@/lib/validators';
import type { ActionResult, SubscriptionPlanId } from '@/types';

function fieldErrors(error: { issues: { path: (string | number)[]; message: string }[] }) {
  return Object.fromEntries(error.issues.map((i) => [String(i.path[0]), i.message]));
}

export async function signInAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const result = await signIn(parsed.data.email, parsed.data.password);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath('/', 'layout');
  const next = String(formData.get('next') ?? '/');
  redirect(next);
}

export async function signUpAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const result = await signUp(parsed.data);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath('/', 'layout');
  redirect(String(formData.get('next') ?? '/dinners/quiz'));
}

export async function signOutAction() {
  await signOut();
  revalidatePath('/', 'layout');
  redirect('/');
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

export async function choosePlanAction(plan: SubscriptionPlanId): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Create an account to pick a plan.' };

  const result = await setPlan(user.id, plan);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath('/pricing');
  revalidatePath('/profile');
  return { ok: true, message: 'Plan updated.' };
}
