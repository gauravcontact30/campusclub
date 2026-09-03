import { expect, test } from '@playwright/test';

test('the assistant answers from the real directory and links into the app', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ask the VibeClub assistant/i }).click();

  const panel = page.getByRole('dialog', { name: 'Ask VibeClub' });
  await expect(panel).toBeVisible();

  await page.getByRole('button', { name: 'Best-rated coffee in Bengaluru' }).click();

  // The answer has to name a real seeded listing, not a plausible-sounding one.
  await expect(panel.getByText('Third Wave Filter Room')).toBeVisible({ timeout: 15_000 });

  const link = panel.getByRole('link', { name: '/businesses/third-wave-filter-room-bengaluru' });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/third-wave-filter-room-bengaluru/);
  // Following a link closes the panel — otherwise it covers the page it opened.
  await expect(panel).toBeHidden();
});

test('a typed question streams an answer back', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ask the VibeClub assistant/i }).click();

  await page.getByLabel('Your question').fill('How do the Wednesday dinners work?');
  await page.getByRole('button', { name: 'Send' }).click();

  const panel = page.getByRole('dialog', { name: 'Ask VibeClub' });
  await expect(panel.getByText(/seats left/).first()).toBeVisible({ timeout: 15_000 });
});

test('the transcript can be cleared and the panel closed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ask the VibeClub assistant/i }).click();
  await page.getByRole('button', { name: 'What does membership cost?' }).click();

  const panel = page.getByRole('dialog', { name: 'Ask VibeClub' });
  await expect(panel.getByText('Explorer')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Start a new conversation' }).click();
  await expect(panel.getByText('Explorer')).toBeHidden();
  await expect(page.getByRole('button', { name: 'What does membership cost?' })).toBeVisible();

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
