import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const outDir = path.join(process.cwd(), '../docs/screenshots');

test.describe('docs media', () => {
  test.skip(!process.env.RECORD_DOCS_MEDIA, 'Set RECORD_DOCS_MEDIA=1 to record');

  test.beforeAll(() => {
    mkdirSync(outDir, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    // Keep screenshots stable: hero uses fade-up that starts at opacity 0.
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.textContent =
        '*, *::before, *::after { animation: none !important; transition: none !important; }';
      document.documentElement.appendChild(style);
    });
  });

  test('home page screenshot', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home')).toBeVisible();
    await expect(page.getByRole('heading', { name: /react cloudflare template/i })).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'home.png'),
      fullPage: true,
    });
  });

  test('docs overview screenshot', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByTestId('docs')).toBeVisible();
    await expect(page.getByRole('heading', { name: /what's included/i })).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'docs-overview.png'),
      fullPage: true,
    });
  });

  test('docs workflows screenshot', async ({ page }) => {
    await page.goto('/docs/workflows');
    await expect(page.getByTestId('docs')).toBeVisible();
    await expect(page.getByRole('heading', { name: /workflows/i })).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'docs-workflows.png'),
      fullPage: true,
    });
  });
});
