import { expect, test } from '@playwright/test';

// Indiranagar, Bengaluru — a few hundred metres from the seeded café.
test.use({ geolocation: { latitude: 12.9719, longitude: 77.6412 }, permissions: ['geolocation'] });

test('searching near me sorts by distance and shows how far away things are', async ({ page }) => {
  await page.goto('/businesses');

  const isNarrow = (page.viewportSize()?.width ?? 1280) < 1024;
  if (isNarrow) await page.getByRole('button', { name: 'Filters' }).click();

  await page.getByRole('button', { name: 'Search near me' }).click();

  await expect(page).toHaveURL(/lat=12\.9719/);
  await expect(page).toHaveURL(/sort=distance/);
  await expect(page.getByRole('button', { name: 'Using your location' })).toBeVisible();

  // Nearest first: the Indiranagar café leads, and cards carry a distance chip.
  const first = page.locator('article').first();
  await expect(first).toContainText('Third Wave Filter Room');
  // "Nearby" on the doorstep, otherwise metres or kilometres.
  if (!isNarrow) await expect(first).toContainText(/Nearby|\d+\s?(m|km)/);
});

test('clearing the location drops the distance sort', async ({ page }) => {
  await page.goto('/businesses');

  const isNarrow = (page.viewportSize()?.width ?? 1280) < 1024;
  if (isNarrow) await page.getByRole('button', { name: 'Filters' }).click();

  await page.getByRole('button', { name: 'Search near me' }).click();
  await expect(page).toHaveURL(/sort=distance/);

  await page.getByRole('button', { name: 'Clear location' }).click();
  await expect(page).not.toHaveURL(/lat=/);
  await expect(page.getByRole('button', { name: 'Search near me' })).toBeVisible();
});
