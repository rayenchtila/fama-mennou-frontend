// e2e/helpers.js
//
// Shared fixtures + auth helpers for the Fama Mennou smoke suite.
//
// Login/signup lives behind a MODAL (src/components/Authmodal.js), not a page,
// so every flow below starts from "/" and drives that modal directly using
// the real field placeholders/labels (see Authmodal.js — nothing here is
// guessed). Selectors intentionally use the English copy: `primePage()`
// forces `localStorage.language = 'en'` before the app boots (default
// language is French — see src/i18n.js), so the same fixed strings match on
// every run regardless of a developer's saved language preference.
//
// IMPORTANT — auth rate limit: routes/auth.js applies a shared limiter
// (10 requests / 15 min per IP) to BOTH /register and /login. Most specs
// therefore do NOT log in via the UI themselves — they reuse a storageState
// file produced once by e2e/global-setup.js (see STORAGE_STATE below).
// Only auth.spec.js exercises the real signup/login network calls, and only
// a few times, to stay well under that budget across a full run.

const { expect } = require('@playwright/test');
const path = require('path');

const PASSWORD = 'E2eTest!Pass2026';

// Fixed, clearly-namespaced test accounts, reused across runs (backend
// enforces a unique (email, role) constraint, and in this app's dev mode —
// REACT_APP_DEV_MODE=true — resubmitting the signup form for an account that
// already exists just silently logs it in instead of erroring, see
// Authmodal.js's IS_DEV branch in handleSubmit).
const USERS = {
  freelancer: {
    email: 'e2e.freelancer.test@famamennou.tn',
    password: PASSWORD,
    firstName: 'E2E',
    lastName: 'Freelancer',
    role: 'freelancer',
  },
  client: {
    email: 'e2e.client.test@famamennou.tn',
    password: PASSWORD,
    firstName: 'E2E',
    lastName: 'Client',
    role: 'client',
  },
};

// Storage state files written by e2e/global-setup.js — pass one of these to
// `test.use({ storageState })` to start a test already logged in as that
// account, without spending any of the auth rate-limit budget.
const STORAGE_STATE = {
  freelancer: path.join(__dirname, '.auth', 'freelancer.json'),
  client: path.join(__dirname, '.auth', 'client.json'),
};

// Forces the English translation bundle + pre-accepts the cookie banner.
// Must run via addInitScript (before app boot), so call this before goto().
async function primePage(page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('language', 'en');
      window.localStorage.setItem('fm_cookie_consent', 'accepted');
    } catch {}
  });
}

// Opens the AuthModal from the navbar and returns a locator scoped to it.
// Scoping matters: the modal's own tab-switcher/submit buttons re-use the
// same text as the navbar's "Log in"/"Sign up" buttons ('.auth-card' is the
// modal's own wrapper class, set in components/Modal.js's fullscreen variant
// and used nowhere else in the app).
async function openAuthModal(page, mode) {
  await page.goto('/');
  await page.getByRole('button', { name: mode === 'login' ? 'Log in' : 'Sign up' }).click();
  const modal = page.locator('.auth-card');
  await expect(modal).toBeVisible();
  return modal;
}

async function fillSignupForm(modal, user) {
  await modal.getByRole('button', { name: user.role === 'client' ? 'Client' : 'Freelancer' }).click();
  await modal.getByPlaceholder('Your last name').fill(user.lastName);
  await modal.getByPlaceholder('Your first name').fill(user.firstName);
  await modal.getByPlaceholder('you@example.com').fill(user.email);
  // exact:true — otherwise "Password" substring-matches "Repeat your password" too.
  await modal.getByPlaceholder('Password', { exact: true }).fill(user.password);
  await modal.getByPlaceholder('Repeat your password').fill(user.password);
  await modal.locator('input[type="date"]').fill('1995-06-15');
  // exact:true — "Female" contains "male" as a substring, so a loose match hits both.
  await modal.getByRole('button', { name: 'Male', exact: true }).click();
  if (user.role === 'freelancer') {
    await modal.locator('select').selectOption({ label: 'Tunis' });
    await modal.getByPlaceholder('Dev, Marketing, Design...').fill('Testing, Automation, QA');
  }
  await modal.locator('label').filter({ hasText: 'I accept the' }).click();
}

// Real login via the UI (1 auth-rate-limited request). Used by auth.spec.js
// only — everything else reuses STORAGE_STATE instead.
async function loginAs(page, user) {
  const modal = await openAuthModal(page, 'login');
  await modal.getByPlaceholder('you@example.com').fill(user.email);
  await modal.getByPlaceholder('Enter your password').fill(user.password);
  await modal.getByRole('button', { name: 'Log in', exact: true }).last().click();

  // First real login after an approved signup shows a one-time "Account
  // approved!" interstitial (Authmodal.js's CINStatusScreen, gated on
  // !user.statusSeen) before the modal actually closes — the dev-mode
  // signup shortcut in global-setup.js never goes through this screen, so
  // this is the first time a real /auth/login response surfaces it.
  const accessButton = modal.getByRole('button', { name: 'Access my account' });
  await Promise.race([
    modal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {}),
    accessButton.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
  ]);
  if (await accessButton.isVisible().catch(() => false)) {
    await accessButton.click();
  }

  return modal;
}

module.exports = { USERS, STORAGE_STATE, primePage, openAuthModal, fillSignupForm, loginAs };
