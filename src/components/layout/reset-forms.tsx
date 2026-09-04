'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { requestPasswordResetAction, updatePasswordAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useUiStore } from '@/store/ui-store';
import type { ActionResult } from '@/types';

/**
 * Asks for the reset email.
 *
 * The success message is identical whether or not the address has an account —
 * see `requestPasswordReset`. Saying "no account with that email" here would
 * turn the form into a way of testing which addresses are registered.
 */
export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    requestPasswordResetAction,
    null,
  );
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    if (state && !state.ok && state.message) pushToast({ title: state.message, tone: 'error' });
  }, [state, pushToast]);

  if (state?.ok && state.message) {
    return (
      <div className="surface-card p-6 text-center" role="status">
        <p className="font-display text-lg font-semibold text-content">Check your inbox.</p>
        <p className="mt-2 text-sm leading-relaxed text-content/70">{state.message}</p>
        <Link href="/login" className="link-underline mt-5 inline-block font-semibold text-content">
          Back to sign in →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </Field>

      <Button type="submit" size="lg" full disabled={pending}>
        {pending ? 'Sending…' : 'Send the reset link'}
      </Button>

      <p className="text-center text-sm text-content/60">
        Remembered it?{' '}
        <Link href="/login" className="link-underline font-semibold">
          Sign in
        </Link>
      </p>
    </form>
  );
}

/** Sets the new password. Only reachable with a live recovery session. */
export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(updatePasswordAction, null);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    if (state && !state.ok && state.message) pushToast({ title: state.message, tone: 'error' });
  }, [state, pushToast]);

  return (
    <form action={formAction} className="space-y-5">
      <Field
        label="New password"
        htmlFor="password"
        hint="At least 8 characters."
        error={state?.fieldErrors?.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
        />
      </Field>

      <Button type="submit" size="lg" full disabled={pending}>
        {pending ? 'Saving…' : 'Set the new password'}
      </Button>
    </form>
  );
}
