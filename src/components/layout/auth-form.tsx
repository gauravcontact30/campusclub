'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { signInAction, signUpAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { useUiStore } from '@/store/ui-store';
import { CITIES } from '@/lib/constants';
import type { ActionResult } from '@/types';

export function AuthForm({ mode, next }: { mode: 'signin' | 'signup'; next: string }) {
  const action = mode === 'signin' ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    if (state && !state.ok && state.message) pushToast({ title: state.message, tone: 'error' });
  }, [state, pushToast]);

  // A confirmation instruction has to stay on screen — a toast that fades
  // after four seconds is the wrong carrier for "go and check your inbox".
  if (state?.ok && state.message) {
    return (
      // Already inside the auth card, so this is a plain block: a card drawn
      // inside a card reads as a dialog nobody opened.
      <div role="status">
        <p className="font-display text-lg font-semibold text-content">Almost there.</p>
        <p className="mt-2 text-sm leading-relaxed text-content/70">{state.message}</p>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="link-underline mt-6 inline-block text-sm font-semibold text-content"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* The panel heading opposite is a greeting ("Welcome back."), not a
          label — so the form itself still needs to say which of the two acts
          it performs. The rule under it is what lets that stay this quiet: a
          hairline does the separating that extra size and weight would
          otherwise have to do. */}
      <div className="border-b border-content/10 pb-4">
        <h2 className="font-display text-xl font-semibold text-content">
          {mode === 'signin' ? 'Sign in' : 'Sign up'}
        </h2>
      </div>

      <input type="hidden" name="next" value={next} />

      {mode === 'signup' && (
        <>
          <Field label="Your name" htmlFor="fullName" error={state?.fieldErrors?.fullName}>
            <Input id="fullName" name="fullName" autoComplete="name" placeholder="Priya Nair" required />
          </Field>
          <Field label="Your city" htmlFor="city" error={state?.fieldErrors?.city}>
            <Select id="city" name="city" defaultValue="" required>
              <option value="" disabled>
                Choose a city
              </option>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name}, {c.state}
                </option>
              ))}
            </Select>
          </Field>
        </>
      )}

      <Field label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        hint={mode === 'signup' ? 'At least 8 characters.' : undefined}
        error={state?.fieldErrors?.password}
        /* Beside the label rather than floating under the field: it belongs to
           the password, and under the field it reads as a step in the form. */
        action={
          mode === 'signin' ? (
            <Link href="/forgot-password" className="text-sm text-content/55 hover:text-brand">
              Forgotten it?
            </Link>
          ) : undefined
        }
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          placeholder="••••••••"
          required
        />
      </Field>

      <Button type="submit" size="lg" full disabled={pending} className="!mt-7">
        {pending ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </Button>

      <p className="border-t border-content/10 pt-5 text-center text-sm text-content/60">
        {mode === 'signin' ? (
          <>
            New here?{' '}
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="link-underline font-semibold">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already a member?{' '}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="link-underline font-semibold">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
