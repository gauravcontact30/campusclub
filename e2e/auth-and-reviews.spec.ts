import { expect, test, type Page } from '@playwright/test';

/**
 * Each project gets its own seeded account so the desktop and mobile runs never
 * fight over the same saves, reviews and bookings.
 */
const ACCOUNTS: Record<string, { email: string; firstName: string }> = {
  desktop: { email: 'priya@example.com', firstName: 'Priya' },
  mobile: { email: 'sofia@example.com', firstName: 'Sofia' },
};

const PASSWORD = 'password123';

function account(projectName: string) {
  return ACCOUNTS[projectName] ?? ACCOUNTS.desktop;
}

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');
}

test('a visitor can sign in and out', async ({ page }, testInfo) => {
  const { email, firstName } = account(testInfo.project.name);
  await signIn(page, email);

  const accountButton = page.getByRole('button', { name: new RegExp(firstName) });
  await expect(accountButton).toBeVisible();

  await accountButton.click();
  await page.getByRole('button', { name: 'Sign out' }).click();

  // The signed-out header shows the sign-in link on desktop and the menu on mobile.
  await expect(accountButton).toBeHidden();
});

test('bad credentials are rejected', async ({ page }, testInfo) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(account(testInfo.project.name).email);
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByText('did not match')).toBeVisible();
});

test('a signed-in member can save a place and find it again', async ({ page }, testInfo) => {
  await signIn(page, account(testInfo.project.name).email);
  await page.goto('/businesses');

  const card = page.locator('article').first();
  const bookmark = card.getByRole('button', { name: /Save this place|Remove from saved/ });

  // Start from a known state, then save.
  if ((await bookmark.getAttribute('aria-pressed')) === 'true') {
    await bookmark.click();
    await expect(page.getByText('Removed from your list.')).toBeVisible();
  }

  await bookmark.click();
  await expect(page.getByText('Saved to your list.')).toBeVisible();
  await expect(bookmark).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/saved');
  await expect(page.locator('article').first()).toBeVisible();
});

test('a signed-in member can post a review that appears on the page', async ({ page }, testInfo) => {
  await signIn(page, account(testInfo.project.name).email);
  await page.goto('/businesses/nandini-dosa-camp-bengaluru');

  // Seeded members may already have a review here, in which case the form edits it.
  const submit = page.getByRole('button', { name: /Post review|Update review/ });

  await page.getByLabel('Rate 5 out of 5').click();
  await page.getByLabel('Headline').fill('Playwright says the dosa holds up');
  await page
    .getByLabel('Your review')
    .fill('An end-to-end test wrote this review, and it is comfortably longer than the forty character minimum.');
  await submit.click();

  await expect(page.getByText('Your review is live', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Playwright says the dosa holds up' }).first()).toBeVisible();
});

test('review validation blocks a too-short review', async ({ page }, testInfo) => {
  await signIn(page, account(testInfo.project.name).email);
  await page.goto('/businesses/copper-rye-bengaluru/review');

  await page.getByLabel('Rate 4 out of 5').click();
  await page.getByLabel('Headline').fill('Too short');
  await page.getByLabel('Your review').fill('Nope.');
  await page.getByRole('button', { name: /review/ }).last().click();

  await expect(page.getByText('at least 40 characters', { exact: false })).toBeVisible();
});
