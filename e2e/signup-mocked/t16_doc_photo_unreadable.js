// Regression check for "This file isn't a valid image." appearing on the e-mail code screen.
//
// The photo of the identity document used to be read only at the very end: after the visitor had left to read
// the e-mail (Gmail, from an in-app browser such as Facebook Lite) and typed the code. By then the file handle
// the picker had returned can be gone (a camera temp file cleaned up, a content:// permission dropped), every
// way of reading it fails, and the visitor was told - in English, whatever their language - that their photo
// "isn't a valid image", with the code already spent.
// The photo is now read and shrunk the moment it is picked, so:
//   1. a file that becomes unreadable AFTER it was picked no longer matters, and
//   2. a file that cannot be read at all is refused right away on the document step, in the visitor's language.
const { launch, createReport, openApp, makePng, OUT } = require('./harness');
const path = require('path');
const fs = require('fs');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const input = (page, name) => page.locator(`${DIALOG} input[name="${name}"]`);
const settle = (page, ms = 500) => page.waitForTimeout(ms);
const gallery = (page) => page.locator(`${DIALOG} input[type=file]:not([capture])`).first();
const tick = (page) => page.locator(`${DIALOG} label:has(input[type=checkbox]) > span[aria-hidden]`).first().click();
const errorTexts = (page) => page.locator(`${DIALOG} [role=alert]`).allInnerTexts();
const CODE_TEXT = 'Your Famamennou code is 482 915. It expires in 10 minutes.';

// A freelancer on the document step, passport chosen (one photo).
async function toPassportStep(page) {
  await page.locator('header').getByRole('button', { name: 'Post a request', exact: true }).first().click();
  await page.waitForSelector(DIALOG, { timeout: 8000 });
  await settle(page);
  await input(page, 'name').fill('Sami Ben Ali');
  await input(page, 'email').fill('sami.dev@example.com');
  await input(page, 'new-password').fill('Secret#123');
  await input(page, 'confirm-password').fill('Secret#123');
  await input(page, 'bday').fill('1996-03-10');
  await page.locator(DIALOG).getByRole('button', { name: 'Male', exact: true }).click();
  await page.locator(`${DIALOG} select[name="region"]`).selectOption({ index: 2 });
  await input(page, 'skills').fill('React, Figma');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('heading', { name: 'Identity document' }).waitFor({ timeout: 5000 });
  await page.locator(`${DIALOG} fieldset label:has(input[value="passport"])`).click();
  await settle(page, 250);
}

// What an app switch does to the picker's handle: the file is gone (or, if the OS will not let it go, changed).
function makeUnreadable(file) {
  try { fs.unlinkSync(file); }
  catch { fs.writeFileSync(file, 'changed'); fs.utimesSync(file, new Date(), new Date(Date.now() + 60000)); }
}

(async () => {
  const R = createReport('Document photo that cannot be read');

  // ── 1. readable when picked, gone by the time the code is typed ────────────────────────────────
  R.section('The photo disappears between choosing it and entering the e-mailed code');
  {
    const env = await launch({ lang: 'en', clipboardText: CODE_TEXT });
    const { page, mock, issues } = env;
    await openApp(page);
    await toPassportStep(page);

    const photo = path.join(OUT, 't16-passport.png');
    fs.writeFileSync(photo, makePng(640, 400, [90, 120, 220]));
    await gallery(page).setInputFiles(photo);
    await page.locator(`${DIALOG} img[src^="blob:"]`).first().waitFor({ timeout: 5000 });
    await tick(page);
    await page.getByRole('button', { name: 'Create my account' }).click();
    await page.getByRole('heading', { name: 'Check your email' }).waitFor({ timeout: 10000 });
    R.check('reached the code screen', true);

    makeUnreadable(photo);                                   // the visitor went to Gmail and came back
    await page.getByRole('button', { name: 'Paste code' }).click();
    await page.waitForFunction(() => /Welcome back|valid image|usable image/i.test(document.body.innerText), null, { timeout: 12000 }).catch(() => {});
    await settle(page, 400);

    const body = await page.locator(DIALOG).innerText();
    R.check('no "isn\'t a valid image" on the code screen', !/valid image/i.test(body), (await errorTexts(page)).join(' | '));
    const reg = mock.callsTo(/\/auth\/register/);
    R.eq('the account was created: one /register', reg.length, 1);
    const f = Buffer.from((reg[0] && reg[0].body.idFront) || '', 'base64');
    R.check('…carrying the photo as a real JPEG, read when it was picked', f[0] === 0xff && f[1] === 0xd8 && f[2] === 0xff && f.length > 500, f.length);
    R.check('the visitor ended on the log-in page', /Welcome back/.test(body), body.slice(0, 200));
    R.eq('page errors', issues, []);
    await env.close();
  }

  // ── 2. a file the browser cannot read at all ───────────────────────────────────────────────────
  R.section('A photo that cannot be read is refused on the document step, not after the code');
  {
    const env = await launch({ lang: 'en' });
    const { page, mock, issues } = env;
    await openApp(page);
    await toPassportStep(page);

    const junk = path.join(OUT, 't16-corrupt.jpg');          // looks like a photo by its name, is not one
    fs.writeFileSync(junk, Buffer.from('this is not a picture '.repeat(60)));
    await gallery(page).setInputFiles(junk);
    await settle(page, 900);
    const err = (await errorTexts(page)).join(' | ');
    R.check('refused right away, with a message in the visitor\'s language', /usable image/i.test(err), err);
    R.check('…not the old hard-coded English sentence', !/valid image\.$/i.test(err.trim()), err);
    R.eq('no preview of it', await page.locator(`${DIALOG} img[src^="blob:"]`).count(), 0);
    R.check('the "document ready" confirmation is not shown', !/document is ready/i.test(await page.locator(DIALOG).innerText()));

    // …and the visitor can simply pick another photo
    const good = path.join(OUT, 't16-good.png');
    fs.writeFileSync(good, makePng(320, 200, [200, 90, 90]));
    await gallery(page).setInputFiles(good);
    await page.locator(`${DIALOG} img[src^="blob:"]`).first().waitFor({ timeout: 5000 });
    await settle(page, 300);
    R.check('a readable photo is then accepted', /document is ready/i.test(await page.locator(DIALOG).innerText()));
    R.eq('…and the earlier message is gone', (await errorTexts(page)).filter(t => /usable image/i.test(t)).length, 0);
    R.eq('nothing was sent to the API meanwhile', mock.callsTo(/send-code|register/).length, 0);
    R.eq('page errors', issues, []);
    await env.close();
  }

  R.done();
})().catch(e => { console.error(e); process.exit(1); });
