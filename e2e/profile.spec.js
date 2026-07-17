// e2e/profile.spec.js
//
// Covers flow 3 (view/edit own profile) and flow 7 (file upload — profile
// photo). Both live on the same page (src/page/ProfilePage.js), so they
// share one spec file. Uses the freelancer storageState saved by
// e2e/global-setup.js instead of logging in itself (see helpers.js — the
// auth endpoints are rate-limited).

const path = require('path');
const { test, expect } = require('@playwright/test');
const { USERS, STORAGE_STATE } = require('./helpers');

test.use({ storageState: STORAGE_STATE.freelancer });

test('freelancer can view and edit their profile', async ({ page }) => {
  await page.goto('/profile');

  await expect(page.getByText(USERS.freelancer.email)).toBeVisible();

  const bio = `E2E automated bio update ${Date.now()}`;
  await page.locator('textarea').fill(bio);
  await page.getByRole('button', { name: 'Save changes' }).click();

  // ProfilePage swaps the button label to a "saved" confirmation for 2s.
  await expect(page.getByRole('button', { name: /saved/i })).toBeVisible({ timeout: 5000 });
});

test('freelancer can upload a profile photo', async ({ page }) => {
  await page.goto('/profile');

  // ProfilePage.updateUser() silently no-ops if AuthContext's `accounts` map
  // (populated by a fetch fired on mount) hasn't loaded the current user's
  // own record yet — there's no loading indicator to key off of, so give
  // that fetch a moment to land before touching the file input.
  await page.waitForLoadState('networkidle');

  // Before any upload, the avatar is a colored div with initials — no <img>.
  await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, 'fixtures', 'avatar.png'));

  // ProfilePage reads the file client-side, PATCHes /users/:email with the
  // photo, then re-renders the avatar as an <img alt={user.name}> once the
  // AuthContext state syncs back — round-trips through the real backend/DB.
  // Both the navbar avatar and the profile page's own avatar pick it up.
  await expect(page.locator(`img[alt="${USERS.freelancer.firstName} ${USERS.freelancer.lastName}"]`).first())
    .toBeVisible({ timeout: 15000 });
});
