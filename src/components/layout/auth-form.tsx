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
      <div className="surface-card p-6 text-center" role="status">
        <p className="font-display text-lg font-semibold text-content">Almost there.</p>
        <p className="mt-2 text-sm leading-relaxed text-content/70">{state.message}</p>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="link-underline mt-5 inline-block font-semibold text-content"
        >
          Go to sign in →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
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

      {mode === 'signin' && (
        <p className="-mt-1 text-right">
          <Link href="/forgot-password" className="text-sm font-medium text-content/60 hover:text-brand">
            Forgotten your password?
          </Link>
        </p>
      )}

      <Button type="submit" size="lg" full disabled={pending}>
        {pending ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-content/60">
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
