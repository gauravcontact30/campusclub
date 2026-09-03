import { expect, test } from '@playwright/test';
import { signUpFresh } from './helpers';

test('a member can put a meetup on the board and it appears with their fee', async ({ page }) => {
  await signUpFresh(page, 'Pune');
  await page.goto('/host');

  const title = `E2E study table ${Date.now().toString(36)}`;
  await page.getByRole('button', { name: 'Group study' }).click();
  await page.getByLabel('Title').fill(title);
  await page
    .getByLabel('What actually happens')
    .fill(
      'Three silent blocks with a break between each, then a final hour where anyone can put a doubt on the board and the room answers it together.',
    );
  await page.getByLabel('Neighbourhood').fill('Kothrud');
  await page.getByLabel('Venue').fill('Kothrud study centre');
  await page.getByLabel('Street address').fill('Paud Road');
  await page.getByRole('button', { name: '₹149' }).click();

  await page.getByRole('button', { name: 'Publish this meetup' }).click();

  await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible({ timeout: 15_000 });
  // Exact, because the card in the 'more like this' rail carries '₹149to join'.
  await expect(page.getByText('₹149', { exact: true })).toBeVisible();
  // The host does not get a join button on their own meetup.
  await expect(page.getByText('You are hosting this one.')).toBeVisible();

  await page.goto('/my-meetups');
  await expect(page.getByRole('heading', { name: 'You are hosting' })).toBeVisible();
  await expect(page.getByRole('link', { name: title })).toBeVisible();
});

test('the form refuses a meetup that says nothing', async ({ page }) => {
  await signUpFresh(page);
  await page.goto('/host');

  await page.getByLabel('Title').fill('Too short');
  await page.getByLabel('What actually happens').fill('Not enough.');
  await page.getByLabel('Neighbourhood').fill('X');
  await page.getByLabel('Venue').fill('Y');
  await page.getByLabel('Street address').fill('Somewhere');
  await page.getByRole('button', { name: 'Publish this meetup' }).click();

  await expect(page.getByText(/at least 60 characters/)).toBeVisible();
});
