import { describe, expect, it } from 'vitest';
import { authMessage, NO_BACKEND_MESSAGE } from '@/lib/auth/errors';

/**
 * These messages are the entire visible surface of a failed sign-in, so what
 * matters is that each distinct failure produces a distinct, actionable
 * sentence — and that none of them leak raw API text at a member.
 */
describe('authMessage', () => {
  it('prefers the stable error code over the human message', () => {
    // The `message` here is the one Supabase used to send; the code is what
    // survives a version bump, so it has to win.
    const msg = authMessage({ code: 'invalid_credentials', message: 'AuthApiError: something internal' });
    expect(msg).toBe('That email and password combination did not match.');
  });

  it('distinguishes an unconfirmed account from a wrong password', () => {
    const unconfirmed = authMessage({ code: 'email_not_confirmed' });
    const wrong = authMessage({ code: 'invalid_credentials' });
    expect(unconfirmed).toMatch(/confirmation link/i);
    expect(unconfirmed).not.toBe(wrong);
  });

  it('falls back to matching the message when no code is supplied', () => {
    expect(authMessage({ message: 'Invalid login credentials' })).toBe(
      'That email and password combination did not match.',
    );
    expect(authMessage({ message: 'Email not confirmed' })).toMatch(/confirmation link/i);
    expect(authMessage({ message: 'User already registered' })).toMatch(/already exists/i);
  });

  it('tells somebody hitting a rate limit to wait rather than retry blindly', () => {
    expect(authMessage({ code: 'over_request_rate_limit' })).toMatch(/wait/i);
    expect(authMessage({ message: 'email rate limit exceeded' })).toMatch(/wait/i);
  });

  it('does not show a member the raw text of a server-side failure', () => {
    const msg = authMessage({ status: 503, message: 'upstream connect error: connection refused' });
    expect(msg).not.toMatch(/upstream|connection refused/i);
    expect(msg).toMatch(/try again/i);
  });

  it('passes through an unrecognised message rather than swallowing it', () => {
    // Better a slightly technical sentence than a generic one that hides the
    // only clue anybody has.
    expect(authMessage({ message: 'Signups are restricted to an allow list' })).toBe(
      'Signups are restricted to an allow list',
    );
  });

  it('uses the fallback when there is nothing to go on', () => {
    expect(authMessage(null)).toBe('Something went wrong. Try again.');
    expect(authMessage({})).toBe('Something went wrong. Try again.');
    expect(authMessage(undefined, 'Could not sign you in.')).toBe('Could not sign you in.');
  });

  it('names both environment variables in the no-backend message', () => {
    // This is the one message a developer, not a member, has to act on.
    expect(NO_BACKEND_MESSAGE).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(NO_BACKEND_MESSAGE).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });
});
