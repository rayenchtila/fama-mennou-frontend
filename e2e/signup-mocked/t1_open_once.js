// Item 1 — "Sign Up from anywhere opens the registration page directly, only once, no duplicate redirects."
// Every opening path is exercised while a MutationObserver + rAF loop records each distinct (dialogCount, title) the page ever shows.
const { launch, createReport, openApp, BASE } = require('./harness');

const WATCH = `
(function () {
  var log = window.__authLog = [];
  var last = { dialogs: -1, title: null };
  var t0 = performance.now();
  function snap(reason) {
    var dialogs = document.querySelectorAll('[role=dialog][aria-labelledby="auth-title"]').length;
    var el = document.getElementById('auth-title');
    var title = el ? el.textContent : null;
    if (dialogs !== last.dialogs || title !== last.title) {
      log.push({ at: Math.round(performance.now() - t0), dialogs: dialogs, title: title, reason: reason });
      last = { dialogs: dialogs, title: title };
    }
  }
  function start() {
    new MutationObserver(function () { snap('mutation'); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    (function raf() { snap('raf'); requestAnimationFrame(raf); })();
  }
  if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start);
})();`;

const TITLES = {
  en: { login: 'Welcome back', fl: 'Create your freelancer account', cl: 'Create your client account' },
  fr: { login: 'Bon retour parmi nous', fl: 'Créez votre compte freelancer', cl: 'Créez votre compte client' },
  ar: { login: 'مرحبًا بعودتك', fl: 'أنشئ حساب المستقل', cl: 'أنشئ حساب العميل' },
};

// The visitor's header button is labelled per page: "Post a request" on Home, the literal "Sign up" elsewhere.
const LABELS = {
  en: { homeCta: 'Post a request',    signup: 'Sign up',      login: 'Log in' },
  fr: { homeCta: 'Publier un besoin', signup: "S'inscrire",   login: 'Se connecter' },
  ar: { homeCta: 'انشر طلباً',         signup: 'التسجيل',      login: 'تسجيل الدخول' },
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exact = (s) => new RegExp('^\\s*' + escapeRe(s) + '\\s*$');
// The header button holds two spans (full and short label, one hidden by CSS), so match on its accessible name, not its text.
const headerBtn = (page, label) => page.locator('header').getByRole('button', { name: label, exact: true }).first();
const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';

const seen = (log) => log.filter(e => e.dialogs > 0 && e.title).map(e => e.title);
const maxDialogs = (log) => Math.max(0, ...log.map(e => e.dialogs));
const readLog = (page) => page.evaluate(() => window.__authLog);
const resetLog = (page) => page.evaluate(() => { window.__authLog.length = 0; });
const settle = (page, ms = 900) => page.waitForTimeout(ms);
const closeDialog = async (page) => { await page.keyboard.press('Escape'); await page.waitForSelector(DIALOG, { state: 'detached', timeout: 8000 }); };

(async () => {
  const R = createReport('Item 1 — Sign Up opens the registration page directly, once');

  for (const lang of ['en', 'fr', 'ar']) {
    const T = TITLES[lang], L = LABELS[lang];

    // ── Home: the header button ("Post a request" for a visitor) opens the sign-up dialog ──
    R.section(`[${lang}] home, desktop header button "${L.homeCta}"`);
    {
      const env = await launch({ lang, init: WATCH });
      const { page, issues } = env;
      await openApp(page);
      await resetLog(page);
      const btn = headerBtn(page, L.homeCta);
      await btn.waitFor({ state: 'visible', timeout: 20000 });
      const historyBefore = await page.evaluate(() => history.length);
      await btn.click();
      await page.waitForSelector(DIALOG, { timeout: 8000 });
      await settle(page);
      let log = await readLog(page);
      R.eq('only the registration title was ever shown', [...new Set(seen(log))], [T.fl]);
      R.eq('never more than one dialog at a time', maxDialogs(log), 1);
      R.eq('no history entry added (no redirect chain)', await page.evaluate(() => history.length), historyBefore);
      R.eq('URL unchanged', new URL(page.url()).pathname, '/');
      R.eq('exactly one #auth-title element', await page.locator('#auth-title').count(), 1);
      R.eq('exactly one dialog in the DOM', await page.locator(DIALOG).count(), 1);
      R.eq('Sign-up tab is the pressed one', await page.locator(`${DIALOG} [aria-pressed="true"]`).first().innerText(), L.signup === 'S\'inscrire' ? 'Inscription' : lang === 'en' ? 'Sign up' : 'إنشاء حساب');

      // close, re-open: still straight on sign-up, still one dialog
      await closeDialog(page);
      await resetLog(page);
      await btn.click();
      await page.waitForSelector(DIALOG, { timeout: 8000 });
      await settle(page);
      log = await readLog(page);
      R.eq('second opening: only the registration title (no login flash)', [...new Set(seen(log))], [T.fl]);
      R.eq('second opening: one dialog', maxDialogs(log), 1);

      // visit login last, close, then Sign up — the stale-mode bug showed the login form first here
      await closeDialog(page);
      await resetLog(page);
      await headerBtn(page, L.login).click();
      await page.waitForSelector(DIALOG, { timeout: 8000 });
      await settle(page, 600);
      log = await readLog(page);
      R.eq('the Log in button opens the login form', [...new Set(seen(log))], [T.login]);
      await closeDialog(page);
      await resetLog(page);
      await btn.click();
      await page.waitForSelector(DIALOG, { timeout: 8000 });
      await settle(page);
      log = await readLog(page);
      R.eq('after a login visit, Sign up still opens ONLY the registration form', [...new Set(seen(log))], [T.fl]);
      R.eq('…with one dialog', maxDialogs(log), 1);
      R.eq('page errors', issues, []);
      await env.close();
    }

    // ── A page whose header button is literally "Sign up" ──
    R.section(`[${lang}] /about, desktop header button "${L.signup}"`);
    {
      const env = await launch({ lang, init: WATCH });
      const { page, issues } = env;
      await openApp(page, '/about');
      await resetLog(page);
      const btn = headerBtn(page, L.signup);
      await btn.waitFor({ state: 'visible', timeout: 20000 });
      await btn.click();
      await page.waitForSelector(DIALOG, { timeout: 8000 });
      await settle(page);
      const log = await readLog(page);
      R.eq('only the registration title was ever shown', [...new Set(seen(log))], [T.fl]);
      R.eq('one dialog', maxDialogs(log), 1);
      R.eq('page errors', issues, []);
      await env.close();
    }
  }

  R.section('[en] deep links /signup and /login');
  {
    const env = await launch({ lang: 'en', init: WATCH });
    const { page, issues } = env;
    const T = TITLES.en;
    await page.goto(BASE + '/signup', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector(DIALOG, { timeout: 30000 });
    await settle(page, 1200);
    let log = await readLog(page);
    R.eq('/signup: only the registration title', [...new Set(seen(log))], [T.fl]);
    R.eq('/signup: one dialog', maxDialogs(log), 1);
    R.eq('/signup: URL replaced by "/"', new URL(page.url()).pathname, '/');
    const len = await page.evaluate(() => history.length);
    R.check('/signup: replaced, not pushed (history length ≤ 2)', len <= 2, len);
    await closeDialog(page);
    await page.goBack().catch(() => {});
    await settle(page, 800);
    R.eq('back button does not re-open the dialog', await page.locator(DIALOG).count(), 0);

    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector(DIALOG, { timeout: 30000 });
    await settle(page, 1000);
    log = await readLog(page);
    R.eq('/login: only the login title', [...new Set(seen(log))], [T.login]);
    R.eq('/login: URL replaced by "/"', new URL(page.url()).pathname, '/');
    await resetLog(page);
    await page.locator(`${DIALOG} [aria-pressed]`).filter({ hasText: /^\s*Sign up\s*$/ }).first().click();   // switch tab inside the dialog
    await settle(page, 700);
    log = await readLog(page);
    R.eq('switching to Sign up inside the dialog: still ONE dialog', maxDialogs(log), 1);
    R.check('switching shows the registration title', seen(log).includes(T.fl), seen(log));
    R.eq('page errors', issues, []);
    await env.close();
  }

  R.section('[en] phone (390×844): header button and hamburger menu');
  {
    const env = await launch({ lang: 'en', viewport: { width: 390, height: 844 }, init: WATCH });
    const { page, issues } = env;
    const T = TITLES.en;
    await openApp(page, '/about');
    await resetLog(page);
    const direct = headerBtn(page, 'Sign up');
    await direct.waitFor({ state: 'visible', timeout: 20000 });
    await direct.click();
    await page.waitForSelector(DIALOG, { timeout: 8000 });
    await settle(page);
    let log = await readLog(page);
    R.eq('phone header button: only the registration title', [...new Set(seen(log))], [T.fl]);
    R.eq('phone header button: one dialog', maxDialogs(log), 1);
    await closeDialog(page);

    // hamburger → "Sign up"
    const burger = page.locator('header button[aria-label], nav button[aria-label]').filter({ hasText: /^$/ }).last();
    const names = await page.locator('header button, nav button').evaluateAll(els => els.map(e => (e.getAttribute('aria-label') || e.innerText || '').trim()).filter(Boolean));
    const menuBtn = page.locator('header button, nav button').filter({ has: page.locator('[aria-hidden]') }).last();
    const burgerByName = page.getByRole('button', { name: /menu|navigation|open/i }).first();
    const target = (await burgerByName.count()) ? burgerByName : (await burger.count()) ? burger : menuBtn;
    await target.click();
    await page.waitForTimeout(600);
    await resetLog(page);
    const inMenu = page.locator('aside button').filter({ hasText: exact('Sign up') }).first();
    if (!(await inMenu.count())) R.check('menu opened with a Sign up button', false, names);
    else {
      await inMenu.click();
      await page.waitForSelector(DIALOG, { timeout: 8000 });
      await settle(page);
      log = await readLog(page);
      R.eq('hamburger menu button: only the registration title', [...new Set(seen(log))], [T.fl]);
      R.eq('hamburger menu button: one dialog', maxDialogs(log), 1);
      await page.waitForTimeout(400);
      R.eq('the menu closed behind the dialog', await page.locator('aside button').filter({ hasText: exact('Sign up') }).count(), 0);
    }
    R.eq('page errors', issues, []);
    await env.close();
  }

  R.done();
})().catch(e => { console.error(e); process.exit(1); });
