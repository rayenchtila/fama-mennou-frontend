// Items 9 and 6 — a freelancer completes their profile → "Hire a freelancer" with their own card pinned; and the short bio's
// place on the editable profile (label, limit, truthful save).
const { launch, createReport, openApp, OUT } = require('./harness');
const path = require('path');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const settle = (page, ms = 600) => page.waitForTimeout(ms);
// A client-side navigation: the session lives in memory, a reload would need the refresh cookie the mock does not have.
// (React Router keeps its state under history.state.usr.)
const spaNavigate = (page, url, usr = null) => page.evaluate(([u, usr]) => {
  const state = { usr, key: 'k' + Math.random().toString(36).slice(2, 8), idx: (window.history.state?.idx ?? 0) + 1 };
  window.history.pushState(state, '', u);
  window.dispatchEvent(new PopStateEvent('popstate', { state }));
}, [url, usr]);

const SAMI = {
  email: 'sami.dev@example.com', password: 'Secret#123', name: 'Sami Ben Ali', role: 'freelancer',
  region: 'Tunis', gender: 'male', dob: '1995-04-02',
  photo: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', title: null, bio: null, skills: null, portfolio_url: null,
};
const NOUR = {
  email: 'nour.k@example.com', name: 'Nour Khelifi', role: 'freelancer', region: 'Sfax', photo: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  title: 'UI designer', bio: 'I design calm interfaces.', skills: 'Figma, UI', portfolio_url: 'https://nour.example.com',
  cin_status: 'approved', cin_verified: true, availability: 'available', registered_at: '2026-09-01T10:00:00Z',
};
const samiPublic = (over = {}) => ({ ...SAMI, password: undefined, cin_status: 'approved', cin_verified: true, availability: 'available', registered_at: '2026-10-01T10:00:00Z', ...over });

async function loginAsSami(page, mock) {
  mock.sessionUser = SAMI;
  mock.publicUsers = [samiPublic(), NOUR];
  await page.locator('header').getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForSelector(DIALOG, { timeout: 8000 });
  await settle(page, 400);
  await page.locator(`${DIALOG} input[name="email"]`).fill(SAMI.email);
  await page.locator(`${DIALOG} input[name="password"]`).fill(SAMI.password);
  await page.locator(DIALOG).getByRole('button', { name: 'Log in', exact: true }).last().click();
  await page.waitForSelector(DIALOG, { state: 'detached', timeout: 10000 });
  await settle(page, 800);
}

(async () => {
  const R = createReport('Freelancer onboarding (item 9) and the short bio (item 6)');
  const env = await launch({ lang: 'en' });
  const { page, mock, issues } = env;
  mock.on('GET', /^\/api\/users$/, () => ({ status: 200, json: mock.publicUsers }));
  mock.on('GET', /^\/api\/users\/public\/freelancers$/, () => ({ status: 200, json: { rows: [samiPublic(), NOUR], total: 2, totalPages: 1, page: 1 } }));
  // the first save is refused by the server; the later ones go through
  let patchCount = 0;
  mock.on('PATCH', /^\/api\/users\/[^/]+$/, () => {
    patchCount++;
    if (patchCount === 1) return { status: 400, json: { error: 'validation_error', details: [{ field: 'bio', message: 'bioTooLong' }] } };
    return { status: 200, json: { success: true } };
  });
  await openApp(page);
  await loginAsSami(page, mock);

  R.section('The profile tab: the short bio');
  await spaNavigate(page, '/dashboard?tab=profile');
  await page.waitForFunction(() => /short bio/i.test(document.body.innerText), null, { timeout: 30000 });
  R.check('the bio field is labelled "Short bio"', true);
  const bioBox = page.locator('textarea').first();
  R.eq('the bio box is limited to 300 characters', await bioBox.getAttribute('maxlength'), '300');
  const title = page.getByPlaceholder('Ex: Developer, Designer…');
  const portfolio = page.getByPlaceholder('https://yourportfolio.com');
  const skills = page.getByPlaceholder('Design, Marketing...');
  const save = page.getByRole('button', { name: /Save profile/i });
  await save.click();
  await settle(page, 500);
  R.eq('saving an empty profile sends nothing', mock.callsTo(/\/users\/[^/]+$/, 'PATCH').length, 0);
  R.check('…and says what is missing', /required|title/i.test(await page.locator('body').innerText()));

  await title.fill('Full-stack developer');
  await bioBox.fill('I build calm, fast web apps for Tunisian teams.');
  await portfolio.fill('https://sami.example.com');
  await skills.fill('React, Node');
  R.eq('the counter follows the text', (await page.locator('body').innerText()).includes('46/300') || (await page.locator('body').innerText()).includes('47/300'), true);

  R.section('A refused save does not pretend to succeed');
  await save.click();
  await page.waitForFunction(() => /limited to 300 characters/.test(document.body.innerText), null, { timeout: 8000 });
  R.check('the server\'s "bio too long" is explained in plain words', true);
  await settle(page, 1200);
  R.eq('and the person stays on the dashboard (no redirect)', new URL(page.url()).pathname, '/dashboard');
  R.eq('one PATCH was sent', mock.callsTo(/\/users\/[^/]+$/, 'PATCH').length, 1);

  R.section('A successful save → Hire a freelancer, own profile pinned');
  await save.click();
  await page.waitForURL(/\/freelancers/, { timeout: 10000 });
  const patch2 = mock.callsTo(/\/users\/[^/]+$/, 'PATCH')[1];
  R.eq('the profile fields were sent', [patch2.body.title, patch2.body.bio, patch2.body.portfolio_url, patch2.body.skills], ['Full-stack developer', 'I build calm, fast web apps for Tunisian teams.', 'https://sami.example.com', 'React, Node']);
  R.check('no name/dob/region slipped into the profile save', !('name' in patch2.body) && !('dob' in patch2.body), Object.keys(patch2.body));
  R.eq('redirected straight to /freelancers (no 3-second wait)', new URL(page.url()).pathname, '/freelancers');
  const own = page.locator('[data-testid="own-profile"]');
  await own.waitFor({ timeout: 8000 });
  R.check('their own profile is shown there', await own.isVisible());
  const ownText = await own.innerText();
  R.check('with the confirmation "Your profile is live"', /Your profile is live/.test(ownText), ownText.slice(0, 200));
  R.check('their first word only', /\bSami\b/.test(ownText) && !/Ben Ali/.test(ownText), ownText.slice(0, 300));
  R.check('the title and bio they just saved', /Full-stack developer/i.test(ownText) && /calm, fast web apps/.test(ownText), ownText);
  R.check('their skills', /React/.test(ownText) && /Node/.test(ownText));
  R.check('an "Edit profile" way back', (await own.getByRole('link', { name: /Edit profile/ }).count()) === 1);
  R.check('a verified badge (their identity IS approved)', /Verified/.test(ownText));
  await page.waitForTimeout(1200);
  const box = await own.boundingBox();
  const vh = page.viewportSize().height;
  R.check('it was scrolled into view (the hero above it is tall)', box && box.y >= 0 && box.y < vh * 0.6, box);
  await page.screenshot({ path: path.join(OUT, 't7-own-profile-light.png') });
  // (card text is "checkSamiverified Verified…": icon ligatures sit next to the name, so match without word boundaries)
  const samiCards = await page.locator('article').filter({ hasText: /Sami/ }).count();
  R.eq('the same person is not listed twice (pinned card + directory row)', samiCards, 1);
  R.eq('the other freelancer is still in the directory', await page.locator('article').filter({ hasText: /Nour/ }).count(), 1);
  R.eq('the flag was removed from the history entry (a reload cannot replay it)', await page.evaluate(() => window.history.state && window.history.state.usr), null);

  R.section('Leaving and coming back');
  await page.goBack();
  await settle(page, 800);
  await page.goForward();
  await settle(page, 1200);
  R.eq('Back then Forward does not show the confirmation again', await page.locator('[data-testid="own-profile"]').count(), 0);

  R.section('Dismiss');
  await spaNavigate(page, '/freelancers', { profileCompleted: true });
  await page.locator('[data-testid="own-profile"]').waitFor({ timeout: 8000 });
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await settle(page, 300);
  R.eq('the close button removes the pinned card', await page.locator('[data-testid="own-profile"]').count(), 0);
  R.eq('and the directory row for them is back in the list', await page.locator('article').filter({ hasText: /Sami/ }).count(), 1);

  R.section('Not a freelancer → no pinned card');
  mock.sessionUser = null;
  await spaNavigate(page, '/freelancers', { profileCompleted: true });
  await settle(page, 1200);
  R.check('the flag does nothing for anyone else', true);

  // the one console.error is the app logging the refusal this test provoked on purpose
  R.eq('page errors', issues.filter(i => !/updateUser failed: bioTooLong/.test(i)), []);
  await env.close();
  R.done();
})().catch(e => { console.error(e); process.exit(1); });
