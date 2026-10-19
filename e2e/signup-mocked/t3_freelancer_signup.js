// Items 3, 4, 5, 6, 7, 8, 2 — a FREELANCER signs up: two-step wizard (profile → identity document),
// date of birth limited to 18–56 counted from the real date, exactly four document kinds, masking explainer,
// code pasted from the e-mail verifies by itself, then the login page.
// The /register payload the BROWSER produced is also run through the REAL backend validators.
const { launch, createReport, openApp, samplePng, OUT } = require('./harness');
const path = require('path');
const fs = require('fs');

const { backend } = require('./backend');
const { schemas } = backend('middleware/validate.js');
const { prepareDocument } = backend('utils/idDocuments.js');
const { validateFullName } = backend('utils/names.js');
const { validateDob } = backend('utils/age.js');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const input = (page, name) => page.locator(`${DIALOG} input[name="${name}"]`);
const settle = (page, ms = 600) => page.waitForTimeout(ms);

// ── independent date arithmetic (does not reuse the app's helpers) ──
const iso = ({ y, m, d }) => `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const tunisToday = () => { const [y, m, d] = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Tunis' }).split('-').map(Number); return { y, m, d }; };
const shiftDays = ({ y, m, d }, n) => { const t = new Date(Date.UTC(y, m - 1, d + n)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const minusYears = ({ y, m, d }, n) => ({ y: y - n, m, d });

async function openFreelancerSignup(page) {
  await page.locator('header').getByRole('button', { name: 'Post a request', exact: true }).first().click();
  await page.waitForSelector(DIALOG, { timeout: 8000 });
  await settle(page, 500);
}
async function fillStep1(page, over = {}) {
  const v = { name: 'Sami Ben Ali', email: 'sami.dev@example.com', password: 'Secret#123', dob: iso(minusYears(tunisToday(), 30)), skills: 'React, Figma', ...over };
  await input(page, 'name').fill(v.name);
  await input(page, 'email').fill(v.email);
  await input(page, 'new-password').fill(v.password);
  await input(page, 'confirm-password').fill(v.password);
  await input(page, 'bday').fill(v.dob);
  await page.locator(DIALOG).getByRole('button', { name: 'Male', exact: true }).click();
  await page.locator(`${DIALOG} select[name="region"]`).selectOption({ index: 2 });
  await input(page, 'skills').fill(v.skills);
  return v;
}
const gallery = (page, i = 0) => page.locator(`${DIALOG} input[type=file]:not([capture])`).nth(i);
const tick = (page) => page.locator(`${DIALOG} label:has(input[type=checkbox]) > span[aria-hidden]`).first().click();
const errorTexts = (page) => page.locator(`${DIALOG} [role=alert]`).allInnerTexts();

(async () => {
  const R = createReport('Freelancer sign-up, end to end');
  const today = tunisToday();
  const OK_MAX = iso(minusYears(today, 18));                         // turns 18 today
  const OK_MIN = iso(shiftDays(minusYears(today, 57), 1));           // turns 57 tomorrow → still 56
  const TOO_YOUNG = iso(shiftDays(minusYears(today, 18), 1));        // turns 18 tomorrow
  const TOO_OLD = iso(minusYears(today, 57));                        // turned 57 today
  console.log(`  (today in Tunis: ${iso(today)}; accepted birth dates ${OK_MIN} … ${OK_MAX})`);

  const env = await launch({ lang: 'en', clipboardText: 'Your Famamennou code is 482 915. It expires in 10 minutes.' });
  const { page, mock, issues } = env;
  await openApp(page);
  await openFreelancerSignup(page);

  R.section('Step 1 — the profile');
  R.check('the role defaults to Freelancer (title says so)', /freelancer account/i.test(await page.locator('#auth-title').innerText()));
  R.eq('stepper shows two steps', await page.locator(`${DIALOG} ol > li`).count(), 2);
  R.eq('one Full name field', await input(page, 'name').count(), 1);
  R.eq('no Short bio field at sign-up', await page.locator(`${DIALOG} textarea, ${DIALOG} input[name="bio"]`).count(), 0);
  const bday = input(page, 'bday');
  R.eq('date picker min = the oldest accepted birth date (56 today)', await bday.getAttribute('min'), OK_MIN);
  R.eq('date picker max = the youngest accepted birth date (18 today)', await bday.getAttribute('max'), OK_MAX);
  R.check('the age rule is stated under the field', /18.*56/.test(await page.locator(DIALOG).innerText()));

  // DOB boundaries, counted from the real date
  const dobError = async (value) => {
    await bday.fill(value);
    await page.getByRole('button', { name: 'Continue' }).click();
    await settle(page, 350);
    const id = await bday.getAttribute('id');
    return page.locator(`#${id}-err`).innerText().catch(() => '');
  };
  await input(page, 'name').fill('Sami Ben Ali');
  await input(page, 'email').fill('sami.dev@example.com');
  await input(page, 'new-password').fill('Secret#123');
  await input(page, 'confirm-password').fill('Secret#123');
  await page.locator(DIALOG).getByRole('button', { name: 'Male', exact: true }).click();
  await page.locator(`${DIALOG} select[name="region"]`).selectOption({ index: 2 });
  await input(page, 'skills').fill('React, Figma');

  const eYoung = await dobError(TOO_YOUNG);
  R.check(`${TOO_YOUNG} (turns 18 tomorrow) is refused as too young`, /at least 18/.test(eYoung), eYoung);
  const eOld = await dobError(TOO_OLD);
  R.check(`${TOO_OLD} (turned 57 today) is refused as too old`, /18 to 56/.test(eOld), eOld);
  const eFuture = await dobError(iso(shiftDays(today, 40)));
  R.check('a future date is refused', /future/i.test(eFuture), eFuture);
  const e1960 = await dobError('1960-01-01');
  R.check('1960-01-01 is refused', /18 to 56/.test(e1960), e1960);
  const e2015 = await dobError('2015-06-01');
  R.check('2015-06-01 is refused', /at least 18/.test(e2015), e2015);
  R.eq('still on step 1 after every refusal', await page.locator(`${DIALOG} ol li button[aria-current="step"]`).count(), 1);
  R.eq('…and nothing was sent', mock.calls.filter(c => /auth\//.test(c.path) && c.method === 'POST' && !/refresh/.test(c.path)).length, 0);

  await bday.fill(OK_MAX);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('heading', { name: 'Identity document' }).waitFor({ timeout: 5000 }).catch(() => {});
  R.check('the youngest accepted date (18 today) lets the person continue', await page.locator(`${DIALOG} fieldset input[type=radio]`).count() === 4, 'no document step');
  // go back and try the oldest accepted date too
  await page.locator(DIALOG).getByRole('button', { name: 'Back', exact: true }).click();
  await settle(page, 500);
  await bday.fill(OK_MIN);
  await page.getByRole('button', { name: 'Continue' }).click();
  await settle(page, 500);
  R.check('the oldest accepted date (56 today) lets the person continue', await page.locator(`${DIALOG} fieldset input[type=radio]`).count() === 4);
  await page.locator(DIALOG).getByRole('button', { name: 'Back', exact: true }).click();
  await settle(page, 500);
  await bday.fill(iso(minusYears(today, 30)));
  await page.getByRole('button', { name: 'Continue' }).click();
  await settle(page, 600);

  R.section('Step 2 — the identity document');
  const kinds = await page.locator(`${DIALOG} fieldset input[type=radio]`).evaluateAll(els => els.map(e => e.value));
  R.eq('exactly four kinds are offered', kinds, ['cin', 'passport', 'driving_license', 'birth_certificate']);
  const text2 = await page.locator(DIALOG).innerText();
  R.check('the four kinds are named in plain words', /ID card/i.test(text2) && /passport/i.test(text2) && /driving licen[cs]e/i.test(text2) && /birth certificate/i.test(text2));
  R.check('the screen says only these four are accepted', /only|exclusively/i.test(text2), text2.slice(0, 300));
  R.check('the screen explains the document NUMBER may be covered', /(mask|cover|hide|blur|redact)/i.test(text2) && /number/i.test(text2));
  R.check('…and what must stay readable (name, birth date, photo)', /name/i.test(text2) && /(date of birth|birth date)/i.test(text2) && /photo/i.test(text2));
  const slots = async () => page.locator(`${DIALOG} input[type=file]:not([capture])`).count();
  const expectSlots = { cin: 2, passport: 1, driving_license: 2, birth_certificate: 1 };
  for (const k of kinds) {
    await page.locator(`${DIALOG} fieldset label:has(input[value="${k}"])`).click();
    await settle(page, 250);
    R.eq(`"${k}" asks for ${expectSlots[k]} photo(s)`, await slots(), expectSlots[k]);
  }

  // Continue with nothing uploaded
  await page.locator(`${DIALOG} fieldset label:has(input[value="passport"])`).click();
  await settle(page, 250);
  await tick(page);
  await page.getByRole('button', { name: 'Create my account' }).click();
  await settle(page, 500);
  const noDoc = (await errorTexts(page)).join(' | ');
  R.check('submitting without the photo is refused with a clear message', /photo|document|upload/i.test(noDoc), noDoc);
  R.eq('…nothing was sent', mock.callsTo(/send-code|register/).length, 0);

  // A file that is not an image
  const txt = path.join(OUT, 'not-an-image.txt');
  fs.writeFileSync(txt, 'hello');
  await gallery(page, 0).setInputFiles(txt);
  await settle(page, 400);
  const bad = (await errorTexts(page)).join(' | ');
  R.check('a text file is refused as a document photo', /image|photo|jpg|png|valid/i.test(bad), bad);
  R.eq('…and no preview appeared', await page.locator(`${DIALOG} img[src^="blob:"]`).count(), 0);

  // switching kind clears the photos
  const png1 = samplePng('doc-a.png', [90, 120, 220]);
  const png2 = samplePng('doc-b.png', [200, 90, 90]);
  await gallery(page, 0).setInputFiles(png1);
  await page.locator(`${DIALOG} img[src^="blob:"]`).first().waitFor({ timeout: 5000 });
  R.eq('a photo shows as a preview', await page.locator(`${DIALOG} img[src^="blob:"]`).count(), 1);
  R.check('the "ready" confirmation appears when every side is in', /(ready|all set|received|added)/i.test(await page.locator(DIALOG).innerText()));
  await page.locator(`${DIALOG} fieldset label:has(input[value="cin"])`).click();
  await settle(page, 300);
  R.eq('changing the kind of document empties the photos', await page.locator(`${DIALOG} img[src^="blob:"]`).count(), 0);

  // Driving licence with both sides, then submit
  await page.locator(`${DIALOG} fieldset label:has(input[value="driving_license"])`).click();
  await settle(page, 250);
  await gallery(page, 0).setInputFiles(png1);
  await settle(page, 400);
  await page.getByRole('button', { name: 'Create my account' }).click();
  await settle(page, 500);
  const oneSide = (await errorTexts(page)).join(' | ');
  R.check('a two-sided document with one side is refused', /photo|document|side|both|upload/i.test(oneSide), oneSide);
  R.eq('…nothing was sent', mock.callsTo(/send-code|register/).length, 0);
  await gallery(page, 1).setInputFiles(png2);
  await settle(page, 600);
  R.eq('two previews', await page.locator(`${DIALOG} img[src^="blob:"]`).count(), 2);
  await page.screenshot({ path: path.join(OUT, 't3-docs-ready.png'), fullPage: false });

  R.section('Send the code, paste it, done');
  await page.getByRole('button', { name: 'Create my account' }).click();
  await page.getByRole('heading', { name: 'Check your email' }).waitFor({ timeout: 10000 });
  const send = mock.callsTo(/\/auth\/send-code/);
  R.eq('one /send-code', send.length, 1);
  R.check('with a Turnstile token for "signup"', /^stub-token-signup-/.test(send[0].body.captchaToken || ''), send[0].body);
  R.eq('role sent', send[0].body.role, 'freelancer');
  R.eq('the document photos were NOT sent before the e-mail was verified', JSON.stringify(send[0].body).includes('idFront'), false);

  await page.getByRole('button', { name: 'Paste code' }).click();
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 12000 });
  R.eq('pasting the e-mail text verified by itself (no button pressed)', mock.callsTo(/\/auth\/verify-code/).length, 1);
  R.eq('the code that was sent is the six digits found in the pasted text', mock.callsTo(/\/auth\/verify-code/)[0].body.code, '482915');
  const reg = mock.callsTo(/\/auth\/register/);
  R.eq('one /register', reg.length, 1);
  const b = reg[0].body;
  R.eq('name', b.name, 'Sami Ben Ali');
  R.eq('role', b.role, 'freelancer');
  R.eq('document kind', b.idDocType, 'driving_license');
  R.eq('dob sent as ISO date', b.dob, iso(minusYears(today, 30)));
  R.eq('gender', b.gender, 'male');
  R.eq('skills', b.skills, 'React, Figma');
  R.eq('e-mail proof attached', b.emailProof, 'proof-sami.dev@example.com');
  R.check('no bio at sign-up', !('bio' in b), Object.keys(b));
  R.check('legacy cin fields are not used', !('cin' in b) && !('cinFront' in b) && !('cinBack' in b), Object.keys(b));
  const sniff = (b64) => Buffer.from(b64 || '', 'base64');
  const f = sniff(b.idFront), k = sniff(b.idBack);
  R.check('front photo is a real JPEG (browser re-encoded it)', f[0] === 0xff && f[1] === 0xd8 && f[2] === 0xff && f.length > 1000, f.length);
  R.check('back photo is a real JPEG', k[0] === 0xff && k[1] === 0xd8 && k[2] === 0xff && k.length > 1000, k.length);

  R.section('The browser payload against the REAL backend rules');
  const joi = schemas.register.validate(b, { abortEarly: false, stripUnknown: true });
  R.check('Joi register schema accepts it', !joi.error, joi.error && joi.error.details.map(d => d.message));
  R.check('full-name rule accepts it', validateFullName(b.name).ok);
  R.check('age rule accepts the date of birth', validateDob(b.dob).ok, validateDob(b.dob));
  const doc = prepareDocument({ type: b.idDocType, front: b.idFront, back: b.idBack }, { required: true });
  R.check('document check (type allow-list + magic bytes + both sides) accepts it', doc.ok, doc);
  const wrongKind = prepareDocument({ type: 'residence_permit', front: b.idFront, back: b.idBack }, { required: true });
  R.eq('…and rejects a fifth, unlisted kind', wrongKind.code, 'invalidDocumentType');

  R.section('Redirect to the login page');
  R.check('login title', /Welcome back/.test(await page.locator(DIALOG).innerText()));
  R.check('notice says the account exists', await page.locator('[data-testid="signup-notice"]').count() === 1);
  R.eq('e-mail prefilled', await input(page, 'email').inputValue(), 'sami.dev@example.com');
  R.eq('no session was started', mock.callsTo(/\/auth\/login/).length, 0);
  R.eq('one dialog', await page.locator(DIALOG).count(), 1);
  await settle(page, 400);
  await page.screenshot({ path: path.join(OUT, 't3-login-after-signup.png') });

  R.eq('page errors', issues, []);
  await env.close();
  R.done();
})().catch(e => { console.error(e); process.exit(1); });
