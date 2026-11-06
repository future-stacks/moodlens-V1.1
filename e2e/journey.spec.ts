import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function skipOnboarding(page: Page) {
  await page.addInitScript(() => localStorage.setItem('moodlens_onboarding_seen', 'true'));
}

test('first visit: onboarding explains the AI data flow and can be completed', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Welcome to MoodLens');
  for (let i = 0; i < 3; i++) await dialog.getByRole('button', { name: 'Next' }).click();
  await expect(dialog).toContainText("Google's Gemini AI service");
  await dialog.getByRole('button', { name: 'Get started' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /What are you feeling right now/ })).toBeVisible();
});

test('core journey: check in, read the thought, take a smaller step, reflect, see it in history', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/');

  await page.getByRole('button', { name: /Overwhelmed/ }).click();
  await page.getByRole('button', { name: /Add a little context/ }).click();
  await page.getByText('Too much', { exact: true }).click();
  await page.getByRole('button', { name: /Find my next step/ }).click();

  await expect(page.getByRole('heading', { name: /competing for your attention/ })).toBeVisible();
  await expect(page.getByText('A MoodLens reflection')).toBeVisible();
  await expect(page.locator('blockquote')).not.toBeEmpty();
  await expect(page.getByText('Your next step')).toBeVisible();

  await page.getByRole('button', { name: /Show me something smaller/ }).click();
  await expect(page.getByText('A smaller step')).toBeVisible();
  await page.getByRole('button', { name: /I did it/ }).click();

  await page.getByText('Yes', { exact: true }).click();
  await page.getByText('A bit better').click();
  await page.getByRole('button', { name: 'Save and finish' }).click();
  await expect(page.getByText('You checked in once this week.')).toBeVisible();

  await page.getByRole('button', { name: 'History' }).click();
  const history = page.getByRole('dialog', { name: 'Your check-ins' });
  await expect(history).toContainText('Overwhelmed');
  await expect(history).toContainText('Helped');
  await page.keyboard.press('Escape');
  await expect(history).toHaveCount(0);

  // Persists across reloads
  await page.reload();
  await expect(page.getByText('You checked in once this week.')).toBeVisible();
});

test('a high-risk disclosure gets human support, not a quote and action, and is never sent', async ({ page }) => {
  await skipOnboarding(page);
  const apiCalls: string[] = [];
  page.on('request', (r) => r.url().includes('/api/intervention') && apiCalls.push(r.url()));
  await page.goto('/');

  await page.getByLabel(/own words/).fill("I don't want to be alive anymore");
  await page.getByRole('button', { name: /Find my next step/ }).click();

  await expect(page.getByRole('heading', { name: /really hard right now/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Call 999/ })).toHaveAttribute('href', 'tel:999');
  await expect(page.getByText('Samaritans')).toBeVisible();
  await expect(page.getByText('Your next step')).toHaveCount(0);
  expect(apiCalls).toHaveLength(0);
});

test('the server also blocks high-risk text if a client skips the check', async ({ request }) => {
  const res = await request.post('/api/intervention', { data: { mood: 'sad', note: 'I want to kill myself' } });
  expect(await res.json()).toEqual({ kind: 'support', category: 'self_harm' });
});

test('V1.1 data is migrated and plaintext passwords are removed', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('moodlens_onboarding_seen', 'true');
    localStorage.setItem('moodlens_users', JSON.stringify({ alice: 'hunter2' }));
    localStorage.setItem('moodlens_history', JSON.stringify([{ id: 'v1', mood: 'stuck', action: 'Take 3 deep breaths.', timestamp: new Date().toISOString() }]));
  });
  await page.goto('/');
  await expect(page.getByText('You checked in once this week.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('moodlens_users'))).toBeNull();
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByRole('dialog')).toContainText('Take 3 deep breaths.');
});

test.describe('accessibility (axe, WCAG 2.1 AA)', () => {
  // Elements fade in, and axe would measure contrast mid-animation. Wait until they settle.
  const scan = async (page: Page) => {
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
    await page.waitForTimeout(800); // JS-driven (non-WAAPI) motion values
    return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  };

  test('check-in screen', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/');
    await page.getByRole('button', { name: /Add a little context/ }).click();
    expect((await scan(page)).violations).toEqual([]);
  });

  test('intervention screen', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/');
    await page.getByRole('button', { name: /Sad/ }).click();
    await page.getByRole('button', { name: /Find my next step/ }).click();
    await expect(page.getByText('Your next step')).toBeVisible();
    expect((await scan(page)).violations).toEqual([]);
  });

  test('settings dialog', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect((await scan(page)).violations).toEqual([]);
  });
});
