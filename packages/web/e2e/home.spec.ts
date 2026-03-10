import { expect, test } from '@playwright/test';

test('homepage renders starter messaging', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Ship Hive dApps/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open Docs/i })).toBeVisible();
  await expect(page.getByText(/Typed contracts/i)).toBeVisible();
});
