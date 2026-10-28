// The admin dashboard's notification bell — the red number, the refresh on click, the live arrival.
//
// Reproduces what the admin saw on the live site: someone signs up, and the bell stays empty. Two things were wrong:
//   • the page's first GET /notifications goes out before the access token is back, and the API answers a request with
//     no token with an EMPTY LIST and a 200 — so the interceptor (it only retries 401/403) never asks again, and the
//     list stayed empty until the 5-minute poll;
//   • nothing told the open dashboard about a new notification, and clicking the bell did not refresh anything.
//
// The API is the in-memory mock; /notifications answers like the real softAuth route (no token → [] with a 200), and the
// refresh answer is delayed so the race is real. A real socket.io server stands in for the API's live push.
const path = require('path');
const http = require('http');
const { launch, createReport, openApp, BASE, API } = require('./harness');

const BACKEND_DIR = process.env.BACKEND_DIR || path.resolve(__dirname, '..', '..', '..', 'rayen-buisness BACKEND');
const { Server } = require(path.join(BACKEND_DIR, 'node_modules', 'socket.io'));

const ADMIN_EMAIL = 'admin@famamennou.com';
const TOKEN = 'admin-token';
const BELL  = 'button:has(path[d^="M15 17h5l-1.405"])';
const BADGE = `${BELL} > span.bg-rose-500`;

const ago = (s) => new Date(Date.now() - s * 1000).toISOString();
const clientRow = (id, name, extra = {}) => ({
  id, type: 'admin', kind: 'new_user', title: 'New Client Registered', message: `${name} joined as client`,
  email: `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`, name, read: false, created_at: ago(900 - id * 60),
  link: '/admin/dashboard?tab=allusers', ...extra,
});

(async () => {
  const R = createReport('Admin notification bell');

  // ── the API's live push: a real socket.io server on the address the dev server was told to use ──
  const httpServer = http.createServer((req, res) => { res.writeHead(404); res.end(); });
  const io = new Server(httpServer, { cors: { origin: BASE, credentials: true } });
  io.on('connection', (socket) => {
    // like the real server: the room is joined from a valid token, given at connect or announced afterwards
    if (socket.handshake.auth?.token === TOKEN) socket.join(ADMIN_EMAIL);
    socket.on('authenticate', ({ token } = {}) => { if (token === TOKEN) socket.join(ADMIN_EMAIL); });
  });
  await new Promise((resolve, reject) => { httpServer.once('error', reject); httpServer.listen(4010, resolve); });

  const store = { rows: [clientRow(1, 'Old Client', { read: true }), clientRow(2, 'Ahmed Ben Salah', { message: 'Ahmed Ben Salah joined as freelancer (document: cin)', title: 'New User Registered' }), clientRow(3, 'Sami Trabelsi')], failPatch: false };
  const calls = [];                                    // what the page asked the API: { method, path, auth }
  const push = (r) => { store.rows.push(r); io.to(ADMIN_EMAIL).emit('new_notification', r); };

  const env = await launch({
    lang: 'en',
    init: `localStorage.setItem('fm_user', JSON.stringify({ email: '${ADMIN_EMAIL}', name: 'Admin', role: 'admin', isAdmin: true, cinStatus: 'approved', cinVerified: true, statusSeen: true }));`,
  });
  const { page, issues } = env;

  const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
  const json = (route, body, status = 200) => route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const note = (req) => calls.push({ method: req.method(), path: new URL(req.url()).pathname, auth: req.headers()['authorization'] || null });
  const asks = (method, re) => calls.filter(c => c.method === method && re.test(c.path));

  await page.route(`${API}/api/auth/refresh`, async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fallback();
    await new Promise(r => setTimeout(r, 800));        // the access token comes back a moment AFTER the page started
    return json(route, { accessToken: TOKEN });
  });
  await page.route(`${API}/api/notifications`, async (route) => {
    const req = route.request();
    if (req.method() !== 'GET') return route.fallback();
    note(req);
    const authed = req.headers()['authorization'] === `Bearer ${TOKEN}`;
    return json(route, authed ? [...store.rows].sort((a, b) => b.id - a.id) : []);   // no token → [] and a 200, like the real softAuth
  });
  await page.route(`${API}/api/notifications/admin/read-all`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fallback();
    note(req);
    if (req.headers()['authorization'] !== `Bearer ${TOKEN}`) return json(route, { error: 'unauthorized' }, 401);
    if (store.failPatch) return json(route, { error: 'internal_error' }, 500);
    store.rows.forEach(r => { r.read = true; });
    return json(route, { success: true });
  });

  const badgeText = async () => (await page.locator(BADGE).count()) ? (await page.locator(BADGE).first().innerText()).trim() : null;
  const waitBadge = async (text, ms = 6000) => { try { await page.waitForFunction(([sel, t]) => { const e = document.querySelector(sel); return t === null ? !e : !!e && e.textContent.trim() === t; }, [BADGE, text], { timeout: ms }); } catch { /* reported by the check that follows */ } };
  const freshFlags = async () => Object.fromEntries(await page.$$eval('[data-notif-id]', els => els.map(e => [e.getAttribute('data-notif-id'), e.getAttribute('data-fresh') === 'true'])));
  const panelText = async () => (await page.locator('[data-notif-id]').allInnerTexts()).join('\n');

  // ═══ 1. opening the dashboard: the token is late, the list must still fill ═══
  R.section('1. Opening the dashboard');
  await openApp(page, '/admin/dashboard');
  await waitBadge('2');
  const first = calls.find(c => c.method === 'GET' && c.path === '/api/notifications');
  R.check('(the race is real) the page\'s first notification request went out with no token', first && first.auth === null, first);
  R.check('…and was asked again once the token was back', asks('GET', /^\/api\/notifications$/).some(c => c.auth === `Bearer ${TOKEN}`), calls);
  R.eq('the bell shows a number: the 2 unread notifications', await badgeText(), '2');
  const color = await page.locator(BADGE).first().evaluate(e => getComputedStyle(e).backgroundColor).catch(() => '');
  const [r, g, b] = (color.match(/\d+/g) || []).map(Number);
  R.check('…in red', r > 200 && g < 110 && b < 130, color);

  // ═══ 2. a sign-up while the dashboard is open ═══
  R.section('2. A client signs up while the dashboard is open');
  await page.waitForTimeout(400);
  R.eq('the dashboard\'s page is in the admin\'s live room', (await io.in(ADMIN_EMAIL).fetchSockets()).length >= 1, true);
  push(clientRow(4, 'Karim Jlassi'));
  await waitBadge('3');
  R.eq('the number goes up by itself — no refresh, no click', await badgeText(), '3');

  // ═══ 3. the click ═══
  R.section('3. Clicking the bell');
  const getsBefore = asks('GET', /^\/api\/notifications$/).length;
  await page.locator(BELL).first().click();
  await waitBadge(null);
  await page.waitForSelector('[data-notif-id]', { timeout: 5000 }).catch(() => {});
  R.check('it asked the API for the latest list', asks('GET', /^\/api\/notifications$/).length > getsBefore);
  R.eq('it marked everything read with ONE request', asks('PATCH', /^\/api\/notifications\/admin\/read-all$/).length, 1);
  R.eq('the number starts again from 0 (no red badge left)', await badgeText(), null);
  const text = await panelText();
  R.check('the panel lists the new client by full name', /Karim Jlassi joined as client/.test(text), text);
  R.check('…and the one before him', /Sami Trabelsi joined as client/.test(text));
  R.eq('rows that were new stay highlighted while the panel is open; the old one is not', await freshFlags(), { 4: true, 3: true, 2: true, 1: false });

  // ═══ 4. closing and opening again ═══
  R.section('4. Close, then open again');
  await page.locator(BELL).first().click();
  await page.waitForTimeout(300);
  R.eq('a second click closes the panel', await page.locator('[data-notif-id]').count(), 0);
  const patchesBefore = asks('PATCH', /read-all$/).length;
  await page.locator(BELL).first().click();
  await page.waitForSelector('[data-notif-id]', { timeout: 5000 }).catch(() => {});
  R.eq('opened again: nothing is new any more', await freshFlags(), { 4: false, 3: false, 2: false, 1: false });
  R.eq('…and nothing is marked read a second time', asks('PATCH', /read-all$/).length, patchesBefore);
  await page.locator(BELL).first().click();
  await page.waitForTimeout(300);

  // ═══ 5. the next sign-up, with the panel closed ═══
  R.section('5. Another sign-up, panel closed');
  push(clientRow(5, 'Mariem Ben Ali'));
  await waitBadge('1');
  R.eq('the number is 1', await badgeText(), '1');
  await page.locator(BELL).first().click();
  await waitBadge(null);
  R.eq('click: back to 0', await badgeText(), null);
  R.check('and the newcomer is in the list', /Mariem Ben Ali joined as client/.test(await panelText()));
  await page.locator(BELL).first().click();
  await page.waitForTimeout(300);

  // ═══ 6. the server refuses to mark them read ═══
  R.section('6. If the API refuses to mark them read');
  store.failPatch = true;
  push(clientRow(6, 'Hedi Mansour'));
  await waitBadge('1');
  await page.locator(BELL).first().click();
  await page.waitForSelector('[data-notif-id]', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(600);
  R.eq('the number is NOT cleared (it would be a lie): still 1', await badgeText(), '1');
  store.failPatch = false;

  // ═══ 7. the page itself stayed healthy ═══
  R.section('7. Health');
  const mine = issues.filter(i => /notif|fetchNotifications|isFreshNotif|toggleNotifPanel|newNotifIds/i.test(i));
  R.eq('no error from the notification code', mine, []);
  if (issues.length) console.log(`  (other messages from the page, for information: ${issues.length})\n    ${issues.slice(0, 6).map(i => i.slice(0, 160)).join('\n    ')}`);

  await env.close();
  await io.close();
  R.done();
})().catch((e) => { console.error('COULD NOT RUN:', e); process.exit(1); });
