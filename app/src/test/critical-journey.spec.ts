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

    await page.getByRole('link', { name: /goals/i }).click();
    await expect(page.getByTestId('goals-page')).toBeVisible();

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
      '/workspace/lvt',
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
    await page.getByRole('link', { name: /^goals$/i }).click();
    await expect(page.getByTestId('goals-page')).toBeVisible();
    await expect(page.getByTestId('nav-drawer-backdrop')).toHaveCount(0);
  });

  test('goals page can add goal, bet, and initiative via modals', async ({ page }) => {
    await page.goto('/workspace?preview=1');
    await page.getByRole('button', { name: /start from sample/i }).click();
    await expect(page.getByTestId('steering-overview')).toBeVisible();

    await page.getByRole('link', { name: /^goals$/i }).click();
    await expect(page.getByTestId('goals-page')).toBeVisible();

    await page.locator('.goals-header [data-testid="lvt-add-goal-open"]').click();
    await expect(page.getByTestId('lvt-add-goal-modal')).toBeVisible();
    await page.getByTestId('lvt-add-goal-title').fill('Safer checkouts');
    await page.getByTestId('lvt-add-goal-summary').fill('Fewer payment fails at till.');
    await page.getByTestId('lvt-add-goal-submit').click();
    await expect(page.getByTestId('lvt-add-goal-modal')).toHaveCount(0);
    await expect(page.getByTestId('goals-goal-detail')).toBeVisible();
    await expect(page.getByRole('heading', { name: /safer checkouts/i })).toBeVisible();

    await page.getByTestId('lvt-add-bet-open').click();
    await expect(page.getByTestId('lvt-add-bet-modal')).toBeVisible();
    await page.getByTestId('lvt-add-bet-title').fill('Checkout retry cue');
    await page.getByTestId('lvt-add-bet-success').fill('Retry prompt lifts completion');
    await page.getByTestId('lvt-add-bet-kill').fill('No lift after one sprint');
    await page.getByTestId('lvt-add-bet-submit').click();
    await expect(page.getByTestId('lvt-add-bet-modal')).toHaveCount(0);
    await expect(page.getByTestId('goals-bet-detail')).toBeVisible();
    await expect(page.getByRole('heading', { name: /checkout retry cue/i })).toBeVisible();

    await page.getByTestId('lvt-add-initiative-open').click();
    await expect(page.getByTestId('lvt-add-initiative-modal')).toBeVisible();
    await page.getByTestId('lvt-add-initiative-title').fill('Pilot flagship till');
    await page.getByTestId('lvt-add-initiative-success').fill('One store completes retry path');
    await page.getByTestId('lvt-add-initiative-submit').click();
    await expect(page.getByTestId('lvt-add-initiative-modal')).toHaveCount(0);
    await expect(page.getByTestId('goals-initiative-detail')).toBeVisible();
    await expect(page.getByRole('heading', { name: /pilot flagship till/i })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations, 'axe violations after LVT add flow').toEqual([]);
  });

  test('organisation add-team dialog and timeline stay on the page', async ({ page }) => {
    await page.goto('/workspace?preview=1');
    await page.getByRole('button', { name: /start from sample/i }).click();
    await expect(page.getByTestId('steering-overview')).toBeVisible();

    await page.getByRole('link', { name: /how work is organised/i }).click();
    await expect(page.getByTestId('organisation-page')).toBeVisible();
    await expect(page.getByTestId('organisation-as-of')).toBeVisible();
    await expect(page.getByTestId('organisation-planned-change')).toBeVisible();

    await page.getByTestId('organisation-add-team-cta').click();
    const dialog = page.getByRole('dialog', { name: 'Add a team' });
    await expect(dialog).toBeVisible();
    const addTeamAxe = await new AxeBuilder({ page })
      .include('[data-testid="organisation-team-modal"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(addTeamAxe.violations, 'axe violations on add-team dialog').toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    await page.getByRole('tab', { name: /^timeline$/i }).click();
    await expect(page.getByTestId('organisation-timeline')).toBeVisible();
    await expect(page.getByTestId('organisation-timeline-capacity')).toBeVisible();
    await expect(page.getByTestId('organisation-timeline-bands')).toBeVisible();
    await expect(page.getByTestId('organisation-timeline-events')).toBeVisible();
    await expect(page.getByTestId('organisation-as-of')).toBeVisible();
  });
});
