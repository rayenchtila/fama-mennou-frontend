// e2e/auth.spec.js
//
// Covers flows 1 & 2 from the task: signup + login (incl. wrong-password).
//
// This file is the only spec that actually drives the signup/login network
// calls (routes/auth.js rate-limits /register + /login to 10 req/15min per
// IP — see e2e/helpers.js) — every other spec reuses a storageState session
// produced once by e2e/global-setup.js instead of logging in itself.

const { test, expect } = require('@playwright/test');
const { USERS, primePage, openAuthModal, fillSignupForm, loginAs } = require('./helpers');

test('a new freelancer can sign up', async ({ page }) => {
  // A fresh, disposable email (not the shared USERS.freelancer fixture) so
  // this always exercises a genuine "create account" path rather than the
  // dev-mode "already exists -> silently log in instead" shortcut.
  const freshUser = {
    ...USERS.freelancer,
    email: `e2e.signup.${Date.now()}@famamennou.tn`,
  };

  await primePage(page);
  const modal = await openAuthModal(page, 'signup');
  await fillSignupForm(modal, freshUser);
  await modal.getByRole('button', { name: 'Create account' }).click();

  await expect(modal).toBeHidden({ timeout: 15000 });
  // Logged in: navbar swaps "Log in"/"Sign up" for the profile menu showing the user's name.
  await expect(page.getByText('E2E Freelancer', { exact: true })).toBeVisible();
});

test('an existing account can log back in', async ({ page }) => {
  await primePage(page);
  const modal = await loginAs(page, USERS.freelancer);

  await expect(modal).toBeHidden({ timeout: 15000 });
  await expect(page.getByText('E2E Freelancer', { exact: true })).toBeVisible();
});

test('login fails with a wrong password', async ({ page }) => {
  await primePage(page);
  const modal = await openAuthModal(page, 'login');
  await modal.getByPlaceholder('you@example.com').fill(USERS.freelancer.email);
  await modal.getByPlaceholder('Enter your password').fill('DefinitelyWrongPassword!1');
  await modal.getByRole('button', { name: 'Log in', exact: true }).last().click();

  await expect(modal.getByText('Incorrect password')).toBeVisible();
  // Modal must stay open — login did not succeed.
  await expect(modal).toBeVisible();
});
