import { expect, test } from '@playwright/test';

test.describe('directory', () => {
  test('home page leads into the directory', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Meet five strangers');

    await page.getByRole('link', { name: /Explore \d+ places/ }).click();
    await expect(page).toHaveURL(/\/businesses/);
    await expect(page.getByRole('heading', { name: 'The directory' })).toBeVisible();
  });

  test('search narrows results and stays shareable in the URL', async ({ page }) => {
    await page.goto('/businesses');
    const cards = page.locator('article');
    const initial = await cards.count();

    await page.getByLabel('Search the directory').fill('coffee');
    await expect(page).toHaveURL(/term=coffee/);
    await expect.poll(async () => cards.count()).toBeLessThan(initial);
    await expect(cards.first()).toContainText(/coffee|café|espresso|roaster/i);
  });

  test('category and price filters apply together', async ({ page }) => {
    await page.goto('/businesses');

    // Below the lg breakpoint the panel is collapsed behind a Filters button.
    const isNarrow = (page.viewportSize()?.width ?? 1280) < 1024;
    if (isNarrow) await page.getByRole('button', { name: 'Filters' }).click();

    await page.getByRole('button', { name: 'Coffee & Cafés' }).click();
    await expect(page).toHaveURL(/category=cafes/);

    await page.getByRole('button', { name: '₹₹', exact: true }).click();
    await expect(page).toHaveURL(/price=2/);
    await expect(page.locator('article').first()).toBeVisible();
  });

  test('an empty result set explains itself and can be cleared', async ({ page }) => {
    await page.goto('/businesses');
    await page.getByLabel('Search the directory').fill('zzzzqqqq');
    await expect(page.getByText('Nothing matches that yet')).toBeVisible();

    await page.getByRole('button', { name: 'Clear all filters' }).click();
    await expect(page.locator('article').first()).toBeVisible();
  });

  test('a listing page shows hours, contact and reviews', async ({ page }) => {
    await page.goto('/businesses');
    await page.locator('article a').first().click();

    await expect(page.getByRole('heading', { name: 'Opening hours' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get directions' })).toBeVisible();
  });
});
