// Item 3 — only the FIRST word of a name is displayed across the platform.
// Every person in the mock has a made-up surname that appears nowhere else ("Qwertyson", "Azertyuiop"…). The pages below are
// rendered with those people in them and the visible text, the page title and the structured data are searched for the surnames.
const { launch, createReport, openApp, BASE, OUT } = require('./harness');
const path = require('path');

const DIALOG = '[role=dialog][aria-labelledby="auth-title"]';
const settle = (page, ms = 800) => page.waitForTimeout(ms);
const spaNavigate = (page, url, usr = null) => page.evaluate(([u, usr]) => {
  const state = { usr, key: 'k' + Math.random().toString(36).slice(2, 8), idx: (window.history.state?.idx ?? 0) + 1 };
  window.history.pushState(state, '', u);
  window.dispatchEvent(new PopStateEvent('popstate', { state }));
}, [url, usr]);

const SURNAMES = ['Qwertyson', 'Azertyuiop', 'Plmoknijb', 'Zxcvbnm', 'Poiuytre', 'Lkjhgfd'];
const ZIED  = { email: 'zied@example.com', name: 'Zied Qwertyson Lopez', role: 'freelancer', region: 'Tunis', photo: null, title: 'Backend developer', bio: 'I build APIs.', skills: 'Node, SQL', portfolio_url: 'https://zied.example.com', cin_status: 'approved', cin_verified: true, availability: 'available', registered_at: '2026-09-01T10:00:00Z', agg_rating: 5, agg_review_count: 1 };
const HANA  = { email: 'hana@example.com', password: 'Secret#123', name: 'Hana Azertyuiop Mejri', role: 'client', region: 'Sousse', photo: null, bio: 'We hire.', cin_status: 'approved', cin_verified: true, status_seen: true, registered_at: '2026-09-02T10:00:00Z' };
const KARIM = { email: 'karim@example.com', name: 'Karim Plmoknijb Ayari', role: 'freelancer', region: 'Sfax', photo: null, title: 'Teacher', cin_status: 'approved', cin_verified: true, registered_at: '2026-09-03T10:00:00Z' };
const AMEL  = { email: 'amel@example.com', name: 'Amel Zxcvbnm Ben', role: 'client', region: 'Tunis', cin_status: 'approved', cin_verified: true, registered_at: '2026-09-04T10:00:00Z' };
const COURSE = { id: 3, title: 'Learn React from zero', description: 'A practical course.', category: 'Technology & Dev', full_price: 0, discount_pct: 0, instructor_name: KARIM.name, creator_name: KARIM.name, creator_email: KARIM.email, instructor_photo: null, avg_rating: 5, total_students: 12, created_at: '2026-09-10T10:00:00Z', status: 'approved', level: 'beginner', language: 'fr' };
const PROJECT = { id: 7, title: 'Build a landing page', description: 'Need a quick landing page for a shop.', client_email: HANA.email, client_name: HANA.name, client_region: 'Sousse', status: 'open', budget: '500', period: 'De 1 à 2 semaines', created_at: '2026-10-10T10:00:00Z', keywords: 'react' };

function install(mock) {
  const pub = (u) => ({ ...u, password: undefined });
  mock.publicUsers = [pub(ZIED), pub(HANA), pub(KARIM), pub(AMEL)];
  mock.on('GET', /^\/api\/users$/, () => ({ status: 200, json: mock.publicUsers }));
  mock.on('GET', /^\/api\/users\/public\/freelancers$/, () => ({ status: 200, json: { rows: [pub(ZIED)], total: 1, totalPages: 1, page: 1 } }));
  mock.on('GET', /^\/api\/projects\/browse\/open$/, () => ({ status: 200, json: { rows: [PROJECT], total: 1, totalPages: 1, page: 1 } }));
  mock.on('GET', /^\/api\/projects\/by-id\/7$/, () => ({ status: 200, json: PROJECT }));
  mock.on('GET', /^\/api\/courses$/, () => ({ status: 200, json: [COURSE] }));
  mock.on('GET', /^\/api\/courses\/3$/, () => ({ status: 200, json: COURSE }));
  mock.on('GET', /^\/api\/course-reviews\/course\/3$/, () => ({ status: 200, json: [{ id: 1, reviewer_name: AMEL.name, reviewer_email: AMEL.email, rating: 5, comment: 'Great course.', created_at: '2026-10-01T10:00:00Z' }] }));
  mock.on('GET', /^\/api\/reviews\/zied%40example\.com$/, () => ({ status: 200, json: [{ id: 1, client_name: AMEL.name, client_email: AMEL.email, rating: 5, comment: 'Great work.' }] }));
  mock.on('GET', /^\/api\/client-reviews\/.*$/, () => ({ status: 200, json: [{ id: 1, freelancer_name: ZIED.name, freelancer_email: ZIED.email, rating: 5, comment: 'Clear briefs.' }] }));
}

async function visible(page) {
  return page.evaluate(() => document.body.innerText);
}
function leaks(text) { return SURNAMES.filter(s => text.includes(s)); }
// Waits (up to 12 s) until every expected first name is on the page; the assertions after it report what is missing.
const untilShown = (page, names) => page.waitForFunction((ns) => ns.every(n => document.body.innerText.includes(n)), names, { timeout: 12000 }).catch(() => {});

(async () => {
  const R = createReport('Only the first word of a name is shown');

  // ── visitor pages ──
  {
    const env = await launch({ lang: 'en' });
    const { page, mock, issues } = env;
    install(mock);
    const pages = [
      ['/', ['Zied', 'Karim']],
      ['/freelancers', ['Zied']],
      ['/courses', ['Karim']],
      ['/courses/3', ['Karim']],
      ['/project/7', ['Hana']],
      ['/clients', ['Hana']],
    ];
    for (const [url, expectFirst] of pages) {
      R.section(`Visitor: ${url}`);
      await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForFunction(() => document.getElementById('root').children.length > 0);
      await untilShown(page, expectFirst);
      await settle(page, 600);
      const text = await visible(page);
      const hit = expectFirst.filter(f => text.includes(f));
      R.check(`the page rendered the people it lists (${expectFirst.join(', ')})`, hit.length === expectFirst.length, { missing: expectFirst.filter(f => !text.includes(f)), snippet: text.slice(0, 160) });
      R.eq('no surname anywhere in the visible text', leaks(text), []);
      const head = await page.evaluate(() => ({ title: document.title, meta: [...document.querySelectorAll('meta')].map(m => m.content).join(' | '), ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent).join(' ') }));
      R.eq('…nor in the title, the meta tags or the structured data', leaks(head.title + head.meta + head.ld), []);
    }
    // the Home course card, by itself
    R.section('Home: the course card names its instructor by first word');
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await untilShown(page, ['Karim']);
    await settle(page, 600);
    R.check('"Karim" appears on the course card', (await visible(page)).includes('Karim'));
    R.eq('page errors', issues.filter(i => !/Failed to load|net::/.test(i)), []);
    await env.close();
  }

  // ── a signed-in client ──
  {
    const env = await launch({ lang: 'en' });
    const { page, mock, issues } = env;
    install(mock);
    mock.sessionUser = HANA;
    await openApp(page);
    await page.locator('header').getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForSelector(DIALOG);
    await settle(page, 400);
    await page.locator(`${DIALOG} input[name="email"]`).fill(HANA.email);
    await page.locator(`${DIALOG} input[name="password"]`).fill(HANA.password);
    await page.locator(DIALOG).getByRole('button', { name: 'Log in', exact: true }).last().click();
    await page.waitForSelector(DIALOG, { state: 'detached', timeout: 10000 });
    await settle(page, 1200);

    R.section('Signed in as a client');
    let text = await visible(page);
    R.check('the welcome toast and the header menu call them "Hana"', /Welcome, Hana!/.test(text) && /\bHana\b/.test(text), text.slice(0, 200));
    R.eq('no surname on the home page for them either', leaks(text), []);

    for (const [url, expect] of [['/profile/zied%40example.com', 'Zied'], ['/projects', 'Hana'], ['/freelancers', 'Zied'], ['/dashboard', 'Hana']]) {
      await spaNavigate(page, url);
      await untilShown(page, [expect]);
      await settle(page, 600);
      text = await visible(page);
      R.check(`${url}: rendered (${expect})`, text.includes(expect), text.slice(0, 160));
      R.eq(`${url}: no surname`, leaks(text), []);
      if (url.startsWith('/profile/')) {
        const head = await page.evaluate(() => ({ title: document.title, ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent).join(' '), meta: [...document.querySelectorAll('meta')].map(m => m.content).join(' | ') }));
        R.eq('the public profile\'s title, meta and structured data carry the first word only', leaks(head.title + head.meta + head.ld), []);
        R.check('the profile heading is the first word', /Zied/.test(text));
      }
    }
    // Messages: the other person in each conversation
    mock.on('GET', /^\/api\/messages\/conversations\/hana%40example\.com$/, () => ({ status: 200, json: [
      { other_email: ZIED.email, user_name: ZIED.name, user_photo: null, last_message: 'Hello Hana', last_message_at: '2026-10-16T10:00:00Z', unread_count: 1 },
    ] }));
    await spaNavigate(page, '/messages');
    await untilShown(page, ['Zied']);
    await settle(page, 600);
    text = await visible(page);
    R.check('/messages: the conversation list names the other person', /Zied/.test(text), text.slice(0, 200));
    R.eq('/messages: no surname', leaks(text), []);
    // the chat drawer opened from the navbar bell/chat icon shows the same
    await page.screenshot({ path: path.join(OUT, 't8-client-dashboard.png') });
    R.eq('page errors', issues.filter(i => !/Failed to load|net::/.test(i)), []);
    await env.close();
  }

  R.done();
})().catch(e => { console.error(e); process.exit(1); });
