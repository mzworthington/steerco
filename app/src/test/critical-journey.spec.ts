import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Slice 1 critical journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.textContent =
        '*, *::before, *::after { animation: none !important; transition: none !important; }';
      document.documentElement.appendChild(style);
    });
  });

  test('sample workspace: steer → decide → export', async ({ page }) => {
    await page.goto('/workspace?preview=1');
    await expect(page.getByTestId('workspace-home')).toBeVisible();

    await page.getByRole('button', { name: /start from sample/i }).click();
    await expect(page.getByTestId('steering-overview')).toBeVisible();
    await expect(page.getByText(/recommended to stop/i)).toBeVisible();

    await page.getByRole('link', { name: /outcomes/i }).click();
    await expect(page.getByTestId('outcomes-page')).toBeVisible();

    await page.getByRole('link', { name: /^evidence$/i }).click();
    await expect(page.getByTestId('evidence-page')).toBeVisible();
    await expect(page.getByTestId('evidence-sample-banner')).toBeVisible();

    await page.getByRole('link', { name: /how work is organised/i }).click();
    await expect(page.getByTestId('organisation-page')).toBeVisible();

    await page.getByRole('link', { name: /decision notes/i }).click();
    await expect(page.getByTestId('decision-notes-page')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^title$/i })).toHaveValue(/loyalty ledger/i);

    await page.getByRole('link', { name: /^export$/i }).click();
    await expect(page.getByTestId('export-board-pack-page')).toBeVisible();
    await expect(page.getByTestId('export-section-decisions')).toBeVisible();
    await expect(page.getByText(/^Invest$/).first()).toBeVisible();
  });

  test('executive routes are axe-clean', async ({ page }) => {
    await page.goto('/workspace?preview=1');
    await page.getByRole('button', { name: /start from sample/i }).click();
    await expect(page.getByTestId('steering-overview')).toBeVisible();

    const routes = [
      '/workspace/steering',
      '/workspace/outcomes',
      '/workspace/evidence',
      '/workspace/organisation',
      '/workspace/decisions',
      '/workspace/export',
      '/workspace/diff',
    ];

    for (const route of routes) {
      await page.goto(`${route}?preview=1`);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations, `axe violations on ${route}`).toEqual([]);
    }
  });

  test('mobile workspace uses a drawer for section navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/workspace?preview=1');
    await expect(page.getByTestId('workspace-mobile-bar')).toBeVisible();
    await expect(page.getByTestId('workspace-home')).toBeVisible();

    await page.getByRole('button', { name: /start from sample/i }).click();
    await expect(page.getByTestId('steering-overview')).toBeVisible();

    await page.getByTestId('nav-drawer-toggle').click();
    await expect(page.getByTestId('nav-drawer-backdrop')).toBeVisible();
    await page.getByRole('link', { name: /^outcomes$/i }).click();
    await expect(page.getByTestId('outcomes-page')).toBeVisible();
    await expect(page.getByTestId('nav-drawer-backdrop')).toHaveCount(0);
  });
});
