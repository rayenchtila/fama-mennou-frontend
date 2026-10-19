// Items 2, 3, 4(not for clients), 6, 7, 8 — a CLIENT signs up with a password:
//   one Full name field → invisible Turnstile token goes with /send-code → the 6-cell code field verifies by itself
//   → the account is created → the LOG-IN page (no session) → log in → "Welcome, <first word>".
const { launch, createReport, openApp, OUT } = require('./harness');
const path = require('path');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const input = (page, name) => page.locator(`${DIALOG} input[name="${name}"]`);
const settle = (page, ms = 700) => page.waitForTimeout(ms);

async function openSignup(page, lang = 'en') {
  const label = { en: 'Post a request', fr: 'Publier un besoin', ar: 'انشر طلباً' }[lang];
  await page.locator('header').getByRole('button', { name: label, exact: true }).first().click();
  await page.waitForSelector(DIALOG, { timeout: 8000 });
  await settle(page, 500);
}
async function pickClient(page, lang = 'en') {
  const label = { en: 'Client', fr: 'Client', ar: 'عميل' }[lang];
  await page.locator(DIALOG).getByRole('button', { name: label, exact: true }).first().click();
  await settle(page, 400);
}
async function tick(page) {   // the terms box is a visually hidden input; its drawn box is the next sibling
  await page.locator(`${DIALOG} label:has(input[type=checkbox]) > span[aria-hidden]`).first().click();
}

(async () => {
  const R = createReport('Client sign-up, end to end (manual)');
  const env = await launch({ lang: 'en', clipboardText: 'Your Famamennou code is 482 915. It expires in 10 minutes.' });
  const { page, mock, issues } = env;
  await openApp(page);
  await openSignup(page);
  await pickClient(page);

  R.section('The form');
  R.eq('one Full name field (name="name")', await input(page, 'name').count(), 1);
  R.eq('no first/last name fields', await page.locator(`${DIALOG} input[name="firstName"], ${DIALOG} input[name="lastName"], ${DIALOG} input[name="first_name"], ${DIALOG} input[name="last_name"]`).count(), 0);
  R.check('the field says the first word is the one shown', /first word|shown|displayed/i.test(await page.locator(`${DIALOG}`).innerText()), 'no hint text found');
  R.eq('no Short bio field at sign-up', await page.locator(`${DIALOG} textarea, ${DIALOG} input[name="bio"]`).count(), 0);
  R.check('no "bio" text in the sign-up dialog', !/\bbio\b/i.test(await page.locator(DIALOG).innerText()));
  R.eq('clients are not asked for a date of birth', await input(page, 'bday').count(), 0);
  R.eq('clients are not asked for an identity document', await page.locator(`${DIALOG} input[type=file]`).count(), 0);
  // Turnstile rendered invisibly on the final step
  await page.waitForFunction(() => window.__ts && window.__ts.renders.length > 0, null, { timeout: 8000 });
  const r0 = await page.evaluate(() => window.__ts.renders[0]);
  R.eq('Turnstile widget action', r0.action, 'signup');
  R.eq('Turnstile is the small visible box (appearance "always")', r0.appearance, 'always');
  R.check('its height is reserved up front, so the form does not jump when it appears', (await page.locator('[data-turnstile-action="signup"]').boundingBox()).height >= 60);
  R.eq('Turnstile uses the configured site key', r0.sitekey, '1x00000000000000000000AA');
  R.eq('the old reCAPTCHA is gone from the page', await page.locator('iframe[src*="recaptcha"], .g-recaptcha, [data-sitekey][class*="recaptcha"]').count(), 0);

  R.section('Validation (nothing is sent)');
  await page.getByRole('button', { name: 'Create my account' }).click();
  await settle(page);
  R.eq('submitting an empty form calls no API', mock.callsTo(/\/auth\/(send-code|register)/).length, 0);
  const errs = await page.locator(`${DIALOG} [role=alert]`).allInnerTexts();
  R.check('required-field errors are shown', errs.length >= 3, errs);

  await input(page, 'name').fill('Amine');
  await input(page, 'email').fill('amine.test@example.com');
  await input(page, 'new-password').fill('Secret#123');
  await input(page, 'confirm-password').fill('Secret#123');
  await page.locator(`${DIALOG} select[name="region"]`).selectOption({ index: 1 });
  await tick(page);
  await page.getByRole('button', { name: 'Create my account' }).click();
  await settle(page);
  const nameErr = await page.locator(`${DIALOG} #${await input(page, 'name').getAttribute('id')}-err`).innerText().catch(() => '');
  R.check('a single word as the full name is refused with a clear message', /full name|two|first and last|surname/i.test(nameErr), nameErr);
  R.eq('…and nothing was sent', mock.callsTo(/\/auth\/send-code/).length, 0);

  R.section('Send the code');
  await input(page, 'name').fill('Amine   Ben Salah');   // extra spaces on purpose
  await page.getByRole('button', { name: 'Create my account' }).click();
  await page.getByRole('heading', { name: 'Check your email' }).waitFor({ timeout: 10000 });
  const send = mock.callsTo(/\/auth\/send-code/);
  R.eq('one /send-code request', send.length, 1);
  R.eq('it carries the e-mail (lower-case)', send[0] && send[0].body.email, 'amine.test@example.com');
  R.check('it carries a Turnstile token for the "signup" action', /^stub-token-signup-/.test(send[0] && send[0].body.captchaToken || ''), send[0] && send[0].body);
  R.eq('and the role', send[0] && send[0].body.role, 'client');
  R.eq('no registration happened yet', mock.callsTo(/\/auth\/register/).length, 0);

  R.section('The code screen');
  R.eq('six code cells', await page.locator(`${DIALOG} div[aria-hidden="true"].grid > span`).count(), 6);
  R.check('the address the code went to is shown', (await page.locator(DIALOG).innerText()).includes('amine.test@example.com'));
  R.eq('no dev-code panel from a production-style response', await page.locator('[data-testid="dev-code"]').count(), 0);
  R.eq('the code field is focused on arrival', await page.evaluate(() => document.activeElement && document.activeElement.autocomplete), 'one-time-code');
  const verifyBtn = page.getByRole('button', { name: 'Verify & Create Account' });
  R.eq('manual "Verify" fallback is disabled until six digits are in', await verifyBtn.isDisabled(), true);
  await page.screenshot({ path: path.join(OUT, 't2-code-screen.png') });

  // A wrong code first
  const code = page.getByLabel('Verification code');
  await code.pressSequentially('111111', { delay: 40 });
  await page.waitForFunction(() => document.querySelector('[role=alert]'), null, { timeout: 5000 });
  const wrong = await page.locator(`${DIALOG} [role=alert]`).first().innerText();
  R.check('a wrong code shows how many tries are left', /4/.test(wrong), wrong);
  R.eq('it auto-verified without pressing a button', mock.callsTo(/\/auth\/verify-code/).length, 1);
  R.eq('…and the account was NOT created', mock.callsTo(/\/auth\/register/).length, 0);
  await page.waitForTimeout(1000);
  R.eq('the cells empty themselves for the next try', await code.inputValue(), '');

  // The right code, typed digit by digit — nothing else to press
  await code.pressSequentially('482915', { delay: 60 });
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 10000 });
  R.eq('typing the sixth digit verified AND created the account (no button pressed)', mock.callsTo(/\/auth\/verify-code/).length, 2);
  const reg = mock.callsTo(/\/auth\/register/);
  R.eq('one /register request', reg.length, 1);
  const b = reg[0] ? reg[0].body : {};
  R.eq('Full name sent as ONE field, tidied', b.name, 'Amine Ben Salah');
  R.eq('role', b.role, 'client');
  R.eq('e-mail proof from the server travels with it', b.emailProof, 'proof-amine.test@example.com');
  R.check('no bio in the sign-up payload', !('bio' in b), Object.keys(b));
  R.check('no first/last name keys', !('firstName' in b) && !('lastName' in b) && !('first_name' in b) && !('last_name' in b), Object.keys(b));
  R.check('a client sends no identity document and no date of birth', !b.idFront && !b.idBack && !b.dob && !b.cin, Object.keys(b));
  R.check('the Turnstile token is not part of /register (it guarded /send-code)', !('captchaToken' in b));

  R.section('Redirect to the login page');
  const dlg = await page.locator(DIALOG).innerText();
  R.check('the title is the LOGIN title', /Welcome back/.test(dlg));
  R.check('a notice says the account was created', await page.locator('[data-testid="signup-notice"]').count() === 1, await page.locator('[data-testid="signup-notice"]').allInnerTexts());
  R.eq('the e-mail is already filled in', await input(page, 'email').inputValue(), 'amine.test@example.com');
  await settle(page, 400);
  R.eq('the password field has the focus', await page.evaluate(() => document.activeElement && document.activeElement.type), 'password');
  R.eq('NOT signed in after sign-up (no /auth/login yet)', mock.callsTo(/\/auth\/login/).length, 0);
  R.eq('the header still offers "Log in" (no avatar)', await page.locator('header').getByRole('button', { name: 'Log in', exact: true }).count() >= 0, true);
  R.eq('only one dialog is open', await page.locator(DIALOG).count(), 1);
  await page.screenshot({ path: path.join(OUT, 't2-login-after-signup.png') });

  R.section('…and then they log in');
  await input(page, 'password').fill('Secret#123');
  await page.getByRole('button', { name: 'Log in', exact: true }).last().click();
  await page.waitForSelector(DIALOG, { state: 'detached', timeout: 10000 });
  const login = mock.callsTo(/\/auth\/login/);
  R.eq('one /login request', login.length, 1);
  R.check('with a Turnstile token for the "login" action', /^stub-token-login-/.test(login[0] && login[0].body.captchaToken || ''), login[0] && login[0].body.captchaToken);
  await page.getByText(/Welcome, Amine!/).first().waitFor({ timeout: 8000 });
  R.check('the welcome toast shows ONLY the first word of the full name', true);
  R.check('…and not the whole name', (await page.locator('body').innerText()).includes('Welcome, Amine Ben') === false);

  R.eq('page errors', issues, []);
  await env.close();
  R.done();
})().catch(e => { console.error(e); process.exit(1); });
