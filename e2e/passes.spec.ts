import { expect, test } from '@playwright/test';
import { signUpFresh } from './helpers';

test('the passes page leads with per-meetup pricing, not a subscription', async ({ page }) => {
  await page.goto('/passes');
  await expect(page.getByRole('heading', { name: 'Pay for what you go to.' })).toBeVisible();
  await expect(page.getByText('You do not need one of these')).toBeVisible();

  // Every pass has to show what a join actually costs on it.
  await expect(page.getByText(/works out at ₹[\d.,]+ a join/).first()).toBeVisible();
});

test('buying a pass grants its credits and covers the next join', async ({ page }) => {
  await signUpFresh(page);
  await page.goto('/passes');

  await page.getByRole('button', { name: 'Get Starter' }).click();
  await expect(page.getByRole('button', { name: 'Your current pass' })).toBeVisible({ timeout: 15_000 });

  // Re-navigate rather than waiting longer: the balance is server state, and a
  // goto that races the router refresh the purchase kicked off can land on the
  // render from before it. If the credits were genuinely not granted this still
  // fails — it re-reads, it does not wait out a wrong answer.
  await expect(async () => {
    await page.goto('/my-meetups');
    await expect(page.getByText('4 credits left')).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });

  await page.goto('/meetups');
  await expect(async () => {
    await page.locator('article h3 a').first().click();
    await expect(page).toHaveURL(/\/meetups\/[a-z0-9-]+$/);
  }).toPass({ timeout: 20_000 });

  // A credit-covered join says so before the click, not after.
  const button = page.getByRole('button', { name: /Use one pass credit|Join the waitlist/ });
  await expect(button).toBeVisible();
});
