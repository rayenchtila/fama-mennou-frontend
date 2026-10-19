// The admin identity review says which document a freelancer submitted, and shows one photo for one-sided kinds.
const { launch, createReport, openApp, makePng, OUT } = require('./harness');
const path = require('path');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const settle = (page, ms = 800) => page.waitForTimeout(ms);
const png = (rgb) => 'data:image/png;base64,' + makePng(300, 190, rgb).toString('base64');

const ADMIN = { email: 'admin@famamennou.com', password: 'Admin#12345', name: 'Fama Mennou TEAM', role: 'admin', cin_status: 'approved', cin_verified: true, status_seen: true };
const mk = (email, name, type) => ({ email, name, role: 'freelancer', region: 'Tunis', gender: 'female', dob: '1996-03-04', skills: 'Design', bio: 'Hello', cin_status: 'pending', cin_verified: false, id_doc_type: type, registered_at: '2026-10-15T10:00:00Z' });
const PEOPLE = [
  mk('passport.person@example.com', 'Leila Passport Holder', 'passport'),
  mk('licence.person@example.com', 'Omar Licence Holder', 'driving_license'),
  mk('birth.person@example.com', 'Rim Birth Holder', 'birth_certificate'),
  mk('cin.person@example.com', 'Yosr National Holder', 'cin'),
];

(async () => {
  const R = createReport('Admin: the identity review names the document');
  const env = await launch({ lang: 'en', viewport: { width: 1440, height: 1500 } });
  const { page, mock, issues } = env;
  mock.sessionUser = ADMIN;
  mock.publicUsers = [...PEOPLE, { ...ADMIN, password: undefined }];
  mock.on('GET', /^\/api\/users$/, () => ({ status: 200, json: mock.publicUsers }));
  mock.on('GET', /^\/api\/users\/([^/]+)\/cin$/, () => null);   // replaced below (needs the path)
  mock.overrides.shift();
  mock.handleOrig = mock.handle;
  mock.handle = (method, p, body) => {
    const m = /^\/api\/users\/([^/]+)\/cin$/.exec(p);
    if (method === 'GET' && m) {
      const person = PEOPLE.find(x => encodeURIComponent(x.email) === m[1] || x.email === decodeURIComponent(m[1]));
      const two = person && ['cin', 'driving_license'].includes(person.id_doc_type);
      return { status: 200, json: { cin_front: png([90, 120, 220]), cin_back: two ? png([200, 90, 90]) : null, id_doc_type: person ? person.id_doc_type : 'cin' } };
    }
    return mock.handleOrig(method, p, body);
  };
  await openApp(page);
  await page.locator('header').getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForSelector(DIALOG);
  await settle(page, 400);
  await page.locator(`${DIALOG} input[name="email"]`).fill(ADMIN.email);
  await page.locator(`${DIALOG} input[name="password"]`).fill(ADMIN.password);
  await page.locator(DIALOG).getByRole('button', { name: 'Log in', exact: true }).last().click();
  await page.waitForURL(/admin\/dashboard/, { timeout: 15000 });
  await settle(page, 3000);

  R.section('The review cards');
  const body = await page.locator('body').innerText();
  R.check('the admin console still shows the full name (it must match the document)', /Leila Passport Holder/.test(body), body.slice(0, 200));
  const cards = page.locator('div.p-5').filter({ hasText: /Leila Passport Holder/ }).first();
  const cardText = await cards.innerText().catch(() => '');
  R.check('the passport card says "Passport"', /Passport/i.test(cardText), cardText.slice(0, 400));
  const lic = await page.locator('div.p-5').filter({ hasText: /Omar Licence Holder/ }).first().innerText().catch(() => '');
  R.check('the licence card says "Driving licence"', /Driving licen[cs]e/i.test(lic), lic.slice(0, 400));
  R.check('the button reads "View ID document", not "View CIN"', /View ID document/.test(body) && !/View CIN/.test(body));
  await page.screenshot({ path: path.join(OUT, 't10-admin-cards.png') });

  R.section('The photo viewer');
  const open = async (name) => {
    await page.locator('div.p-5').filter({ hasText: name }).first().getByRole('button', { name: /View ID document/ }).click();
    await page.locator('[data-testid="admin-doc-kind"]').waitFor({ timeout: 8000 });
  };
  const close = async () => { await page.locator('div.fixed.inset-0.z-50').first().click({ position: { x: 5, y: 5 } }); await settle(page, 300); };

  await open(/Leila Passport Holder/);
  R.eq('passport: the viewer names the document', (await page.locator('[data-testid="admin-doc-kind"]').innerText()).trim(), 'Passport');
  R.eq('passport: one photo, no front/back toggle', await page.getByRole('button', { name: 'Back side' }).count() + await page.getByRole('button', { name: 'Face arrière' }).count(), 0);
  R.eq('passport: the photo is shown', await page.locator('div.fixed.inset-0.z-50 img').count(), 1);
  await page.screenshot({ path: path.join(OUT, 't10-admin-passport.png') });
  await close();

  await open(/Omar Licence Holder/);
  R.eq('licence: the viewer names the document', (await page.locator('[data-testid="admin-doc-kind"]').innerText()).trim(), 'Driving licence');
  R.eq('licence: a front/back toggle is there', await page.locator('div.fixed.inset-0.z-50').getByRole('button', { name: /Front side|Face avant/ }).count(), 1);
  await page.locator('div.fixed.inset-0.z-50').getByRole('button', { name: /Back side|Face arrière/ }).click();
  await settle(page, 300);
  R.eq('licence: the back photo shows', await page.locator('div.fixed.inset-0.z-50 img').count(), 1);
  await close();

  await open(/Rim Birth Holder/);
  R.eq('birth certificate: named, one photo', [(await page.locator('[data-testid="admin-doc-kind"]').innerText()).trim().startsWith('Birth certificate'), await page.locator('div.fixed.inset-0.z-50 img').count()], [true, 1]);
  await close();

  await open(/Yosr National Holder/);
  R.eq('national ID card: named', (await page.locator('[data-testid="admin-doc-kind"]').innerText()).trim().startsWith('National ID card'), true);

  R.eq('page errors', issues.filter(i => !/Failed to load|net::/.test(i)), []);
  await env.close();
  R.done();
})().catch(e => { console.error(e); process.exit(1); });
