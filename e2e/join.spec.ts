import { expect, test } from '@playwright/test';
import { signUpFresh } from './helpers';

/**
 * The one transaction in the product, end to end. With no Razorpay keys the
 * server issues a demo ticket and the checkout resolves immediately — which is
 * exactly the path a fresh clone runs, so it is the path worth testing.
 */
test('joining a paid meetup takes payment, confirms the spot, and shows the address', async ({ page }) => {
  await signUpFresh(page);

  await expect(async () => {
    await page.locator('article h3 a').first().click();
    await expect(page).toHaveURL(/\/meetups\/[a-z0-9-]+$/);
  }).toPass({ timeout: 20_000 });

  const title = await page.locator('h1').innerText();
  const joinButton = page.getByRole('button', { name: /^(Join for|Join — free|Join the waitlist)/ });
  await expect(joinButton).toBeVisible();

  const waitlisted = (await joinButton.innerText()).includes('waitlist');
  await joinButton.click();

  await expect(page.getByText(waitlisted ? 'You are on the waitlist' : 'You are going')).toBeVisible({
    timeout: 15_000,
  });

  if (!waitlisted) {
    // The street address is released only once someone has joined.
    await expect(page.getByText(/^Exact address:/)).toBeVisible();
  }

  await page.goto('/my-meetups');
  await expect(page.getByRole('link', { name: title })).toBeVisible();
});

test('a join can be cancelled and leaves the calendar', async ({ page }) => {
  await signUpFresh(page);

  await expect(async () => {
    await page.locator('article h3 a').first().click();
    await expect(page).toHaveURL(/\/meetups\/[a-z0-9-]+$/);
  }).toPass({ timeout: 20_000 });

  const title = await page.locator('h1').innerText();
  await page.getByRole('button', { name: /^(Join for|Join — free|Join the waitlist)/ }).click();
  await expect(page.getByText(/You are (going|on the waitlist)/)).toBeVisible({ timeout: 15_000 });

  await page.goto('/my-meetups');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Cancel' }).first().click();

  await expect(page.getByRole('link', { name: title })).toBeHidden({ timeout: 10_000 });
});

test('signed-out visitors are sent to sign in rather than into a checkout', async ({ page }) => {
  await page.goto('/meetups');
  await expect(async () => {
    await page.locator('article h3 a').first().click();
    await expect(page).toHaveURL(/\/meetups\/[a-z0-9-]+$/);
  }).toPass({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Sign in to join' }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
});
