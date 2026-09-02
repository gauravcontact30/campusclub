import { expect, test } from '@playwright/test';

const ACCOUNTS: Record<string, string> = {
  desktop: 'daniel@example.com',
  mobile: 'mei@example.com',
};

test('dinners can be filtered by city', async ({ page }) => {
  await page.goto('/dinners');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Pick a Wednesday');

  await page.getByRole('button', { name: 'London' }).click();
  await expect(page).toHaveURL(/city=london/);
  await expect(page.locator('article').first()).toContainText('London');
});

test('the matching quiz walks through every question', async ({ page }) => {
  await page.goto('/dinners/quiz');
  await expect(page.getByText('Question 1 of 6')).toBeVisible();

  await page.getByRole('button', { name: /The listener/ }).click();
  await expect(page.getByText('Question 2 of 6')).toBeVisible();

  await page.getByRole('button', { name: /Books, film & music/ }).click();
  await expect(page.getByText('Question 3 of 6')).toBeVisible();
});

test('a member can claim a seat and see it in their bookings', async ({ page }, testInfo) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ACCOUNTS[testInfo.project.name] ?? ACCOUNTS.desktop);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/dinners');
  const seatLink = page.locator('article').first().getByRole('link', { name: /Claim a seat|Join waitlist/ });
  await expect(seatLink).toBeVisible();

  // Same pre-hydration swallow as in directory.spec.ts: retry the click rather
  // than wait longer, because nothing is in flight to wait for.
  await expect(async () => {
    await seatLink.click();
    await expect(page).toHaveURL(/\/dinners\/[\w-]+/, { timeout: 3_000 });
  }).toPass({ timeout: 20_000 });

  const claim = page.getByRole('button', { name: /Claim my seat|Join the waitlist/ });
  const cancel = page.getByRole('button', { name: 'Cancel my seat' });

  // The seat may already be held from an earlier run — either state is fine.
  await expect(claim.or(cancel)).toBeVisible();
  if (await claim.isVisible()) await claim.click();

  await expect(page.getByText(/Seat confirmed|waitlist/i).first()).toBeVisible();

  await page.goto('/bookings');
  await expect(page.getByRole('heading', { name: 'Upcoming dinners' })).toBeVisible();
  await expect(page.locator('main li').first()).toContainText(/Confirmed|Waitlisted/);
});

test('guests are asked to sign in before booking', async ({ page }) => {
  await page.goto('/dinners');
  await page.locator('article').first().getByRole('link', { name: /Claim a seat|Join waitlist/ }).click();
  await expect(page.getByRole('link', { name: 'Sign in to claim a seat' })).toBeVisible();
});
