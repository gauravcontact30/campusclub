/**
 * Supabase auth errors, translated into something a member can act on.
 *
 * The raw messages are written for developers ("Invalid login credentials",
 * "AuthApiError: over_request_rate_limit") and leak implementation detail into
 * the UI. Worse, a couple of them are actively misleading: a correct password
 * on an unconfirmed account returns the same generic failure as a wrong one.
 *
 * Matching is on `code` where Supabase supplies one, because the human-readable
 * `message` is not a stable API and has changed between releases.
 */
export interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

const BY_CODE: Record<string, string> = {
  invalid_credentials: 'That email and password combination did not match.',
  email_not_confirmed: 'Check your inbox and click the confirmation link before signing in.',
  email_exists: 'An account with that email already exists. Sign in instead.',
  user_already_exists: 'An account with that email already exists. Sign in instead.',
  weak_password: 'Pick a longer password — at least 8 characters, and not a common one.',
  over_request_rate_limit: 'Too many attempts. Wait a minute and try again.',
  over_email_send_rate_limit: 'Too many emails sent to that address. Wait a few minutes and try again.',
  same_password: 'That is already your password. Choose a different one.',
  session_expired: 'That link has expired. Ask for a new one.',
  flow_state_expired: 'That link has expired. Ask for a new one.',
  validation_failed: 'Check the details above and try again.',
  signup_disabled: 'New accounts are closed at the moment.',
  email_address_invalid: 'That email address was rejected. Check it for typos.',
};

/** Fallbacks for versions that send no `code`, keyed on a stable fragment. */
const BY_FRAGMENT: [RegExp, string][] = [
  [/invalid login credentials/i, BY_CODE.invalid_credentials],
  [/email not confirmed/i, BY_CODE.email_not_confirmed],
  [/already registered|already exists/i, BY_CODE.email_exists],
  [/password should be at least|weak password/i, BY_CODE.weak_password],
  [/rate limit/i, BY_CODE.over_request_rate_limit],
  [/unable to validate email|invalid format/i, BY_CODE.email_address_invalid],
];

export function authMessage(error: AuthErrorLike | null | undefined, fallback = 'Something went wrong. Try again.') {
  if (!error) return fallback;
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];

  const message = error.message ?? '';
  for (const [pattern, friendly] of BY_FRAGMENT) {
    if (pattern.test(message)) return friendly;
  }

  // A 5xx from the auth service is not the member's problem and there is
  // nothing for them to correct, so do not show them the raw text.
  if (error.status && error.status >= 500) return 'The sign-in service is having a moment. Try again shortly.';

  return message || fallback;
}

/** Shown wherever auth is reached with no Supabase project behind it. */
export const NO_BACKEND_MESSAGE =
  'Accounts need a Supabase project. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then reload.';
