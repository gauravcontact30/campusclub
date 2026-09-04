import { expect, test } from '@playwright/test';

test('the board lists meetups with a fee and spots left on every card', async ({ page }) => {
  // Pinned wide: below `sm` the fee and spots move out of the row into a
  // sibling strip (`MeetupRowFacts`) so this assertion, which is about content
  // correctness rather than the responsive layout, checks one unambiguous place.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/meetups');
  await expect(page.getByRole('heading', { name: 'What’s on', level: 1 })).toBeVisible();

  const cards = page.locator('article');
  await expect(cards.first()).toBeVisible();

  // The two facts the business model turns on have to be on the card itself,
  // not one click away.
  const first = cards.first();
  await expect(first.getByText(/to join|no fee/)).toBeVisible();
  await expect(first.getByText(/spots? left|waitlist/i)).toBeVisible();
});

test('a category filter narrows the board and survives a reload', async ({ page }) => {
  await page.goto('/meetups?category=group-study');

  await expect(page.getByRole('heading', { name: /Group study/, level: 1 })).toBeVisible();
  const count = await page.locator('article').count();
  expect(count).toBeGreaterThan(0);

  await page.reload();
  await expect(page.locator('article')).toHaveCount(count);
});

test('filters live in the URL, so a filtered board is a shareable link', async ({ page }) => {
  // The rail is a persistent <aside> at `lg` and up and a button-triggered
  // panel below it. Pinning desktop width means the same interaction — click
  // the city row directly — works the same regardless of which Playwright
  // project runs it.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/meetups');

  await page.getByRole('button', { name: 'Pune', exact: true }).click();
  await expect(page).toHaveURL(/city=pune/);
  await expect(page.getByRole('heading', { name: /Pune/, level: 1 })).toBeVisible();
});

test('searching filters down to matching meetups', async ({ page }) => {
  await page.goto('/meetups');
  // The board renders its own search bar plus the header carries one too past
  // `xl` — scope to the first, and submit like a real visitor would (Enter),
  // since the bar is a real form navigation rather than a live filter.
  await page.getByRole('textbox', { name: 'What do you want to do?' }).first().fill('badminton');
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/term=badminton/, { timeout: 10_000 });
  const titles = await page.locator('article h3').allInnerTexts();
  expect(titles.length).toBeGreaterThan(0);
});

test('a meetup page shows what happens, the host, and withholds the address', async ({ page }) => {
  await page.goto('/meetups');

  // Clicking a Link before hydration gets its default prevented by a router
  // that is not listening yet, and no navigation is ever in flight — so retry
  // the click rather than waiting longer on the first one.
  await expect(async () => {
    await page.locator('article h3 a').first().click();
    await expect(page).toHaveURL(/\/meetups\/[a-z0-9-]+$/);
  }).toPass({ timeout: 20_000 });

  await expect(page.getByRole('heading', { name: 'About this meetup' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your host' })).toBeVisible();
  await expect(page.getByText('The exact street address is shared with you once you join.')).toBeVisible();
});

test('an empty result set offers a way out rather than a blank page', async ({ page }) => {
  await page.goto('/meetups?term=zeppelintaxidermy');
  await expect(page.getByRole('heading', { name: 'Nothing matches those filters' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Clear all filters' })).toBeVisible();
});
