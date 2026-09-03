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

test('the drawer carries its own toggle, labelled', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();

  // Two toggles are on the page once the drawer is open — the header's and the
  // drawer's — so target the one inside the drawer by its visible text.
  const inDrawer = page.getByRole('button', { name: 'Switch to light theme' }).last();
  await expect(inDrawer).toContainText('Switch to light theme');

  await inDrawer.click();
  expect(await themeOf(page)).toBe('light');
  await expect(page.getByRole('button', { name: 'Switch to dark theme' }).last()).toBeVisible();
});

const paletteOf = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.dataset.palette ?? 'court');

const brandOf = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim());

test('each swatch repaints the site and the choice survives a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  expect(await paletteOf(page)).toBe('court');

  await page.getByRole('button', { name: 'Choose a colour theme' }).click();

  const seen = new Set<string>([await brandOf(page)]);
  for (const name of ['Turf', 'Dusk', 'Tide', 'Ember']) {
    await page.getByRole('menuitemradio', { name: new RegExp(name) }).click();
    const brand = await brandOf(page);
    expect(seen.has(brand), `${name} reused another palette's brand colour`).toBe(false);
    seen.add(brand);
  }

  expect(await paletteOf(page)).toBe('ember');
  await page.reload();
  expect(await paletteOf(page)).toBe('ember');
});

test('a palette keeps its own light values, not the dark ones', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Choose a colour theme' }).click();
  await page.getByRole('menuitemradio', { name: /Dusk/ }).click();
  const dark = await brandOf(page);

  // A palette block and the base light block have equal specificity, so without
  // the theme qualifier the dark values would win in light mode too.
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  const light = await brandOf(page);
  expect(light, 'the dark palette leaked into light mode').not.toBe(dark);

  const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(canvas).toBe('rgb(252, 248, 252)');
});

test('the drawer offers the same swatches', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();

  await page.getByRole('radio', { name: 'Tide' }).click();
  expect(await paletteOf(page)).toBe('tide');
  await expect(page.getByRole('radio', { name: 'Tide' })).toHaveAttribute('aria-checked', 'true');
});
