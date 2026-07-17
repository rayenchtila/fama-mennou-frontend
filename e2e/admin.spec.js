// e2e/admin.spec.js
//
// Covers flow 6: admin dashboard gating. We don't have the real super-admin
// credential (a separate account outside this test's control), so per the
// task this is scaled down to the one thing we CAN verify safely: a
// non-admin account gets bounced off /admin/dashboard.
//
// src/App.js routes /admin/dashboard as:
//   user?.isAdmin ? <AdminPage /> : <Navigate to="/" replace />
// i.e. it's a plain client-side redirect, not gated behind PrivateRoute's
// login prompt — so this also covers the logged-out case explicitly below.

const { test, expect } = require('@playwright/test');
const { STORAGE_STATE } = require('./helpers');

test.describe('logged in as a non-admin', () => {
  test.use({ storageState: STORAGE_STATE.client });

  test('a logged-in non-admin is redirected away from /admin/dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL('/');
  });
});

test.describe('logged out', () => {
  test('a logged-out visitor is redirected away from /admin/dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL('/');
  });
});
