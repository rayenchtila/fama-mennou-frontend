// WCAG AA contrast of every text item on the NEW sign-up screens, in fr / en / ar, light and dark.
const { launch, openApp, samplePng } = require('./harness');
const { collect, pixelRatio } = require('./contrast');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const settle = (page, ms = 600) => page.waitForTimeout(ms);
const L = {
  en: { cta: 'Post a request', client: 'Client', next: 'Continue', create: 'Create my account', male: 'Male', code: 'Verification code' },
  fr: { cta: 'Publier un besoin', client: 'Client', next: 'Continuer', create: 'Créer mon compte', male: 'Homme', code: 'Code de vérification' },
  ar: { cta: 'انشر طلباً', client: 'عميل', next: 'متابعة', create: 'إنشاء حسابي', male: 'ذكر', code: 'رمز التحقق' },
};

async function openSignup(page, lang) {
  await page.locator('header').getByRole('button', { name: L[lang].cta, exact: true }).first().click();
  await page.waitForSelector(DIALOG, { timeout: 8000 });
  await settle(page, 700);
}
const input = (page, name) => page.locator(`${DIALOG} input[name="${name}"]`);
async function fillStep1(page, lang, role) {
  await input(page, 'name').fill('Yasmine Ben Salah');
  await input(page, 'email').fill('yasmine.test@example.com');
  await input(page, 'new-password').fill('Secret#123');
  await input(page, 'confirm-password').fill('Secret#123');
  await page.locator(`${DIALOG} select[name="region"]`).selectOption({ index: 1 });
  if (role === 'freelancer') {
    await input(page, 'bday').fill('1995-04-02');
    await page.locator(DIALOG).getByRole('button', { name: L[lang].male, exact: true }).click();
    await input(page, 'skills').fill('React');
  }
}
const tick = (page) => page.locator(`${DIALOG} label:has(input[type=checkbox]) > span[aria-hidden]`).first().click();

const SCREENS = {
  'signup-step1-freelancer': async (page, lang) => { await openSignup(page, lang); await fillStep1(page, lang, 'freelancer'); await page.getByRole('button', { name: L[lang].next }).click(); await settle(page, 300); await page.getByRole('button', { name: L[lang].next }).count(); },
  'documents': async (page, lang) => {
    await openSignup(page, lang); await fillStep1(page, lang, 'freelancer');
    await page.getByRole('button', { name: L[lang].next }).click(); await settle(page, 900);
    await page.locator(`${DIALOG} fieldset label:has(input[value="driving_license"])`).click(); await settle(page, 300);
    await page.locator(`${DIALOG} input[type=file]:not([capture])`).nth(0).setInputFiles(samplePng('a.png'));
    await settle(page, 600);
  },
  'documents-error': async (page, lang) => {
    await openSignup(page, lang); await fillStep1(page, lang, 'freelancer');
    await page.getByRole('button', { name: L[lang].next }).click(); await settle(page, 900);
    await tick(page);
    await page.getByRole('button', { name: L[lang].create }).click(); await settle(page, 700);
  },
  'code': async (page, lang, mock) => {
    await openSignup(page, lang);
    await page.locator(DIALOG).getByRole('button', { name: L[lang].client, exact: true }).first().click(); await settle(page, 300);
    await fillStep1(page, lang, 'client'); await tick(page);
    await page.getByRole('button', { name: L[lang].create }).click();
    await page.locator(`${DIALOG} input[autocomplete="one-time-code"]`).waitFor({ timeout: 10000 }); await settle(page, 900);
  },
  'code-dev-panel': async (page, lang, mock) => {
    mock.sendCodeBody = () => ({ success: true, expiresIn: 600, resendIn: 45, devCode: '482915' });
    await SCREENS.code(page, lang, mock);
  },
  'code-wrong': async (page, lang, mock) => {
    await SCREENS.code(page, lang, mock);
    await page.locator(`${DIALOG} input[autocomplete="one-time-code"]`).fill('111111');
    await page.waitForSelector(`${DIALOG} [role=alert]`, { timeout: 5000 });
    await settle(page, 1300);   // the wrong digits clear themselves after 0.7 s; audit the settled state, not the transition
  },
  'code-success-glow': async (page, lang, mock) => {
    mock.on('POST', /\/auth\/register/, () => ({ status: 200, json: { success: true } }));
    await SCREENS.code(page, lang, mock);
    mock.on('POST', /\/auth\/register/, () => ({ hang: true }));  // never answers: the screen stays on "creating your account", cells glowing
    await page.locator(`${DIALOG} input[autocomplete="one-time-code"]`).fill('482915'); await settle(page, 900);
  },
  'login-after-signup': async (page, lang, mock) => {
    await SCREENS.code(page, lang, mock);
    await page.locator(`${DIALOG} input[autocomplete="one-time-code"]`).fill('482915');
    await page.locator(`${DIALOG} [data-testid="signup-notice"]`).waitFor({ timeout: 10000 }); await settle(page, 900);
  },
  'captcha-failed': async (page, lang, mock) => {
    await openSignup(page, lang);
    await page.locator(DIALOG).getByRole('button', { name: L[lang].client, exact: true }).first().click(); await settle(page, 300);
    await page.evaluate(() => { window.__tsFail('300030'); }); await settle(page, 800);
  },
};

(async () => {
  let total = 0, bad = 0;
  const only = process.argv[2] ? process.argv[2].split(',') : null;
  for (const lang of ['en', 'fr', 'ar']) {
    for (const theme of ['light', 'dark']) {
      for (const [name, run] of Object.entries(SCREENS)) {
        if (only && !only.includes(name)) continue;
        const env = await launch({ lang, theme, viewport: { width: 1440, height: 1700 } });
        const { page, mock } = env;
        mock.on('POST', /\/auth\/register/, () => ({ status: 200, json: { success: true } }));
        try {
          await openApp(page);
          await run(page, lang, mock);
          const rows = await page.evaluate(collect);
          const fails = [];
          for (const r of rows) {
            if (r.ratio >= r.need) continue;
            const px = await pixelRatio(page, r);
            if (px && px.ratio >= r.need) continue;
            if (r.brand) continue;
            fails.push({ ...r, px });
          }
          total += rows.length; bad += fails.length;
          console.log(`${lang}/${theme}/${name}: ${rows.length} text items, ${fails.length} below AA`);
          for (const f of fails) console.log(`     ${f.px ? f.px.ratio : f.ratio}:1 (need ${f.need}) ${f.size}px "${f.text}" [${f.cls}]${f.px ? ' bg ' + f.px.bg : ''}`);
        } catch (e) {
          bad++;
          console.log(`${lang}/${theme}/${name}: COULD NOT RENDER — ${String(e.message).split('\n')[0]}`);
        }
        await env.close();
      }
    }
  }
  console.log(`TOTAL ${total} text items, ${bad} problems`);
  process.exitCode = bad ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
