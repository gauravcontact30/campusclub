import { expect, test } from '@playwright/test';

const themeOf = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.dataset.theme);

// The starting theme follows the OS, so every test pins it rather than relying
// on whatever the runner happens to emulate.

test('the toggle switches themes and the choice sticks across a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();

  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  expect(await themeOf(page)).toBe('light');

  // The button now offers the opposite trip, which is how a toggle should read.
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();

  await page.reload();
  expect(await themeOf(page)).toBe('light');
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
});

test('a stored choice beats the system preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  expect(await themeOf(page)).toBe('light');

  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.reload();
  expect(await themeOf(page), 'an explicit choice must survive an opposing OS setting').toBe('dark');
});

test('the theme is settled before first paint, not after it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  // Freezing on the very first response would still let the inline script run,
  // so read the attribute at DOMContentLoaded: if the theme were applied by
  // React instead, it would still be unset at this point.
  await page.goto('/', { waitUntil: 'commit' });
  const early = await page.evaluate(() => {
    if (document.readyState === 'loading') {
      return new Promise<string | undefined>((resolve) =>
        document.addEventListener('DOMContentLoaded', () => resolve(document.documentElement.dataset.theme), {
          once: true,
        }),
      );
    }
    return document.documentElement.dataset.theme;
  });
  expect(early).toBe('light');
});

test('body colours actually change with the theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  expect(light).not.toBe(dark);
});
