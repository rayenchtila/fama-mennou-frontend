// The sign-up code e-mail exactly as routes/auth.js composes it, rendered and screenshotted (desktop width and a phone's).
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { backend } = require('./backend');
const { emailShell, emailCode, EMAIL_SUBTLE, EMAIL_FAINT } = backend('services/emailTemplates.js');
const { OUT } = require('./harness');

const code = '482915';
const html = emailShell({
  preheader: `${code} est votre code de vérification Famamennou. Il expire dans 10 minutes.`,
  eyebrow: 'Code de vérification',
  title: 'Confirmez votre adresse email',
  bodyHtml: `
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${EMAIL_SUBTLE};">Saisissez ce code à usage unique pour continuer :</p>
    ${emailCode(code, { hint: 'Appuyez sur le code pour le sélectionner en entier, copiez-le, puis collez-le dans la fenêtre de vérification.' })}
  `,
  footerHtml: `
    <p style="margin:0 0 8px;font-size:13px;color:${EMAIL_FAINT};">Ce code expire dans 10 minutes et ne fonctionne qu'une seule fois.</p>
    <p style="margin:0;font-size:13px;color:${EMAIL_FAINT};">Famamennou ne vous demandera jamais ce code par téléphone ou par message. Si vous n'avez pas demandé ce code, ignorez cet email.</p>`,
});
const file = path.join(OUT, 'email-code-full.html');
fs.writeFileSync(file, html);

(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, scheme] of [['desktop', { width: 700, height: 760 }, 'light'], ['phone', { width: 390, height: 760 }, 'light'], ['phone-dark', { width: 390, height: 760 }, 'dark']]) {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: scheme, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.route(/^https?:/, r => r.abort());   // the logo is remote; the layout must hold without it too
    await page.goto('file:///' + file.replace(/\\/g, '/'));
    await page.waitForTimeout(300);
    // the code tile is selectable in one tap
    const sel = await page.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^\s*482\s?915\s*$/.test(e.textContent));
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { text: el.textContent.trim(), userSelect: cs.userSelect || cs.webkitUserSelect, fontSize: cs.fontSize, family: cs.fontFamily.slice(0, 60), letterSpacing: cs.letterSpacing };
    });
    console.log(name, JSON.stringify(sel));
    await page.screenshot({ path: path.join(OUT, `email-${name}.png`) });
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
