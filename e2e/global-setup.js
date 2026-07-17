// e2e/global-setup.js
//
// Runs ONCE before the whole suite (after both webServer entries are up —
// Playwright starts webServer before globalSetup). Signs the two fixed E2E
// accounts in via the real signup/login modal and saves each session's
// storageState (cookies + localStorage) to disk.
//
// Why this exists: routes/auth.js applies a shared rate limiter
// (`authLimit`, 10 requests / 15 min per IP) to BOTH /register and /login.
// Re-running the full signup-or-login dance from every single test file
// burns 2 requests each and blows through that budget well before the
// suite finishes — logins then start silently failing (the app closes the
// auth modal on failure too, so it *looks* like it worked). Logging in once
// here and having every other spec reuse the saved session via
// `test.use({ storageState })` keeps the whole suite's auth-endpoint usage
// small and predictable: 2 signups here + the couple of real login/signup
// calls auth.spec.js makes on purpose.

const fs = require('fs');
const path = require('path');
const { chromium, expect } = require('@playwright/test');
const { USERS, primePage, openAuthModal, fillSignupForm } = require('./helpers');

const AUTH_DIR = path.join(__dirname, '.auth');
const BASE_URL = 'http://localhost:3000';

async function signInAndSave(browser, user, storagePath) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  await primePage(page);

  const modal = await openAuthModal(page, 'signup');
  await fillSignupForm(modal, user);
  await modal.getByRole('button', { name: 'Create account' }).click();

  // Dev-mode signup (REACT_APP_DEV_MODE=true) always ends in register+login,
  // even if the account already exists (see Authmodal.js's IS_DEV branch) —
  // so waiting for the modal to close is enough either way.
  await expect(modal).toBeHidden({ timeout: 20000 });
  await expect(page.getByText(`${user.firstName} ${user.lastName}`, { exact: true })).toBeVisible({ timeout: 10000 });

  await context.storageState({ path: storagePath });
  await context.close();
}

module.exports = async function globalSetup() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    // Sequential on purpose — both share the same per-IP rate-limit bucket.
    await signInAndSave(browser, USERS.freelancer, path.join(AUTH_DIR, 'freelancer.json'));
    await signInAndSave(browser, USERS.client, path.join(AUTH_DIR, 'client.json'));
  } finally {
    await browser.close();
  }
};
