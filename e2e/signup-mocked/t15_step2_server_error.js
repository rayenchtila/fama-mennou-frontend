// Regression check for the "Créer mon compte does nothing" bug: a freelancer reaches step 2
// (identity document), submits, and the SERVER (not client-side validation) refuses — e.g. the
// e-mail is already taken. Every such refusal is reported on the e-mail field, which only exists
// on step 1. Without switching back, the error was set on an unrendered field: the loading
// spinner stopped and nothing else happened, indistinguishable from the button being broken.
const { launch, createReport, openApp, samplePng } = require('./harness');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const input = (page, name) => page.locator(`${DIALOG} input[name="${name}"]`);
const settle = (page, ms = 500) => page.waitForTimeout(ms);
const errorTexts = (page) => page.locator(`${DIALOG} [role=alert]`).allInnerTexts();

(async () => {
  const R = createReport('Step 2 submit, server refuses (emailTaken)');
  const env = await launch({ lang: 'en' });
  const { page, mock, issues } = env;

  // The server already has this e-mail registered as a freelancer.
  mock.users.push({ email: 'sami.dev@example.com', password: 'Secret#123', name: 'Sami Ben Ali', role: 'freelancer' });

  await openApp(page);
  await page.locator('header').getByRole('button', { name: 'Post a request', exact: true }).first().click();
  await page.waitForSelector(DIALOG, { timeout: 8000 });
  await settle(page);

  // Step 1
  await input(page, 'name').fill('Sami Ben Ali');
  await input(page, 'email').fill('sami.dev@example.com');
  await input(page, 'new-password').fill('Secret#123');
  await input(page, 'confirm-password').fill('Secret#123');
  await input(page, 'bday').fill('1996-03-10');
  await page.locator(DIALOG).getByRole('button', { name: 'Male', exact: true }).click();
  await page.locator(`${DIALOG} select[name="region"]`).selectOption({ index: 2 });
  await input(page, 'skills').fill('React, Figma');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('heading', { name: 'Identity document' }).waitFor({ timeout: 5000 });
  R.check('reached step 2', true);

  // Step 2: passport (single photo), terms accepted
  await page.locator(`${DIALOG} fieldset label:has(input[value="passport"])`).click();
  await settle(page, 250);
  const png = samplePng('doc-step2err.png', [90, 120, 220]);
  await page.locator(`${DIALOG} input[type=file]:not([capture])`).first().setInputFiles(png);
  await page.locator(`${DIALOG} img[src^="blob:"]`).first().waitFor({ timeout: 5000 });
  await page.locator(`${DIALOG} label:has(input[type=checkbox]) > span[aria-hidden]`).first().click();

  R.eq('still showing step 2 before submit', await page.getByRole('heading', { name: 'Identity document' }).isVisible(), true);

  // Submit — the mock's default /register handler returns emailTaken for a duplicate
  // (email, role) pair, but that only fires once the code is verified. send-code itself
  // doesn't normally check this, so make the override explicit and match what the real
  // API does: refuse to even send a code for an address that's already registered.
  mock.on('POST', /\/auth\/send-code$/, () => ({ status: 409, json: { error: 'emailTaken' } }));

  await page.getByRole('button', { name: 'Create my account' }).click();
  await settle(page, 900);

  R.check('switched BACK to step 1 (the email field is visible again)', await input(page, 'email').count() === 1);
  R.check('no longer on the document step', !(await page.getByRole('heading', { name: 'Identity document' }).isVisible().catch(() => false)));
  const errs = (await errorTexts(page)).join(' | ');
  R.check('the "already exists" error is actually shown somewhere on screen', /already exists/i.test(errs), errs);
  R.eq('nothing was sent to /register (refused before that)', mock.callsTo(/\/auth\/register/).length, 0);

  await page.screenshot({ path: require('path').join(__dirname, 'out', 't15-after-submit.png'), fullPage: false });

  R.eq('page errors', issues, []);
  await env.close();
  R.done();
})().catch(e => { console.error(e); process.exit(1); });
