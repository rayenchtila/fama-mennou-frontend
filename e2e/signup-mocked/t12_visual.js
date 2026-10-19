// Screenshots of the new screens for a visual review: phone width, Arabic (RTL), dark theme.
const { launch, openApp, samplePng, OUT } = require('./harness');
const path = require('path');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const settle = (page, ms = 700) => page.waitForTimeout(ms);
const L = {
  en: { cta: 'Post a request', ctaShort: 'Post', client: 'Client', next: 'Continue', create: 'Create my account', male: 'Male' },
  ar: { cta: 'انشر طلباً', ctaShort: 'انشر', client: 'عميل', next: 'متابعة', create: 'إنشاء حسابي', male: 'ذكر' },
  fr: { cta: 'Publier un besoin', ctaShort: 'Publier', client: 'Client', next: 'Continuer', create: 'Créer mon compte', male: 'Homme' },
};
const input = (page, name) => page.locator(`${DIALOG} input[name="${name}"]`);
const tick = (page) => page.locator(`${DIALOG} label:has(input[type=checkbox]) > span[aria-hidden]`).first().click();

async function open(page, lang) {
  const narrow = (page.viewportSize() || {}).width < 400;   // the header shows the short label on a narrow phone
  await page.locator('header').getByRole('button', { name: narrow ? L[lang].ctaShort : L[lang].cta, exact: true }).first().click();
  await page.waitForSelector(DIALOG, { timeout: 8000 });
  await settle(page, 700);
}
async function step1(page, lang, role) {
  await input(page, 'name').fill(lang === 'ar' ? 'ياسمين بن صالح' : 'Yasmine Ben Salah');
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

(async () => {
  const shots = [];
  for (const [lang, theme, vp, tag] of [['ar', 'dark', { width: 390, height: 844 }, 'ar-dark-phone'], ['en', 'light', { width: 390, height: 844 }, 'en-light-phone'], ['fr', 'dark', { width: 1024, height: 768 }, 'fr-dark-tablet']]) {
    // documents step
    {
      const env = await launch({ lang, theme, viewport: vp });
      const { page } = env;
      await openApp(page); await open(page, lang); await step1(page, lang, 'freelancer');
      await page.getByRole('button', { name: L[lang].next }).click(); await settle(page, 1000);
      await page.locator(`${DIALOG} fieldset label:has(input[value="passport"])`).click(); await settle(page, 300);
      await page.locator(`${DIALOG} input[type=file]:not([capture])`).nth(0).setInputFiles(samplePng('p.png')); await settle(page, 700);
      const f = path.join(OUT, `v-${tag}-documents.png`); await page.screenshot({ path: f, fullPage: false }); shots.push(f);
      await env.close();
    }
    // code screen (with an error), then the login page after sign-up
    {
      const env = await launch({ lang, theme, viewport: vp });
      const { page, mock } = env;
      await openApp(page); await open(page, lang);
      await page.locator(DIALOG).getByRole('button', { name: L[lang].client, exact: true }).first().click(); await settle(page, 300);
      await step1(page, lang, 'client'); await tick(page);
      await page.getByRole('button', { name: L[lang].create }).click();
      const code = page.locator(`${DIALOG} input[autocomplete="one-time-code"]`);
      await code.waitFor({ timeout: 10000 }); await settle(page, 900);
      await code.pressSequentially('4829', { delay: 40 }); await settle(page, 300);
      let f = path.join(OUT, `v-${tag}-code-typing.png`); await page.screenshot({ path: f }); shots.push(f);
      await code.pressSequentially('11', { delay: 40 });
      await page.waitForSelector(`${DIALOG} [role=alert]`, { timeout: 5000 }); await settle(page, 200);
      f = path.join(OUT, `v-${tag}-code-wrong.png`); await page.screenshot({ path: f }); shots.push(f);
      await page.waitForTimeout(1000);
      await code.fill('482915');
      await page.locator(`${DIALOG} [data-testid="signup-notice"]`).waitFor({ timeout: 10000 }); await settle(page, 800);
      f = path.join(OUT, `v-${tag}-login-after.png`); await page.screenshot({ path: f }); shots.push(f);
      await env.close();
    }
    // the code accepted: the cells glow while the account is being created (the request is held open on purpose)
    {
      const env = await launch({ lang, theme, viewport: vp });
      const { page, mock } = env;
      await openApp(page); await open(page, lang);
      await page.locator(DIALOG).getByRole('button', { name: L[lang].client, exact: true }).first().click(); await settle(page, 300);
      await step1(page, lang, 'client'); await tick(page);
      await page.getByRole('button', { name: L[lang].create }).click();
      const code = page.locator(`${DIALOG} input[autocomplete="one-time-code"]`);
      await code.waitFor({ timeout: 10000 }); await settle(page, 900);
      mock.on('POST', /\/auth\/register/, () => ({ hang: true }));
      await code.fill('482915'); await settle(page, 1100);
      const f = path.join(OUT, `v-${tag}-code-verified.png`); await page.screenshot({ path: f }); shots.push(f);
      await env.close();
    }
  }
  console.log(shots.join('\n'));
})().catch(e => { console.error(e); process.exit(1); });
