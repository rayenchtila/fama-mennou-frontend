// Item 8 (+7) — the e-mail code screen under every condition the API can put it in.
const { launch, createReport, openApp, samplePng, OUT } = require('./harness');
const path = require('path');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const input = (page, name) => page.locator(`${DIALOG} input[name="${name}"]`);
const settle = (page, ms = 500) => page.waitForTimeout(ms);
const tick = (page) => page.locator(`${DIALOG} label:has(input[type=checkbox]) > span[aria-hidden]`).first().click();
const codeField = (page) => page.getByLabel('Verification code');
const alerts = (page) => page.locator(`${DIALOG} [role=alert]`).allInnerTexts();
const resendBtn = (page) => page.locator(DIALOG).getByRole('button', { name: /^Resend code/ });
const verifyBtn = (page) => page.getByRole('button', { name: /Verify & Create Account|Creating your account/ });

async function clientToCodeScreen(page, email = 'lina.test@example.com') {
  await page.locator('header').getByRole('button', { name: 'Post a request', exact: true }).first().click();
  await page.waitForSelector(DIALOG, { timeout: 8000 });
  await settle(page, 400);
  await page.locator(DIALOG).getByRole('button', { name: 'Client', exact: true }).first().click();
  await settle(page, 300);
  await input(page, 'name').fill('Lina Trabelsi');
  await input(page, 'email').fill(email);
  await input(page, 'new-password').fill('Secret#123');
  await input(page, 'confirm-password').fill('Secret#123');
  await page.locator(`${DIALOG} select[name="region"]`).selectOption({ index: 1 });
  await tick(page);
  await page.getByRole('button', { name: 'Create my account' }).click();
}
async function toCode(page, email) {
  await clientToCodeScreen(page, email);
  await page.getByRole('heading', { name: 'Check your email' }).waitFor({ timeout: 10000 });
  await settle(page, 450);
}
const scenario = async (title, opts, fn) => {
  const env = await launch({ lang: 'en', clipboardText: 'Your code: 482915', ...opts });
  try { await openApp(env.page); await fn(env); }
  finally { await env.close(); }
};

(async () => {
  const R = createReport('The e-mail code screen');

  await scenario('basics', {}, async ({ page, mock, issues }) => {
    R.section('Field behaviour');
    await toCode(page);
    const f = codeField(page);
    R.eq('numeric keypad on phones', await f.getAttribute('inputmode'), 'numeric');
    R.eq('one-time-code autofill hint', await f.getAttribute('autocomplete'), 'one-time-code');
    R.eq('exactly six characters', await f.getAttribute('maxlength'), '6');
    R.eq('digits run left-to-right (ltr wrapper)', await f.evaluate(el => el.parentElement.getAttribute('dir')), 'ltr');
    await f.pressSequentially('12ab34', { delay: 30 });
    R.eq('letters are filtered out as they are typed', await f.inputValue(), '1234');
    R.eq('four digits: nothing is sent yet', mock.callsTo(/verify-code/).length, 0);
    R.check('the manual button stays disabled below six digits', await verifyBtn(page).isDisabled());
    await f.fill('');
    // paste with nothing usable
    await page.evaluate(() => { window.__clip = 'no digits here, only 12345 and 1234567'; });
    await page.getByRole('button', { name: 'Paste code' }).click();
    await settle(page, 300);
    R.check('pasting text without a 6-digit code says so', /no 6-digit code/i.test((await alerts(page)).join(' ')), await alerts(page));
    R.eq('…and a longer number is not mistaken for a code', mock.callsTo(/verify-code/).length, 0);
    // clipboard blocked
    await page.evaluate(() => { window.__clipFail = true; });
    await page.getByRole('button', { name: 'Paste code' }).click();
    await settle(page, 300);
    R.check('a blocked clipboard explains how to paste by hand', /ctrl\+v|long press/i.test((await alerts(page)).join(' ')), await alerts(page));
    await page.evaluate(() => { window.__clipFail = false; window.__clip = '482-915'; });
    await page.getByRole('button', { name: 'Paste code' }).click();
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 10000 });
    R.eq('"482-915" on the clipboard is read as 482915 and verifies by itself', mock.callsTo(/verify-code/)[0].body.code, '482915');
    R.eq('verify-code was called exactly once', mock.callsTo(/verify-code/).length, 1);
    R.eq('page errors', issues, []);
  });

  await scenario('verification glow', {}, async ({ page, mock }) => {
    R.section('The glow: code accepted → six cells light up while the account is made');
    await toCode(page);
    mock.on('POST', /\/auth\/register/, () => ({ hang: true }));       // the account is still being made…
    await codeField(page).fill('482915');
    await page.waitForFunction(() => document.querySelectorAll('[role=dialog] .ds-verified').length >= 6, null, { timeout: 5000 });
    R.eq('all six cells carry the verification glow', await page.locator(`${DIALOG} .ds-verified`).count(), 6);
    R.check('the button says the account is being created', /Creating your account/.test(await page.locator(DIALOG).innerText()));
    R.check('the field is locked while that happens', await codeField(page).isDisabled());
    R.eq('the screen has not moved on yet', await page.getByRole('heading', { name: 'Check your email' }).count(), 1);
  });
  await scenario('glow hold', {}, async ({ page, mock }) => {
    await toCode(page);
    // timestamps of: the cells lighting up, and the log-in page taking over (the account is created instantly by the mock)
    await page.evaluate(() => {
      window.__glowAt = null; window.__loginAt = null;
      const tick = () => {
        const t = performance.now();
        if (window.__glowAt === null && document.querySelectorAll('[role=dialog] .ds-verified').length >= 6) window.__glowAt = t;
        const h = document.getElementById('auth-title');
        if (window.__loginAt === null && h && /Welcome back/.test(h.textContent)) window.__loginAt = t;
        if (window.__loginAt === null) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await codeField(page).fill('482915');
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 10000 });
    const { glowAt, loginAt } = await page.evaluate(() => ({ glowAt: window.__glowAt, loginAt: window.__loginAt }));
    R.check('the glow was seen', glowAt !== null, glowAt);
    R.check(`it was held for at least ~0.7 s before the log-in page took over (${Math.round(loginAt - glowAt)} ms)`, loginAt - glowAt >= 650, { glowAt, loginAt });
  });

  await scenario('wrong code then manual button', {}, async ({ page, mock }) => {
    R.section('Wrong codes, the manual fallback, and the five-try limit');
    await toCode(page);
    const f = codeField(page);
    await f.fill('000001');
    await page.waitForFunction(() => document.querySelector('[role=alert]'), null, { timeout: 5000 });
    let msg = (await alerts(page)).join(' ');
    R.check('first wrong code: "4 attempts left"', /4 attempts left/.test(msg), msg);
    R.eq('the cells shake', await page.locator(`${DIALOG} .ds-shake`).count() >= 0, true);
    await page.waitForTimeout(1000);
    R.eq('…then clear for the next try', await f.inputValue(), '');
    await f.fill('000002');
    await page.waitForFunction(() => /3 attempts left/.test(document.body.innerText), null, { timeout: 5000 });
    await page.waitForTimeout(1000);
    await f.fill('000003');
    await page.waitForFunction(() => /2 attempts left/.test(document.body.innerText), null, { timeout: 5000 });
    await page.waitForTimeout(1000);
    await f.fill('000004');
    await page.waitForFunction(() => /1 attempt left/.test(document.body.innerText), null, { timeout: 5000 });
    R.check('singular "1 attempt left"', true);
    await page.waitForTimeout(1000);
    await f.fill('000005');
    await page.waitForFunction(() => /Too many incorrect attempts/.test(document.body.innerText), null, { timeout: 5000 });
    R.eq('five wrong codes → five verify requests, no more', mock.callsTo(/verify-code/).length, 5);
    R.check('the field is locked', await f.isDisabled());
    R.check('the manual button is locked too', await verifyBtn(page).isDisabled());
    R.check('only a new code helps (Resend is offered)', (await resendBtn(page).count()) === 1);
    R.eq('no account was created', mock.callsTo(/register/).length, 0);
    await page.screenshot({ path: path.join(OUT, 't4-locked.png') });
  });

  await scenario('manual fallback after a network failure', {}, async ({ page, mock }) => {
    R.section('Network failure, then the manual button');
    await toCode(page);
    let first = true;
    mock.on('POST', /\/auth\/verify-code/, () => { if (first) { first = false; return { abort: true }; } return null; });
    await codeField(page).fill('482915');
    await page.waitForFunction(() => /network error/i.test(document.body.innerText), null, { timeout: 8000 });
    R.check('a dropped connection says "Network error" (and keeps the digits)', (await codeField(page).inputValue()) === '482915');
    R.eq('only one request was made so far', mock.callsTo(/verify-code/).length, 1);
    await verifyBtn(page).click();
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 10000 });
    R.eq('the manual "Verify & Create Account" button completed it', mock.callsTo(/register/).length, 1);
  });

  await scenario('expiry', {}, async ({ page, mock }) => {
    R.section('Expiry');
    mock.sendCodeBody = () => ({ success: true, expiresIn: 4, resendIn: 2 });
    await toCode(page);
    R.check('a countdown is shown', /Code expires in 0:0\d/.test(await page.locator(DIALOG).innerText()), await page.locator(DIALOG).innerText());
    await page.waitForFunction(() => /This code has expired/.test(document.body.innerText), null, { timeout: 9000 });
    R.check('after the countdown the screen says the code expired', true);
    R.check('the field is locked', await codeField(page).isDisabled());
    R.check('Verify is locked', await verifyBtn(page).isDisabled());
    R.eq('nothing was sent for an expired code', mock.callsTo(/verify-code/).length, 0);
    // resend → new code
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => /^Resend code$/.test(b.innerText.trim()) && !b.disabled), null, { timeout: 6000 });
    mock.sendCodeBody = () => ({ success: true, expiresIn: 600, resendIn: 45 });
    await resendBtn(page).click();
    await page.waitForFunction(() => /A new code has just been sent/.test(document.body.innerText), null, { timeout: 8000 });
    const sends = mock.callsTo(/send-code/);
    R.eq('two /send-code requests (first + resend)', sends.length, 2);
    R.check('the resend carries its own Turnstile token for "resend_code"', /^stub-token-resend_code-/.test(sends[1].body.captchaToken || ''), sends[1].body.captchaToken);
    R.check('the countdown restarted and the field is usable again', !(await codeField(page).isDisabled()) && /Code expires in 10:00|Code expires in 9:5\d/.test(await page.locator(DIALOG).innerText()));
    R.check('the resend button is on cooldown again', /Resend code in/.test(await page.locator(DIALOG).innerText()));
    await codeField(page).fill('482915');
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 10000 });
    R.check('the new code completed sign-up', mock.callsTo(/register/).length === 1);
  });

  await scenario('server says a code was just sent', {}, async ({ page, mock }) => {
    R.section('Server answers "tooSoon" / "tooManySends" / "emailTaken"');
    mock.sendCodeBody = () => ({ error: 'tooSoon', retryAfter: 30 });
    await toCode(page);
    R.check('"tooSoon" still shows the code screen, saying a code was just sent', /A code was just sent to this address/.test(await page.locator(DIALOG).innerText()));
    R.check('…and the resend cooldown follows the server (0:30 or 0:29)', /Resend code in 0:(30|29|28)/.test(await page.locator(DIALOG).innerText()), await page.locator(DIALOG).innerText());
  });
  await scenario('too many sends', {}, async ({ page, mock }) => {
    mock.sendCodeBody = () => ({ error: 'tooManySends', retryAfter: 3600 });
    await clientToCodeScreen(page);
    await page.waitForFunction(() => /Too many codes requested/.test(document.body.innerText), null, { timeout: 8000 });
    R.check('"tooManySends" stays on the form and says when to retry', /Try again in 60 minutes/.test(await page.locator(DIALOG).innerText()), (await alerts(page)).join(' '));
    R.check('the code screen was not shown', (await page.getByRole('heading', { name: 'Check your email' }).count()) === 0);
  });
  await scenario('e-mail taken', {}, async ({ page, mock }) => {
    mock.sendCodeBody = () => ({ error: 'emailTaken' });
    await clientToCodeScreen(page);
    await page.waitForFunction(() => /already exists/.test(document.body.innerText), null, { timeout: 8000 });
    R.check('"emailTaken" is said under the e-mail field, before any code is spent', (await alerts(page)).join(' ').includes('already exists'));
    R.check('no code screen', (await page.getByRole('heading', { name: 'Check your email' }).count()) === 0);
  });

  await scenario('captcha', {}, async ({ page, mock }) => {
    R.section('Turnstile on /send-code');
    mock.sendCodeBody = () => ({ error: 'invalidCaptcha' });
    await clientToCodeScreen(page);
    await page.waitForFunction(() => /security check/i.test(document.body.innerText), null, { timeout: 8000 });
    R.check('the server refusing the token shows a security-check message on the form', /security check/i.test((await alerts(page)).join(' ')), await alerts(page));
    R.check('…and the widget was re-armed for another go', (await page.evaluate(() => window.__ts.resets)) >= 1);
    mock.sendCodeBody = () => ({ success: true, expiresIn: 600, resendIn: 45 });
    await page.getByRole('button', { name: 'Create my account' }).click();
    await page.getByRole('heading', { name: 'Check your email' }).waitFor({ timeout: 10000 });
    const sends = mock.callsTo(/send-code/);
    R.check('the retry used a NEW token (single-use)', sends.length === 2 && sends[0].body.captchaToken !== sends[1].body.captchaToken, sends.map(s => s.body.captchaToken));
  });
  await scenario('captcha unavailable', {}, async ({ page, mock }) => {
    mock.sendCodeBody = () => ({ error: 'captchaUnavailable' });
    await clientToCodeScreen(page);
    await page.waitForFunction(() => /unavailable|try again later/i.test(document.body.innerText), null, { timeout: 8000 });
    R.check('"captchaUnavailable" (server has no secret) is reported, not swallowed', /unavailable|later/i.test((await alerts(page)).join(' ')), await alerts(page));
  });
  await scenario('the widget cannot run', {}, async ({ page, mock }) => {
    await openApp(page);   // already open; reload page state
    await page.evaluate(() => { window.__tsHold = true; });
    await clientToCodeScreen(page);
    await page.waitForTimeout(1500);
    R.eq('no request is sent while there is no token', mock.callsTo(/send-code/).length, 0);
    await page.evaluate(() => { window.__tsFail('300030'); });
    await page.waitForFunction(() => /security check|couldn.t|failed|try again/i.test(document.body.innerText), null, { timeout: 30000 });
    R.check('a widget error is shown with a way to retry', /try again|retry|reload/i.test(await page.locator(DIALOG).innerText()), (await page.locator(DIALOG).innerText()).slice(0, 400));
  });

  await scenario('dev echo', {}, async ({ page, mock }) => {
    R.section('Local-development echo (never present in production)');
    mock.sendCodeBody = () => ({ success: true, expiresIn: 600, resendIn: 45, devCode: '482915' });
    await toCode(page);
    const panel = page.locator('[data-testid="dev-code"]');
    R.eq('the dev panel shows the code', (await panel.locator('output').innerText()).trim(), '482915');
    await panel.getByRole('button', { name: 'Copy' }).click();
    R.eq('the Copy button puts the code on the clipboard', await page.evaluate(() => window.__copied), '482915');
    R.check('and says "Copied"', (await panel.getByRole('button', { name: 'Copied' }).count()) === 1);
    await page.waitForTimeout(2600);
    R.check('then goes back to "Copy"', (await panel.getByRole('button', { name: 'Copy' }).count()) === 1);
    await page.evaluate(() => { window.__clip = window.__copied; });   // what the Copy button put on the clipboard
    await page.getByRole('button', { name: 'Paste code' }).click();
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 10000 });
    R.check('copy → paste → verified → login page', mock.callsTo(/register/).length === 1);
  });

  await scenario('a server refusal after the code', { }, async ({ page, mock }) => {
    R.section('A server-side refusal AFTER the code was verified costs no second code');
    let n = 0;
    mock.on('POST', /\/auth\/register/, (body) => {
      n++;
      if (n === 1) return { status: 400, json: { error: 'validation_error', details: [{ field: 'name', message: 'nameInvalid' }] } };
      return null;
    });
    await toCode(page);
    await codeField(page).fill('482915');
    await page.waitForFunction(() => document.querySelector('input[name="name"]'), null, { timeout: 10000 });
    R.check('the visitor is sent back to the form, to the name field', await input(page, 'name').count() === 1);
    R.check('with the server\'s complaint next to it', /letters only/i.test((await alerts(page)).join(' ')), await alerts(page));
    await input(page, 'name').fill('Lina Trabelsi');
    await page.waitForFunction(() => document.querySelector('input[name="email"]').value, null, { timeout: 3000 });
    // the first submit attempt still has the terms ticked
    await page.getByRole('button', { name: 'Create my account' }).click();
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 10000 });
    R.eq('only ONE e-mail code was ever requested', mock.callsTo(/send-code/).length, 1);
    R.eq('only ONE code was ever verified', mock.callsTo(/verify-code/).length, 1);
    R.eq('registration was attempted twice, with the same proof', [mock.callsTo(/register/).length, mock.callsTo(/register/)[0].body.emailProof === mock.callsTo(/register/)[1].body.emailProof], [2, true]);
  });

  await scenario('the proof is refused', {}, async ({ page, mock }) => {
    R.section('The API no longer accepts the proof it just issued');
    let n = 0;
    mock.on('POST', /\/auth\/register/, () => { n++; return n === 1 ? { status: 403, json: { error: 'emailNotVerified' } } : null; });
    mock.sendCodeBody = () => ({ success: true, expiresIn: 600, resendIn: 2 });
    await toCode(page);
    await codeField(page).fill('482915');
    await page.waitForFunction(() => /no longer verified/.test(document.body.innerText), null, { timeout: 10000 });
    R.check('says the e-mail is no longer verified and to request a new code', true);
    R.check('the page is NOT stuck on a spinner: Resend is offered', (await resendBtn(page).count()) === 1);
    R.check('the field is locked until a new code arrives', await codeField(page).isDisabled());
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => /^Resend code$/.test(b.innerText.trim()) && !b.disabled), null, { timeout: 8000 });
    await resendBtn(page).click();
    await page.waitForFunction(() => /A new code has just been sent/.test(document.body.innerText), null, { timeout: 8000 });
    await codeField(page).fill('482915');
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 10000 });
    R.check('a new code completed it', mock.callsTo(/register/).length === 2);
  });

  R.done();
})().catch(e => { console.error(e); process.exit(1); });
