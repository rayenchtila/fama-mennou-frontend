// The password-reset flow also moved from reCAPTCHA to Turnstile: every request that sends a code carries a fresh,
// single-use token for the "forgot_password" action, and a refusal from the API is said, not swallowed.
const { launch, createReport, openApp } = require('./harness');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const settle = (page, ms = 500) => page.waitForTimeout(ms);

async function openForgot(page) {
  await page.locator('header').getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForSelector(DIALOG, { timeout: 8000 });
  await settle(page, 500);
  await page.locator(DIALOG).getByRole('button', { name: 'Forgot password?' }).click();
  await page.getByRole('heading', { name: 'Forgot your password?' }).waitFor({ timeout: 8000 });
  await settle(page, 400);
}
const sendBtn = (page) => page.locator(DIALOG).getByRole('button', { name: 'Send code' });

(async () => {
  const R = createReport('Forgot password');
  const env = await launch({ lang: 'en' });
  const { page, mock, issues } = env;
  await openApp(page);
  await openForgot(page);

  R.section('Step 1 — the e-mail');
  await sendBtn(page).click();
  await settle(page, 400);
  R.eq('an empty address is refused before any request', mock.callsTo(/send-reset-code/).length, 0);
  await page.getByLabel('Email address').fill('Lina.Test@Example.com');
  await sendBtn(page).click();
  await page.getByRole('heading', { name: 'Verify your identity' }).waitFor({ timeout: 10000 }).catch(() => {});
  const first = mock.callsTo(/send-reset-code/);
  R.eq('one /send-reset-code request', first.length, 1);
  R.eq('with the address in lower case', first[0] && first[0].body.email, 'lina.test@example.com');
  R.check('and a Turnstile token for "forgot_password"', /^stub-token-forgot_password-/.test((first[0] && first[0].body.captchaToken) || ''), first[0] && first[0].body);
  R.check('step 2 shows the address the code went to (as typed)', (await page.locator(DIALOG).innerText()).toLowerCase().includes('lina.test@example.com'));

  R.section('Step 2 — code and new password');
  await page.getByLabel('Verification code').fill('48a2915');
  R.eq('letters are filtered out of the code', await page.getByLabel('Verification code').inputValue(), '482915');
  const pw = page.locator(`${DIALOG} input[type=password]`);
  await pw.nth(0).fill('longenoughbutnodigit');
  await pw.nth(1).fill('longenoughbutnodigit');
  await page.locator(DIALOG).getByRole('button', { name: 'Reset password' }).click();
  await settle(page, 400);
  R.check('a password without a number or symbol is refused on the form', (await page.locator(`${DIALOG} [role=alert]`).allInnerTexts()).length === 1);
  R.eq('…and nothing was sent', mock.callsTo(/reset-password/).length, 0);

  // Resend: a NEW token
  await page.locator(DIALOG).getByRole('button', { name: 'Resend code' }).click();
  await page.getByRole('heading', { name: 'Code resent' }).waitFor({ timeout: 10000 });
  const sends = mock.callsTo(/send-reset-code/);
  R.eq('resend: a second /send-reset-code request', sends.length, 2);
  R.check('…with a different single-use token', sends[0].body.captchaToken !== sends[1].body.captchaToken, sends.map(s => s.body.captchaToken));
  await page.getByRole('button', { name: 'Enter the code' }).click();
  await settle(page, 400);

  // Success
  await page.getByLabel('Verification code').fill('482915');
  await pw.nth(0).fill('Better#Pass1');
  await pw.nth(1).fill('Better#Pass1');
  await page.locator(DIALOG).getByRole('button', { name: 'Reset password' }).click();
  await page.getByRole('heading', { name: 'Password reset' }).waitFor({ timeout: 10000 }).catch(() => {});
  const reset = mock.callsTo(/reset-password/);
  R.eq('one /reset-password request', reset.length, 1);
  R.eq('it carries the e-mail, the code and the new password', [reset[0].body.email, reset[0].body.code, reset[0].body.newPassword], ['lina.test@example.com', '482915', 'Better#Pass1']);
  R.check('the success screen is shown', /Password reset/.test(await page.locator(DIALOG).innerText()), (await page.locator(DIALOG).innerText()).slice(0, 160));

  await env.close();

  R.section('The API says no');
  for (const [answer, expected] of [
    [{ error: 'noAccount' }, /No account found/],
    [{ error: 'invalidCaptcha' }, /security check/i],
    [{ error: 'captchaUnavailable' }, /unavailable|later/i],
    [{ error: 'too_many_requests' }, /Too many attempts/],
  ]) {
    const e2 = await launch({ lang: 'en' });
    e2.mock.on('POST', /\/auth\/send-reset-code/, () => ({ status: 400, json: answer }));
    await openApp(e2.page);
    await openForgot(e2.page);
    await e2.page.getByLabel('Email address').fill('lina.test@example.com');
    await sendBtn(e2.page).click();
    await e2.page.waitForFunction(() => document.querySelector('[role=dialog] [role=alert]'), null, { timeout: 8000 });
    const msg = (await e2.page.locator(`${DIALOG} [role=alert]`).allInnerTexts()).join(' ');
    R.check(`"${answer.error}" is shown on step 1 and does NOT advance to step 2`, expected.test(msg) && (await e2.page.getByRole('heading', { name: 'Forgot your password?' }).count()) === 1, msg);
    await e2.close();
  }

  R.eq('page errors', issues, []);
  R.done();
})().catch(e => { console.error(e); process.exit(1); });
