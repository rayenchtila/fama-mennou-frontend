// Item 7 — the REAL Cloudflare Turnstile script and widget (Cloudflare's published test site key), and the REAL backend
// verification function talking to Cloudflare's real siteverify endpoint (Cloudflare's published test secret keys).
// Nothing here touches Famamennou's production keys, API or database.
const { launch, createReport, openApp, OUT } = require('./harness');
const path = require('path');
const { backend } = require('./backend');
const { verifyTurnstile } = backend('services/turnstile.js');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const input = (page, name) => page.locator(`${DIALOG} input[name="${name}"]`);
const ALWAYS_PASS_SECRET = '1x0000000000000000000000000000000AA';
const ALWAYS_FAIL_SECRET = '2x0000000000000000000000000000000AA';

(async () => {
  const R = createReport('Cloudflare Turnstile — real widget, real siteverify');
  const env = await launch({ lang: 'en', turnstile: 'real' });
  const { page, mock, issues } = env;
  const scriptRequests = [];
  page.on('request', r => { if (/challenges\.cloudflare\.com/.test(r.url())) scriptRequests.push(r.url().replace(/\?.*/, '')); });

  await openApp(page);
  await page.locator('header').getByRole('button', { name: 'Post a request', exact: true }).first().click();
  await page.waitForSelector(DIALOG, { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.locator(DIALOG).getByRole('button', { name: 'Client', exact: true }).first().click();
  await page.waitForTimeout(300);

  R.section('Real widget');
  await page.waitForFunction(() => !!window.turnstile, null, { timeout: 30000 });
  R.check('the script is loaded from Cloudflare (challenges.cloudflare.com)', scriptRequests.some(u => /turnstile\/v0\/api\.js/.test(u)), scriptRequests);
  await page.waitForSelector('input[name="cf-turnstile-response"]', { state: 'attached', timeout: 30000 });
  R.check('Cloudflare attached its response field to the page', true);
  // Cloudflare draws its box inside a closed shadow root, so what can be measured is the element it injects into ours.
  await page.waitForFunction(() => { const c = document.querySelector('[data-turnstile-action="signup"] > div'); if (!c) return false; const r = c.getBoundingClientRect(); return r.height >= 50 && r.width >= 250; }, null, { timeout: 30000 });
  R.check('the widget is a visible box on the form (it turns to "Success" by itself; no tick is asked for)', true);
  await page.waitForFunction(() => { const i = document.querySelector('input[name="cf-turnstile-response"]'); return i && i.value && i.value.length > 10; }, null, { timeout: 40000 });
  R.check('the check completed on its own and produced a token', true);

  await input(page, 'name').fill('Yasmine Gharbi');
  await input(page, 'email').fill('yasmine.test@example.com');
  await input(page, 'new-password').fill('Secret#123');
  await input(page, 'confirm-password').fill('Secret#123');
  await page.locator(`${DIALOG} select[name="region"]`).selectOption({ index: 1 });
  await page.locator(`${DIALOG} label:has(input[type=checkbox]) > span[aria-hidden]`).first().click();
  await page.getByRole('button', { name: 'Create my account' }).click();
  await page.getByRole('heading', { name: 'Check your email' }).waitFor({ timeout: 40000 });

  const send = mock.callsTo(/\/auth\/send-code/);
  R.eq('one /send-code', send.length, 1);
  const token = send[0].body.captchaToken;
  R.check('it carries a token issued by the real widget', typeof token === 'string' && token.length > 10 && !/^stub-/.test(token), String(token).slice(0, 40));
  console.log(`    (token from the real widget: ${String(token).slice(0, 24)}…, ${String(token).length} chars)`);

  R.section('The backend checks it with Cloudflare');
  const pass = await verifyTurnstile(token, { action: 'signup', env: { TURNSTILE_SECRET_KEY: ALWAYS_PASS_SECRET, NODE_ENV: 'production' } });
  R.eq('real siteverify, always-pass secret → accepted', pass.ok, true);
  const fail = await verifyTurnstile(token, { action: 'signup', env: { TURNSTILE_SECRET_KEY: ALWAYS_FAIL_SECRET, NODE_ENV: 'production' } });
  R.eq('real siteverify, always-fail secret → refused ("rejected")', [fail.ok, fail.reason], [false, 'rejected']);
  const none = await verifyTurnstile('', { action: 'signup', env: { TURNSTILE_SECRET_KEY: ALWAYS_PASS_SECRET, NODE_ENV: 'production' } });
  R.eq('an empty token → refused before any network call', [none.ok, none.reason], [false, 'missingToken']);
  const noSecret = await verifyTurnstile(token, { action: 'signup', env: { NODE_ENV: 'production' } });
  R.eq('production with no secret configured → refused (fail closed)', [noSecret.ok, noSecret.reason], [false, 'notConfigured']);

  await page.screenshot({ path: path.join(OUT, 't6-real-turnstile.png') });
  R.eq('page errors', issues.filter(i => !/cloudflare|turnstile/i.test(i) || /pageerror/.test(i)), []);
  if (issues.length) console.log('    (console messages mentioning Cloudflare/Turnstile:', issues.filter(i => /cloudflare|turnstile/i.test(i)), ')');
  await env.close();
  R.done();
})().catch(e => { console.error(e); process.exit(1); });
