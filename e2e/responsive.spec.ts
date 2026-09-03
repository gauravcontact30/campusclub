import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('the open drawer actually covers the page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();

  // The header sets backdrop-blur, which makes it the containing block for any
  // fixed descendant. Rendered inside it, the panel collapsed to the header's
  // height and the page showed through, so assert it really fills the viewport.
  const box = await page.locator('body > div.fixed.inset-x-0').boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.height).toBeGreaterThan(viewport.height - 100);
});

test('the mobile drawer opens, navigates and closes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Find a meetup' })).toBeHidden();

  await page.getByRole('button', { name: 'Open menu' }).click();
  // Scoped to the drawer: the hero's "Find a meetup near you" CTA also matches
  // the name, and it sits earlier in the DOM behind the open panel.
  await page.locator('body > div.fixed').getByRole('link', { name: 'Find a meetup' }).click();

  await expect(page).toHaveURL(/\/meetups/);
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
});

test('the board filters collapse behind a button on small screens', async ({ page }) => {
  await page.goto('/meetups');
  await expect(page.getByRole('button', { name: 'Show results' })).toBeHidden();

  await page.getByRole('button', { name: /^Filters/ }).click();
  await expect(page.getByRole('button', { name: 'Show results' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Join fee up to' })).toBeVisible();
});

test('no horizontal overflow on the key pages', async ({ page }) => {
  for (const path of ['/', '/meetups', '/passes', '/how-it-works', '/about']) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(1);
  }
});
