import { expect, test } from '@playwright/test';

test('the assistant answers from the real board and links into the app', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ask the VibeClub assistant/i }).click();

  const panel = page.getByRole('dialog', { name: 'Ask VibeClub' });
  await expect(panel).toBeVisible();

  await page.getByRole('button', { name: 'Study meetups in Bengaluru this week' }).click();

  // The answer has to link to a real seeded meetup, not a plausible-sounding one.
  const link = panel.getByRole('link', { name: /^\/meetups\/[a-z0-9-]+$/ }).first();
  await expect(link).toBeVisible({ timeout: 15_000 });

  const href = await link.getAttribute('href');
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  // Following a link closes the panel — otherwise it covers the page it opened.
  await expect(panel).toBeHidden();
});

test('a typed question about money streams an answer back', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ask the VibeClub assistant/i }).click();

  await page.getByLabel('Your question').fill('How much does it cost to join a meetup?');
  await page.getByRole('button', { name: 'Send' }).click();

  const panel = page.getByRole('dialog', { name: 'Ask VibeClub' });
  await expect(panel.getByText(/join fee/i).first()).toBeVisible({ timeout: 15_000 });
});

test('the transcript can be cleared and the panel closed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ask the VibeClub assistant/i }).click();
  await page.getByRole('button', { name: 'How do the passes work?' }).click();

  const panel = page.getByRole('dialog', { name: 'Ask VibeClub' });
  await expect(panel.getByText(/Starter/).first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Start a new conversation' }).click();
  await expect(panel.getByText(/Starter/)).toBeHidden();
  await expect(page.getByRole('button', { name: 'How do the passes work?' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('the endpoint refuses a malformed body', async ({ request }) => {
  const empty = await request.post('/api/chat', { data: { messages: [] } });
  expect(empty.status()).toBe(400);

  const oversize = await request.post('/api/chat', {
    data: { messages: [{ role: 'user', content: 'a'.repeat(5_000) }] },
  });
  expect(oversize.status()).toBe(400);
});
