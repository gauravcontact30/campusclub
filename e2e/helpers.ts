import { expect, test, type Page } from '@playwright/test';

/**
 * Authentication is Supabase Auth and nothing else — there is no local
 * fallback to sign in against. A deployment without a Supabase project can
 * still browse the board, so most of this suite runs, but anything that needs
 * a member has nothing to be a member of.
 *
 * Rather than guess from an env var the test process may not have loaded,
 * this asks the running app: the sign-in page says out loud when accounts are
 * unconfigured, and that banner is the signal.
 */
export async function authConfigured(page: Page): Promise<boolean> {
  await page.goto('/login');
  return !(await page.getByText('Accounts are not configured on this deployment').isVisible());
}

/** Skips the calling test, with a reason, when there is no auth backend. */
export async function skipWithoutAuth(page: Page) {
  const configured = await authConfigured(page);
  test.skip(
    !configured,
    'Needs a Supabase project: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to run this.',
  );
}

/**
 * Signs up a brand-new account.
 *
 * A fresh address per run keeps specs that mutate member state — joining,
 * cancelling, hosting — from treading on each other when workers run in
 * parallel against one database.
 */
export async function signUpFresh(page: Page, city = 'Bengaluru') {
  await skipWithoutAuth(page);

  const email = `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}@example.com`;

  await page.goto('/signup');
  await page.getByLabel('Your name').fill('E2E Tester');
  await page.getByLabel('Your city').selectOption(city);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('e2e-password-123');
  await page.getByRole('button', { name: 'Create account' }).click();

  // With "Confirm email" switched on there is no session to land in, and the
  // form says so instead of redirecting. That is correct behaviour, but a
  // spec that needs a signed-in member cannot continue through it.
  const confirmation = page.getByText(/Check .* for a confirmation link/);
  if (await confirmation.isVisible().catch(() => false)) {
    test.skip(
      true,
      'Supabase has "Confirm email" on, so sign-up issues no session. Turn it off for the test project.',
    );
  }

  // Signup lands on the interests step; skipping is a supported path.
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.waitForURL('**/meetups');

  return email;
}

/**
 * Either language's name for the header's preferences dropdown. Switching to
 * Hindi re-renders the header from the server, so a spec that opens the menu
 * twice would otherwise be hunting for an English label on a Hindi page.
 */
export const PREFERENCES = /Language, theme and colour|भाषा, थीम और रंग/;

/**
 * Opens that dropdown — language, light/dark and the colour palette all live
 * behind it, so most preference specs start here.
 *
 * The click is retried rather than issued once. The trigger is server-rendered
 * and present immediately, but its handler only exists once the header has
 * hydrated; a click landing before that does nothing at all, and Playwright has
 * no reason to try again. Under a parallel run that is a real race, and it
 * fails the test rather than the app.
 */
export async function openPreferences(page: Page) {
  const trigger = page.getByRole('button', { name: PREFERENCES });
  const menu = page.getByRole('menu', { name: PREFERENCES });

  await expect(async () => {
    if (!(await menu.isVisible())) await trigger.click();
    await expect(menu).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 20_000 });

  return menu;
}

export { expect, test };
