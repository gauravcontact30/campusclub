import { expect, test, type Page } from '@playwright/test';

/**
 * Claiming is a one-way door in the demo store, so each project claims a
 * different unclaimed listing and signs in as a different member.
 */
const FIXTURES: Record<string, { email: string; slug: string; name: string }> = {
  desktop: {
    email: 'rohan@example.com',
    slug: 'nandini-dosa-camp-bengaluru',
    name: 'Nandini Dosa Camp',
  },
  mobile: {
    email: 'mei@example.com',
    slug: 'bowery-espresso-bar-new-york',
    name: 'Bowery Espresso Bar',
  },
};

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');
}

test('an owner can claim a listing and reply to a review', async ({ page }, testInfo) => {
  const fixture = FIXTURES[testInfo.project.name] ?? FIXTURES.desktop;
  await signIn(page, fixture.email);
  await page.goto(`/businesses/${fixture.slug}`);

  const alreadyMine = page.getByText('You manage this listing.');
  if (!(await alreadyMine.count())) {
    await page.getByRole('link', { name: new RegExp(`Claim ${fixture.name}`) }).click();
    await expect(page).toHaveURL(new RegExp(`/businesses/${fixture.slug}/claim`));

    await page.getByLabel('Your role').selectOption('Owner');
    await page.getByLabel('Work email').fill('owner@example.com');
    await page.getByLabel('Phone').fill('+91 80 4123 8890');
    await page.getByRole('button', { name: 'Claim this listing' }).click();

    await expect(page).toHaveURL(new RegExp(`/businesses/${fixture.slug}\\?claimed=1`));
    await expect(page.getByText(`Claimed — ${fixture.name} is yours to manage.`)).toBeVisible();
  }

  // Owner tools now appear on every review.
  const respond = page.getByRole('button', { name: 'Respond as the owner' }).first();
  await respond.click();

  const reply = 'Thanks for taking the time to write this — the second griddle arrives on Monday.';
  await page.getByLabel('Your public reply').first().fill(reply);
  await page.getByRole('button', { name: /Publish reply|Update reply/ }).first().click();

  await expect(page.getByText('Your reply is public.')).toBeVisible();
  await expect(page.getByText(`Response from ${fixture.name}`).first()).toBeVisible();
  await expect(page.getByText(reply).first()).toBeVisible();
});

test('visitors see owner replies but get no compose box', async ({ page }) => {
  // Copper & Rye ships claimed, with a seeded owner response on its critical review.
  await page.goto('/businesses/copper-rye-bengaluru');

  await expect(page.getByText('Response from Copper & Rye').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Respond as the owner' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Claim Copper & Rye/ })).toHaveCount(0);
});

test('a listing that is already claimed cannot be claimed again', async ({ page }, testInfo) => {
  await signIn(page, FIXTURES[testInfo.project.name]?.email ?? FIXTURES.desktop.email);

  await page.goto('/businesses/copper-rye-bengaluru/claim');
  // The claim page bounces straight back to the listing.
  await expect(page).toHaveURL('/businesses/copper-rye-bengaluru');
});
