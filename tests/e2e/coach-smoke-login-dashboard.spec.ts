import { test, expect } from '@playwright/test';
import { loginAsPersona } from './helpers/auth';

test.describe('Coach — Smoke test login + tableau de bord', () => {
  test.describe.configure({ mode: 'serial' });

  test('Étape 1+2 — Login et arrivée sur le tableau de bord', async ({ page }, testInfo) => {
    await loginAsPersona(page, 'coach');

    await expect(page).not.toHaveURL(/login|sign-in/i, { timeout: 15_000 });

    await expect(page.locator('body')).toBeVisible();

    await page.screenshot({
      path: `tests/e2e/reports/screenshots/${testInfo.title}-dashboard.png`,
      fullPage: true,
    });
  });

  test('Étape 3 — Navigation principale visible', async ({ page }, testInfo) => {
    await loginAsPersona(page, 'coach');

    await expect(page).not.toHaveURL(/login|sign-in/i, { timeout: 15_000 });

    const nav = page.getByRole('navigation');
    const hasNav = await nav.count() > 0;

    if (hasNav) {
      await expect(nav.first()).toBeVisible();
    } else {
      // Fallback : au moins un lien de nav identifiable dans header ou sidebar
      const navFallback = page.locator('header a, aside a, [data-testid*="nav"]').first();
      await expect(navFallback).toBeVisible({ timeout: 10_000 });
    }

    await page.screenshot({
      path: `tests/e2e/reports/screenshots/${testInfo.title}-nav.png`,
      fullPage: true,
    });
  });
});
