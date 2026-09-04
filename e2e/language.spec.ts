import { expect, test } from '@playwright/test';

const langOf = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.lang);

test('English is the default and the toggle switches to Hindi', async ({ page }) => {
  await page.goto('/');
  expect(await langOf(page)).toBe('en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Nobody does it');

  await page.getByRole('button', { name: /Change language/i }).click();

  // The whole server-rendered tree re-renders, not just the label.
  await expect(page.getByRole('heading', { level: 1 })).toContainText('अकेले कोई', { timeout: 10_000 });
  expect(await langOf(page)).toBe('hi');
  // The desktop nav is hidden on small screens, so assert on the hero's host
  // CTA, which is present at every width (the search bar took over the
  // "primary" slot, so this is the one link left in the hero itself).
  await expect(page.getByRole('link', { name: /अपना मीटअप बनाएँ/ })).toBeVisible();
});

test('the choice survives a reload and can be switched back', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Change language/i }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('अकेले कोई', { timeout: 10_000 });

  await page.reload();
  expect(await langOf(page)).toBe('hi');

  await page.getByRole('button', { name: /भाषा बदलें/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Nobody does it', { timeout: 10_000 });
  expect(await langOf(page)).toBe('en');
});

test('an unknown locale cookie falls back to English rather than breaking', async ({ page, context }) => {
  await context.addCookies([{ name: 'campusclub-locale', value: 'zz', url: 'http://127.0.0.1:3000' }]);
  await page.goto('/');
  expect(await langOf(page)).toBe('en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Nobody does it');
});

test('the drawer carries the language control too', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();

  const inDrawer = page.getByRole('button', { name: /Change language/i }).last();
  await expect(inDrawer).toContainText('English');
  await inDrawer.click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('अकेले कोई', { timeout: 10_000 });
});
