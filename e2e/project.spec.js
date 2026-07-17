// e2e/project.spec.js
//
// Covers flow 4: create a project. Client-side project posting
// (src/page/ProjectsPage.js -> PostModal -> POST /api/projects) is the more
// reachable half of "create a project / submit a proposal" from a fresh
// account — a freelancer submitting a proposal requires an existing
// *client-posted* open project to apply to, which a brand-new test run has
// none of yet. Uses the client storageState saved by e2e/global-setup.js
// (see helpers.js — the auth endpoints are rate-limited).

const { test, expect } = require('@playwright/test');
const { STORAGE_STATE } = require('./helpers');

test.use({ storageState: STORAGE_STATE.client });

test('client can post a new project', async ({ page }) => {
  await page.goto('/projects');

  // Both the header button and the empty-state button say "Publish a
  // project" when the account has no projects yet — .first() grabs either.
  await page.getByRole('button', { name: 'Publish a project' }).first().click();

  const title = `E2E Test Project ${Date.now()}`;
  await page.getByPlaceholder('Ex: Development of a mobile app').fill(title);
  await page.getByPlaceholder(/Describe your project in detail/i).fill('Created by the Playwright smoke suite — safe to ignore/delete.');
  // Experience/period options are hardcoded French strings in ProjectsPage.js
  // (not run through i18n), so these values are locale-independent.
  await page.locator('select').nth(0).selectOption('3-5 ans');
  await page.locator('select').nth(1).selectOption('De 1 à 3 jours');

  await page.getByRole('button', { name: 'Publish project' }).click();

  await expect(page.getByText(title)).toBeVisible({ timeout: 15000 });
});
