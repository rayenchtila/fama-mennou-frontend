// playwright.config.js
//
// E2E smoke-test config for the Fama Mennou frontend.
//
// This spins up BOTH servers automatically via `webServer` (an array is
// supported by Playwright — each entry gets its own process + readiness URL):
//   1. The backend (Express + Postgres) from the sibling repo folder
//      "rayen-buisness BACKEND", started with `node index.js` on port 4000.
//   2. This frontend (CRA dev server) with `npm start` on port 3000.
//
// Both are dev-mode processes (no NODE_ENV=production is set), which is
// exactly what auth.js / the AuthModal expect: reCAPTCHA, email verification
// and device-approval are all auto-skipped in that mode, and REACT_APP_DEV_MODE
// (see .env.local) skips the client-side CAPTCHA/CIN requirement too.
//
// If you'd rather start the backend yourself (e.g. it's already running, or
// you're iterating on it in another terminal), Playwright's `reuseExistingServer`
// (enabled outside CI) will detect the already-listening port and skip
// spawning a new one — just run:
//   cd "../rayen-buisness BACKEND" && node index.js
// in a separate terminal first, then `npx playwright test` here.
//
// Override the backend location with BACKEND_DIR if your folder layout differs.

const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

const BACKEND_DIR = process.env.BACKEND_DIR || path.resolve(__dirname, '..', 'rayen-buisness BACKEND');
const IS_CI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup.js'),
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  // Single worker: several specs intentionally share the same fixed E2E test
  // accounts (signup-or-fallback-to-login) — one worker keeps that race-free.
  workers: 1,
  retries: IS_CI ? 1 : 0,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: [
    {
      command: 'node index.js',
      cwd: BACKEND_DIR,
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: !IS_CI,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm start',
      cwd: __dirname,
      url: 'http://localhost:3000',
      reuseExistingServer: !IS_CI,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
