import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('the mobile drawer opens, navigates and closes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Dinners' })).toBeHidden();

  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: 'Dinners' }).first().click();

  await expect(page).toHaveURL(/\/dinners/);
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
});

test('the directory filters collapse behind a button on small screens', async ({ page }) => {
  await page.goto('/businesses');
  await expect(page.getByRole('heading', { name: 'Filters' })).toBeHidden();

  await page.getByRole('button', { name: 'Filters' }).click();
  await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible();
});

test('no horizontal overflow on the key pages', async ({ page }) => {
  for (const path of ['/', '/businesses', '/dinners', '/pricing', '/how-it-works']) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(1);
  }
});
