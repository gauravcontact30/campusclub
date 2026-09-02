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
                  {c.name}, {c.country}
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
        hint={mode === 'signup' ? 'At least 6 characters.' : undefined}
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

      <Button type="submit" size="lg" full disabled={pending}>
        {pending ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-ink/60">
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
