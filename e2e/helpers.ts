import type { Page } from '@playwright/test';

/**
 * Signs up a brand-new account. The demo backend is one in-process store shared
 * by every worker, so specs that mutate state (joining, cancelling, hosting)
 * must not share a member — a fresh email per run is what keeps them isolated.
 */
export async function signUpFresh(page: Page, city = 'Bengaluru') {
  const email = `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}@example.com`;

  await page.goto('/signup');
  await page.getByLabel('Your name').fill('E2E Tester');
  await page.getByLabel('Your city').selectOption(city);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();

  // Signup lands on the interests step; skipping is a supported path.
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.waitForURL('**/meetups');

  return email;
}
