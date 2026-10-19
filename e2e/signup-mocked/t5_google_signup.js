// Item 2 (Google/Gmail OAuth) + 7 — "Sign up with Google" ends on the LOGIN page, with no session.
const { launch, createReport, openApp, OUT } = require('./harness');
const path = require('path');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const input = (page, name) => page.locator(`${DIALOG} input[name="${name}"]`);
const settle = (page, ms = 500) => page.waitForTimeout(ms);
const tick = (page) => page.locator(`${DIALOG} label:has(input[type=checkbox]) > span[aria-hidden]`).first().click();

async function toGoogleStrip(page, mock) {
  mock.on('POST', /\/auth\/google\/prefill/, () => ({ status: 200, json: { email: 'karim.jlassi@gmail.com', givenName: 'Karim', familyName: 'Jlassi' } }));
  await page.locator('header').getByRole('button', { name: 'Post a request', exact: true }).first().click();
  await page.waitForSelector(DIALOG, { timeout: 8000 });
  await settle(page, 400);
  await page.locator(DIALOG).getByRole('button', { name: 'Client', exact: true }).first().click();
  await settle(page, 300);
  await page.locator(DIALOG).getByRole('button', { name: /Sign up with Google/ }).click();
  await page.waitForFunction(() => /Signed in with Google/.test(document.body.innerText), null, { timeout: 8000 });
}

(async () => {
  const R = createReport('Google sign-up');

  {
    const env = await launch({ lang: 'en' });
    const { page, mock, issues } = env;
    await openApp(page);
    mock.on('POST', /\/auth\/google$/, (body) => body.region
      ? { status: 201, json: { success: true, registered: true, isNewAccount: true } }
      : { status: 400, json: { error: 'missingRegion' } });
    await toGoogleStrip(page, mock);

    R.section('The Google form');
    R.check('the verified Gmail address is shown', (await page.locator(DIALOG).innerText()).includes('karim.jlassi@gmail.com'));
    R.eq('no name/e-mail/password fields (they come from Google)', await page.locator(`${DIALOG} input[name="name"], ${DIALOG} input[name="email"], ${DIALOG} input[name="new-password"]`).count(), 0);
    R.eq('no date-of-birth or document fields for a client', await page.locator(`${DIALOG} input[name="bday"], ${DIALOG} input[type=file]`).count(), 0);
    R.eq('no bio field', await page.locator(`${DIALOG} textarea`).count(), 0);
    await page.waitForFunction(() => window.__ts.renders.some(r => r.action === 'google_signup'), null, { timeout: 8000 });
    R.check('the Turnstile widget now belongs to the "google_signup" action', true);

    R.section('Submit without region/terms');
    await page.getByRole('button', { name: 'Create my account' }).click();
    await settle(page, 500);
    R.check('region and terms are required', (await page.locator(`${DIALOG} [role=alert]`).allInnerTexts()).length >= 2);
    R.eq('…and nothing was sent', mock.callsTo(/\/auth\/google$/).length, 0);

    R.section('Submit');
    await page.locator(`${DIALOG} select[name="region"]`).selectOption({ index: 3 });
    await tick(page);
    await page.getByRole('button', { name: 'Create my account' }).click();
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 10000 });
    const g = mock.callsTo(/\/auth\/google$/);
    R.eq('one /auth/google request', g.length, 1);
    R.eq('it carries the Google access token', g[0].body.accessToken, 'g-access-token');
    R.check('it carries a region', !!g[0].body.region);
    R.check('and a Turnstile token for "google_signup"', /^stub-token-google_signup-/.test(g[0].body.captchaToken || ''), g[0].body.captchaToken);
    R.check('the page never sends an e-mail or name of its own for Google (the server re-derives them)', !('email' in g[0].body) && !('name' in g[0].body), Object.keys(g[0].body));

    R.section('Redirect to login');
    R.check('the login title is shown', /Welcome back/.test(await page.locator(DIALOG).innerText()));
    const notice = await page.locator('[data-testid="signup-notice"]').innerText();
    R.check('the notice points at Google sign-in', /google/i.test(notice), notice);
    R.eq('the Gmail address is already filled in', await input(page, 'email').inputValue(), 'karim.jlassi@gmail.com');
    R.eq('no session was started (no /auth/login, no token stored)', [mock.callsTo(/\/auth\/login/).length, await page.evaluate(() => Object.keys(localStorage).filter(k => /token|session|user/i.test(k) && k !== 'fm_device_id'))], [0, []]);
    R.eq('one dialog', await page.locator(DIALOG).count(), 1);
    await settle(page, 500);
    await page.screenshot({ path: path.join(OUT, 't5-google-login.png') });
    R.eq('page errors', issues, []);
    await env.close();
  }

  {
    R.section('Google account outside the age range');
    const env = await launch({ lang: 'en' });
    const { page, mock } = env;
    await openApp(page);
    mock.on('POST', /\/auth\/google$/, () => ({ status: 403, json: { error: 'ageNotAllowed' } }));
    await toGoogleStrip(page, mock);
    await page.locator(`${DIALOG} select[name="region"]`).selectOption({ index: 3 });
    await tick(page);
    await page.getByRole('button', { name: 'Create my account' }).click();
    await page.waitForFunction(() => /18/.test(document.body.innerText) && /56/.test(document.body.innerText), null, { timeout: 8000 });
    const msg = (await page.locator(`${DIALOG} [role=alert]`).allInnerTexts()).join(' ');
    R.check('"ageNotAllowed" is explained (18–56), and the person is not logged in', /18/.test(msg) && /56/.test(msg), msg);
    R.eq('still on the sign-up form', await page.locator(`${DIALOG} select[name="region"]`).count(), 1);
    await env.close();
  }

  {
    R.section('Google sign-in with an existing account keeps working (login tab)');
    const env = await launch({ lang: 'en' });
    const { page, mock } = env;
    await openApp(page);
    mock.on('POST', /\/auth\/google$/, () => ({ status: 200, json: { user: { email: 'karim.jlassi@gmail.com', name: 'Karim Jlassi', role: 'client', cin_status: 'approved', cin_verified: true, status_seen: true }, accessToken: 'tok' } }));
    await page.locator('header').getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForSelector(DIALOG, { timeout: 8000 });
    await settle(page, 400);
    await page.locator(DIALOG).getByRole('button', { name: /Continue with Google/ }).click();
    await page.waitForSelector(DIALOG, { state: 'detached', timeout: 10000 });
    await page.getByText(/Welcome, Karim!/).first().waitFor({ timeout: 8000 });
    R.check('login with Google logs in and greets with the FIRST word only', true);
    await env.close();
  }

  R.done();
})().catch(e => { console.error(e); process.exit(1); });
