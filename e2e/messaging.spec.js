// e2e/messaging.spec.js
//
// Covers flow 5: send a message. Messaging admin@famamennou.com is always
// allowed for any logged-in account (routes/messages.js only locks chat
// between two *non-admin* different-role users without an awarded project),
// so it needs no other fixture account or prior project/proposal state —
// the most reachable messaging path from a fresh account. Uses the
// freelancer storageState saved by e2e/global-setup.js (see helpers.js —
// the auth endpoints are rate-limited, so specs don't log in themselves).

const { test, expect } = require('@playwright/test');
const { STORAGE_STATE } = require('./helpers');

test.use({ storageState: STORAGE_STATE.freelancer });

test('freelancer can send a message to support', async ({ page }) => {
  // ?with= opens MessengerChat directly on that conversation (see
  // src/page/MessagesPage.js + MessengerChat's initialChat prop).
  await page.goto('/messages?with=admin%40famamennou.com');

  const textarea = page.getByPlaceholder(/write a message/i);
  await expect(textarea).toBeVisible({ timeout: 15000 });

  // No 8+ digit run — routes/messages.js flags messages that look like a
  // phone number (utils/contentFilter.js) and 3 flags auto-suspends the
  // sender for 24h, which would break every other run reusing this account.
  const uniqueId = Math.random().toString(36).slice(2, 8);
  const uniqueMessage = `E2E smoke test message id-${uniqueId}`;
  await textarea.fill(uniqueMessage);
  await textarea.press('Enter'); // Enter-without-Shift submits (see MessengerChat.js onKeyDown)

  await expect(page.getByText(uniqueMessage, { exact: true })).toBeVisible({ timeout: 15000 });
});
