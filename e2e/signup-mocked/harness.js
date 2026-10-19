// Shared Playwright harness for the sign-up work. Nothing here can reach production:
//   • the dev server under test is started with REACT_APP_API_URL=http://localhost:4010/api (nothing listens there);
//   • every request to that origin is answered by the mock backend below;
//   • Cloudflare Turnstile and Google sign-in scripts are replaced by stubs (or, in one script, the real Turnstile with Cloudflare's test key);
//   • trackers and any production host are aborted.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://localhost:3200';
const API = 'http://localhost:4010';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

// ── a real PNG (the browser decodes it, shrinks it, and sends it on as JPEG) ───────────────────
function crc32(buf) { let c, crc = ~0; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function makePng(w = 320, h = 200, rgb = [90, 120, 220]) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { const o = y * (w * 3 + 1); raw[o] = 0; for (let x = 0; x < w; x++) { const i = o + 1 + x * 3; const shade = ((x ^ y) & 31) * 2; raw[i] = rgb[0] + shade; raw[i + 1] = rgb[1]; raw[i + 2] = rgb[2] - shade; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const samplePng = (name = 'doc.png', rgb) => { const p = path.join(OUT, name); fs.writeFileSync(p, makePng(320, 200, rgb)); return p; };

// ── the mock backend ────────────────────────────────────────────────────────────────────────────
function makeMock() {
  const mock = {
    calls: [],                         // every API request: { method, path, body, headers }
    users: [],                         // accounts created through /auth/register: { email, password, name, role, ... }
    expectedCode: '482915',
    attempts: 0,
    maxAttempts: 5,
    sendCodeBody: () => ({ success: true, expiresIn: 600, resendIn: 45 }),
    overrides: [],                     // [{ method, re, fn }] — first match wins
    publicUsers: [],
    freelancers: [],
    sessionUser: null,
  };
  mock.on = (method, re, fn) => mock.overrides.unshift({ method, re, fn });
  mock.callsTo = (re, method) => mock.calls.filter(c => re.test(c.path) && (!method || c.method === method));
  mock.reset = () => { mock.calls.length = 0; mock.users.length = 0; mock.attempts = 0; mock.overrides.length = 0; mock.sendCodeBody = () => ({ success: true, expiresIn: 600, resendIn: 45 }); mock.expectedCode = '482915'; mock.sessionUser = null; };

  mock.handle = (method, p, body) => {
    for (const o of mock.overrides) if ((!o.method || o.method === method) && o.re.test(p)) { const r = o.fn(body, p); if (r) return r; }
    const J = (json, status = 200) => ({ status, json });
    if (method === 'POST' && p === '/api/auth/refresh') return J({ error: 'no_refresh_token' }, 401);
    if (method === 'POST' && p === '/api/auth/send-code') return J(mock.sendCodeBody(body), (mock.sendCodeBody(body).error ? 429 : 200));
    if (method === 'POST' && p === '/api/auth/verify-code') {
      if (mock.attempts >= mock.maxAttempts) return J({ error: 'tooManyAttempts', attemptsLeft: 0 }, 429);
      mock.attempts++;
      if (body.code === mock.expectedCode) return J({ success: true, emailProof: `proof-${body.email}` });
      const left = mock.maxAttempts - mock.attempts;
      return left <= 0 ? J({ error: 'tooManyAttempts', attemptsLeft: 0 }, 429) : J({ error: 'wrongCode', attemptsLeft: left }, 400);
    }
    if (method === 'POST' && p === '/api/auth/register') {
      if (body.emailProof !== `proof-${body.email}`) return J({ error: 'emailNotVerified' }, 403);
      if (mock.users.some(u => u.email === body.email && u.role === body.role)) return J({ error: 'emailTaken' }, 409);
      mock.users.push({ ...body });
      return J({ success: true, dev: false });
    }
    if (method === 'POST' && p === '/api/auth/login') {
      const u = mock.users.find(x => x.email === body.email && x.password === body.password) || (mock.sessionUser && mock.sessionUser.email === body.email ? mock.sessionUser : null);
      if (!u) return J({ error: 'wrongPassword' });
      const user = { email: u.email, name: u.name, role: u.role, dob: u.dob, region: u.region, gender: u.gender, photo: u.photo || null, skills: u.skills || null, bio: u.bio || null,
        portfolio_url: u.portfolio_url || null, title: u.title || null, cin_verified: true, cin_status: 'approved', status_seen: true, registered_at: new Date().toISOString() };
      return J({ success: true, user, accessToken: 'test-access-token' });
    }
    if (method === 'GET' && p === '/api/users/public') return J(mock.publicUsers);
    if (method === 'GET' && p.startsWith('/api/users/public/freelancers/stats')) return J({ verified_freelancers: mock.freelancers.length, regions_covered: 3, reviews_received: 0 });
    if (method === 'GET' && p.startsWith('/api/users/public/freelancers')) return J({ rows: mock.freelancers, total: mock.freelancers.length, totalPages: 1, page: 1 });
    if (method === 'GET' && p === '/api/notifications') return J([]);
    if (method === 'GET') return J([]);
    return J({ success: true });
  };
  return mock;
}

// ── the Turnstile stub: records how the widget was rendered, answers like an invisible check ───────────
const TURNSTILE_STUB = `
(function () {
  var n = 0, widgets = {};
  var log = window.__ts = { renders: [], resets: 0, removes: 0, tokens: [], widgets: widgets };
  window.turnstile = {
    render: function (el, opts) {
      var id = 'w' + (++n);
      widgets[id] = { el: el, opts: opts };
      log.renders.push({ id: id, action: opts.action, theme: opts.theme, language: opts.language, appearance: opts.appearance, size: opts.size, sitekey: opts.sitekey });
      var issue = function () { var t = 'stub-token-' + opts.action + '-' + (++log.tokens.length); setTimeout(function () { if (widgets[id] && !window.__tsHold) opts.callback(t); }, 60); };
      widgets[id].issue = issue; issue();
      return id;
    },
    reset: function (id) { log.resets++; if (widgets[id]) widgets[id].issue(); },
    remove: function (id) { log.removes++; delete widgets[id]; },
  };
  window.__tsFail = function (code) { Object.keys(widgets).forEach(function (id) { widgets[id].opts['error-callback'](code || '300030'); }); };
})();`;

const GSI_STUB = `
(function () {
  window.google = { accounts: { oauth2: {
    initTokenClient: function (cfg) { return { requestAccessToken: function () { setTimeout(function () { cfg.callback({ access_token: 'g-access-token' }); }, 30); } }; },
    hasGrantedAnyScope: function () { return false; }, revoke: function () {},
  }, id: { initialize: function () {}, renderButton: function () {}, prompt: function () {}, cancel: function () {} } } };
})();`;

async function launch(opts = {}) {
  const {
    theme = 'light', lang = 'fr', viewport = { width: 1440, height: 900 }, turnstile = 'stub', dpr = 1,
    clipboardText, init = '',
  } = opts;
  const browser = opts.browser || await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, locale: lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-US' : 'fr-FR' });
  const mock = makeMock();
  const page = await ctx.newPage();
  const issues = [];
  page.on('pageerror', e => issues.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|favicon|net::ERR|WebSocket|socket\.io|Download the React DevTools/i.test(m.text())) issues.push(`console.error: ${m.text().slice(0, 240)}`); });

  await ctx.addInitScript(([theme, lang, clipboardText, init]) => {
    try { localStorage.setItem('fm_theme', theme); localStorage.setItem('language', lang); localStorage.setItem('fm_cookie_consent', 'accepted'); } catch {}
    if (clipboardText !== undefined) {
      const fake = {
        readText: async () => { if (window.__clipFail) throw new Error('NotAllowedError'); return window.__clip !== undefined ? window.__clip : clipboardText; },
        writeText: async (t) => { if (window.__clipFail) throw new Error('NotAllowedError'); window.__copied = t; },
      };
      try { Object.defineProperty(navigator, 'clipboard', { value: fake, configurable: true }); } catch {}
    }
    if (init) { try { (0, eval)(init); } catch (e) { console.error('init script failed', e); } }
  }, [theme, lang, clipboardText, init]);

  // production hosts and trackers never get a request
  await ctx.route(/(facebook\.(com|net)|connect\.facebook|sentry|supabase\.co|famamennou\.tn|onrender\.com|googletagmanager|google-analytics)/, r => r.abort());

  await ctx.route(`${API}/**`, async (route) => {
    const req = route.request();
    const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    let body = {};
    try { body = req.postData() ? JSON.parse(req.postData()) : {}; } catch { /* not JSON */ }
    mock.calls.push({ method: req.method(), path: url.pathname, query: url.search, body, auth: req.headers()['authorization'] });
    const r = mock.handle(req.method(), url.pathname, body);
    if (r.abort) return route.abort();
    if (r.hang) return;                       // never answered: the request stays pending until the page is closed
    return route.fulfill({ status: r.status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(r.json) });
  });

  if (turnstile === 'stub') {
    await ctx.route(/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: TURNSTILE_STUB }));
  } // 'real' → the real script is fetched from Cloudflare
  await ctx.route(/accounts\.google\.com\/gsi\/client/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GSI_STUB }));

  return { browser, ctx, page, mock, issues, close: async () => { await ctx.close(); if (!opts.browser) await browser.close(); } };
}

// ── tiny test runner ────────────────────────────────────────────────────────────────────────────
function createReport(title) {
  const results = [];
  const report = {
    check(name, ok, detail) { results.push({ name, ok: !!ok, detail }); console.log(`  ${ok ? '✔' : '✘'} ${name}${!ok && detail !== undefined ? `\n      → ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`); },
    eq(name, actual, expected) { const ok = JSON.stringify(actual) === JSON.stringify(expected); report.check(name, ok, ok ? undefined : { expected, actual }); },
    section(s) { console.log(`\n${s}`); },
    done() { const bad = results.filter(r => !r.ok).length; console.log(`\n${title}: ${results.length - bad}/${results.length} checks passed${bad ? `, ${bad} FAILED` : ''}`); process.exitCode = bad ? 1 : 0; return bad === 0; },
  };
  console.log(title);
  return report;
}

async function openApp(page, urlPath = '/') {
  await page.goto(BASE + urlPath, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.getElementById('root') && document.getElementById('root').children.length > 0, null, { timeout: 120000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(500);
}

module.exports = { BASE, API, OUT, launch, makeMock, createReport, openApp, samplePng, makePng };
