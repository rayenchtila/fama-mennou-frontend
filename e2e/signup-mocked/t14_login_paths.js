// Log-in paths touched by the captcha change: the token travels with the request and is re-armed after it; the API's
// refusals are said; a two-role account picks a role WITHOUT a second captcha (the selection token vouches for it);
// a freelancer whose document is still being reviewed is told so — by first name — and signed out.
const { launch, createReport, openApp } = require('./harness');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const settle = (page, ms = 500) => page.waitForTimeout(ms);
const input = (page, name) => page.locator(`${DIALOG} input[name="${name}"]`);

async function openLogin(page) {
  await page.locator('header').getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForSelector(DIALOG, { timeout: 8000 });
  await settle(page, 500);
}
async function submitLogin(page, email = 'amine@example.com', password = 'Secret#123') {
  await input(page, 'email').fill(email);
  await input(page, 'password').fill(password);
  await page.locator(DIALOG).getByRole('button', { name: 'Log in', exact: true }).last().click();
}
const userRow = (over = {}) => ({ email: 'amine@example.com', name: 'Amine Ben Salah', role: 'client', region: 'Tunis', cin_status: 'approved', cin_verified: true, status_seen: true, registered_at: '2026-10-01T10:00:00Z', ...over });

(async () => {
  const R = createReport('Log-in paths');

  R.section('The token travels with the request and is re-armed after it');
  {
    const env = await launch({ lang: 'en' });
    const { page, mock, issues } = env;
    mock.on('POST', /\/auth\/login$/, () => ({ status: 200, json: { error: 'wrongPassword' } }));
    await openApp(page); await openLogin(page);
    await submitLogin(page);
    await page.waitForFunction(() => /Incorrect password/.test(document.body.innerText), null, { timeout: 8000 });
    R.check('a wrong password is said under the password field', true);
    const resetsAfterFirst = await page.evaluate(() => window.__ts.resets);
    R.check('the single-use token was spent and the widget re-armed', resetsAfterFirst >= 1, resetsAfterFirst);
    await submitLogin(page);
    await settle(page, 900);
    const calls = mock.callsTo(/\/auth\/login$/);
    R.eq('two /login requests', calls.length, 2);
    R.check('each with its own token for "login"', /^stub-token-login-/.test(calls[0].body.captchaToken || '') && calls[0].body.captchaToken !== calls[1].body.captchaToken, calls.map(c => c.body.captchaToken));
    R.eq('page errors', issues.filter(i => !/Failed to load|net::/.test(i)), []);
    await env.close();
  }

  R.section('The API says no');
  for (const [answer, expected, label] of [
    [{ error: 'noAccount' }, /No account found/, 'no account'],
    [{ error: 'invalidCaptcha' }, /security check/i, 'captcha refused'],
    [{ error: 'captchaUnavailable' }, /unavailable/i, 'captcha unavailable'],
    [{ error: 'accountLocked', minutesLeft: 12 }, /12 minutes/, 'account locked'],
    [{ error: 'useGoogleLogin' }, /Google/, 'a Google-only account'],
  ]) {
    const env = await launch({ lang: 'en' });
    env.mock.on('POST', /\/auth\/login$/, () => ({ status: 200, json: answer }));
    await openApp(env.page); await openLogin(env.page); await submitLogin(env.page);
    await env.page.waitForFunction(() => document.querySelector('[role=dialog] [role=alert]'), null, { timeout: 8000 });
    const msg = (await env.page.locator(`${DIALOG} [role=alert]`).allInnerTexts()).join(' ');
    R.check(`${label}: "${msg.slice(0, 70)}"`, expected.test(msg), msg);
    await env.close();
  }

  R.section('An account with two roles');
  {
    const env = await launch({ lang: 'en' });
    const { page, mock } = env;
    let n = 0;
    mock.on('POST', /\/auth\/login$/, (body) => {
      n++;
      if (n === 1) return { status: 200, json: { requiresRoleSelect: true, roles: ['freelancer', 'client'], selectionToken: 'sel-token-1' } };
      return { status: 200, json: { success: true, user: userRow({ role: body.role }), accessToken: 'tok' } };
    });
    await openApp(page); await openLogin(page); await submitLogin(page);
    await page.waitForFunction(() => /freelancer/i.test(document.querySelector('[role=dialog]').innerText) && /client/i.test(document.querySelector('[role=dialog]').innerText), null, { timeout: 8000 });
    await settle(page, 500);
    await page.locator(DIALOG).getByRole('button').filter({ hasText: 'Looking to hire talent' }).click();   // the Client card
    await page.getByText(/Welcome, Amine!/).first().waitFor({ timeout: 10000 });
    const calls = mock.callsTo(/\/auth\/login$/);
    R.eq('two /login requests', calls.length, 2);
    R.check('the second carries the selection token and the chosen role', calls[1].body.selectionToken === 'sel-token-1' && calls[1].body.role === 'client', calls[1].body);
    R.check('…and no second captcha token (the selection token vouches for it)', !calls[1].body.captchaToken, calls[1].body.captchaToken);
    R.check('they are greeted by first name', true);
    await env.close();
  }

  R.section('A freelancer still under review');
  {
    const env = await launch({ lang: 'en' });
    const { page, mock } = env;
    mock.on('POST', /\/auth\/login$/, () => ({ status: 200, json: { success: true, user: userRow({ role: 'freelancer', name: 'Sami Ben Ali', cin_status: 'pending', cin_verified: false }), accessToken: 'tok' } }));
    await openApp(page); await openLogin(page); await submitLogin(page, 'sami@example.com');
    await page.getByRole('heading', { name: /Account created successfully/i }).waitFor({ timeout: 10000 });
    const text = await page.locator(DIALOG).innerText();
    R.check('the "under review" screen greets them by first name', /Hello\s+Sami/.test(text) && !/Ben Ali/.test(text), text.slice(0, 220));
    R.check('and does not say "CIN" (the document may be a passport, a licence or a birth certificate)', !/\bCIN\b/.test(text), text);
    R.eq('they are not left signed in', await page.evaluate(() => localStorage.getItem('fm_user')), null);
    await env.close();
  }

  R.done();
})().catch(e => { console.error(e); process.exit(1); });
