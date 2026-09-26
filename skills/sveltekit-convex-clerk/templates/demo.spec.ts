import { expect, test } from '@playwright/test';

test('homepage has title and sign-in button', async ({ page }) => {
  await page.goto('/');

  // Expect brand or welcome heading to be visible
  await expect(page.locator('header')).toContainText('SvelteKit + Convex');

  // Expect sign-in button to be present for unauthenticated state
  const signInBtn = page.getByRole('button', { name: /sign in/i });
  await expect(signInBtn).toBeVisible();
});
