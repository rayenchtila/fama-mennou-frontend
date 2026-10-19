// Home hero: the video published under "Publicité" takes the place the stock photo used to have.
// Plain Node script (API mocked, nothing real is contacted) — see ../signup-mocked/README.md for how to start the private dev server.
//
//   BASE_URL=http://localhost:3200 node e2e/home-ad-mocked/home_ad.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { launch, createReport, openApp, OUT } = require('../signup-mocked/harness');

const PUBLIC_PHOTO = path.resolve(__dirname, '..', '..', 'public', 'images', 'home-hero.jpg');
const AD = (id, email, name, title) => ({ id, video_url: `https://ads.example.test/ad-${id}.webm`, profile_email: email, profile_name: name, profile_photo: null, profile_title: title, profile_role: 'freelancer', profile_verified: true });
const SAMI = AD(1, 'sami@example.com', 'Sami Ben Ali', 'Full-stack developer');
const NOUR = AD(2, 'nour@example.com', 'Nour Khelifi', 'UI designer');

// A real, playable 3-second WebM, recorded from an animated canvas in the browser itself (no ffmpeg, no download).
async function makeWebm(browser) {
  const page = await browser.newPage();
  const b64 = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 400;
    const g = c.getContext('2d');
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: 'video/webm;codecs=vp8' });
    const chunks = []; rec.ondataavailable = e => chunks.push(e.data);
    let n = 0;
    const timer = setInterval(() => { n++; g.fillStyle = `hsl(${(n * 7) % 360},70%,45%)`; g.fillRect(0, 0, 640, 400); g.fillStyle = '#fff'; g.font = 'bold 64px sans-serif'; g.fillText('AD ' + n, 40, 220); }, 33);
    const stopped = new Promise(r => { rec.onstop = r; });
    rec.start(); await new Promise(r => setTimeout(r, 3200)); rec.stop(); await stopped; clearInterval(timer);
    const buf = new Uint8Array(await new Blob(chunks, { type: 'video/webm' }).arrayBuffer());
    let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(s);
  });
  await page.close();
  return Buffer.from(b64, 'base64');
}

// Serves the clip the way a CDN does, including byte ranges (a <video> asks for them).
function serveVideo(ctx, webm) {
  return ctx.route('https://ads.example.test/**', route => {
    const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers()['range'] || '');
    if (!range) return route.fulfill({ status: 200, contentType: 'video/webm', headers: { 'accept-ranges': 'bytes', 'content-length': String(webm.length) }, body: webm });
    const from = +range[1], to = range[2] ? Math.min(+range[2], webm.length - 1) : webm.length - 1;
    return route.fulfill({ status: 206, contentType: 'video/webm', headers: { 'accept-ranges': 'bytes', 'content-range': `bytes ${from}-${to}/${webm.length}`, 'content-length': String(to - from + 1) }, body: webm.subarray(from, to + 1) });
  });
}

const settle = (page, ms = 600) => page.waitForTimeout(ms);
const hasOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

(async () => {
  const R = createReport('Home hero: the Publicité video replaces the photo');
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const webm = await makeWebm(browser);
  console.log(`  (test clip: ${Math.round(webm.length / 1024)} KB of real WebM)`);

  R.section('The photo is gone');
  R.eq('public/images/home-hero.jpg no longer exists', fs.existsSync(PUBLIC_PHOTO), false);

  // ── no campaign live ──
  for (const [label, vp] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    R.section(`No campaign live — ${label}`);
    const env = await launch({ lang: 'en', viewport: vp, browser });
    const { page, mock, issues } = env;
    const photoRequests = [];
    page.on('request', r => { if (/home-hero/.test(r.url())) photoRequests.push(r.url()); });
    mock.on('GET', /^\/api\/advertisements\/active$/, () => ({ status: 200, json: [] }));
    await openApp(page); await settle(page, 1200);
    R.eq('no photo is requested', photoRequests, []);
    R.eq('no image of a team is on the page', await page.locator('section img[src*="home-hero"]').count(), 0);
    R.eq('no ad card either', await page.locator('[data-testid="home-ad"]').count(), 0);
    const wrapper = await page.evaluate(() => { const el = document.querySelector('section .empty\\:hidden'); return el ? { display: getComputedStyle(el).display, children: el.childNodes.length } : null; });
    R.eq('the empty visual slot is hidden (no gap left behind)', wrapper, { display: 'none', children: 0 });
    R.check('the headline and the search are still there', (await page.locator('h1').first().count()) === 1 && (await page.locator('section form[role=search]').count()) === 1);
    R.eq('no horizontal scrolling', await hasOverflow(page), false);
    await page.screenshot({ path: path.join(OUT, `home-ad-none-${label}.png`) });
    R.eq('page errors', issues.filter(i => !/Failed to load|net::/.test(i)), []);
    await env.close();
  }

  // ── the ads endpoint is down ──
  {
    R.section('The ads endpoint answers 503');
    const env = await launch({ lang: 'en', browser });
    env.mock.on('GET', /^\/api\/advertisements\/active$/, () => ({ status: 503, json: { error: 'database_unavailable' } }));
    await openApp(env.page); await settle(env.page, 1200);
    R.eq('the hero shows no card and no photo (and the page is fine)', [await env.page.locator('[data-testid="home-ad"]').count(), await env.page.locator('section img[src*="home-hero"]').count(), await env.page.locator('h1').count()], [0, 0, 1]);
    await env.close();
  }

  // ── one campaign live ──
  for (const [label, theme, lang, vp] of [['desktop-dark', 'dark', 'en', { width: 1440, height: 900 }], ['desktop-light', 'light', 'fr', { width: 1440, height: 900 }], ['phone-ar', 'dark', 'ar', { width: 390, height: 844 }]]) {
    R.section(`One campaign live — ${label}`);
    const env = await launch({ lang, theme, viewport: vp, browser });
    const { page, ctx, mock, issues } = env;
    await serveVideo(ctx, webm);
    mock.on('GET', /^\/api\/advertisements\/active$/, () => ({ status: 200, json: [SAMI] }));
    await openApp(page);
    const card = page.locator('[data-testid="home-ad"]');
    await card.waitFor({ timeout: 15000 });
    await settle(page, 2200);
    R.check('the video card is on the page', await card.isVisible());
    R.eq('no photo anywhere in the hero', await page.locator('section img[src*="home-hero"]').count(), 0);
    const box = await card.boundingBox();
    if (vp.width >= 1024) R.check('it sits in the right-hand column, where the photo was', box && box.x > vp.width * 0.45 && box.x + box.width <= vp.width, box);
    else R.check('on a phone it sits under the text, full width', box && box.width > vp.width * 0.8, box);
    const v = await page.evaluate(() => { const el = document.querySelector('[data-testid="home-ad-video"]'); return el ? { src: el.currentSrc || el.src, paused: el.paused, muted: el.muted, t: el.currentTime, ready: el.readyState, loop: el.loop } : null; });
    R.check('a <video> with the campaign\'s file', v && /ad-1\.webm/.test(v.src), v);
    R.check('it plays by itself, muted, on a loop', v && v.paused === false && v.muted === true && v.loop === true && v.t > 0.3, v);
    const text = await card.innerText();
    R.check('the profile caption shows the first name only, and the "sponsored" label', /Sami/.test(text) && !/Ben Ali/.test(text) && /(Sponsored|Sponsoris|ممول)/i.test(text), text);
    R.eq('no horizontal scrolling', await hasOverflow(page), false);
    await page.screenshot({ path: path.join(OUT, `home-ad-one-${label}.png`) });

    if (label === 'desktop-dark') {
      // the teaser opens the full video
      await page.locator('[data-testid="home-ad-open"]').click();
      const viewer = page.locator('[data-testid="home-ad-viewer"]');
      await viewer.waitFor({ timeout: 5000 });
      const full = await page.evaluate(() => { const el = document.querySelector('[data-testid="home-ad-full"]'); return el ? { controls: el.controls, muted: el.muted, loop: el.loop } : null; });
      R.eq('click → the full video opens with controls, with sound, not looping', full, { controls: true, muted: false, loop: false });
      await page.locator('[data-testid="home-ad-speed-1.5"]').click();
      R.eq('the speed buttons work (1.5×)', await page.evaluate(() => document.querySelector('[data-testid="home-ad-full"]').playbackRate), 1.5);
      R.check('the teaser stops behind the viewer', await page.evaluate(() => document.querySelector('[data-testid="home-ad-video"]').paused));
      await page.screenshot({ path: path.join(OUT, 'home-ad-viewer.png') });
      await page.keyboard.press('Escape');
      await viewer.waitFor({ state: 'detached', timeout: 5000 });
      await settle(page, 500);
      R.check('Escape closes it and the teaser plays again', await page.evaluate(() => !document.querySelector('[data-testid="home-ad-video"]').paused));
      // the sound toggle is its own button and does not open the viewer
      await page.locator('[data-testid="home-ad-mute"]').click();
      R.eq('the sound button unmutes without opening the viewer', [await page.evaluate(() => document.querySelector('[data-testid="home-ad-video"]').muted), await page.locator('[data-testid="home-ad-viewer"]').count()], [false, 0]);
    }
    R.eq('page errors', issues.filter(i => !/Failed to load|net::|play\(\)|NotAllowed|AbortError/.test(i)), []);
    await env.close();
  }

  // ── two campaigns: the rotation ──
  {
    R.section('Two campaigns live — the rotation');
    const env = await launch({ lang: 'en', browser });
    const { page, ctx, mock } = env;
    await serveVideo(ctx, webm);
    mock.on('GET', /^\/api\/advertisements\/active$/, () => ({ status: 200, json: [SAMI, NOUR] }));
    await openApp(page);
    await page.locator('[data-testid="home-ad"]').waitFor({ timeout: 15000 });
    const state = () => page.evaluate(() => [...document.querySelectorAll('[data-testid="home-ad-video"]')].map(v => ({ opacity: getComputedStyle(v).opacity, paused: v.paused })));
    await settle(page, 1500);
    let s = await state();
    R.eq('two videos are mounted', s.length, 2);
    R.check('the first is on screen and playing, the second waits', s[0].opacity === '1' && !s[0].paused && s[1].opacity === '0' && s[1].paused, s);
    R.eq('two progress pips', await page.locator('[data-testid="home-ad"] div:has(> span[style*="border-radius: 3px"]) > span').count(), 2);
    // a 3 s clip loops, which hands over to the next campaign
    await page.waitForFunction(() => { const v = [...document.querySelectorAll('[data-testid="home-ad-video"]')]; return v[1] && getComputedStyle(v[1]).opacity === '1'; }, null, { timeout: 15000 });
    s = await state();
    R.check('after the first clip has played, the second takes over and the first pauses', s[1].opacity === '1' && !s[1].paused && s[0].opacity === '0' && s[0].paused, s);
    await page.screenshot({ path: path.join(OUT, 'home-ad-rotation.png') });
    const caption = await page.locator('[data-testid="home-ad"]').innerText();
    R.check('the caption follows: "Nour", not "Khelifi"', /Nour/.test(caption) && !/Khelifi/.test(caption), caption);
    await env.close();
  }

  // ── reduced motion ──
  {
    R.section('Reduced motion');
    const env = await launch({ lang: 'en', browser });
    const { page, ctx, mock } = env;
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await serveVideo(ctx, webm);
    mock.on('GET', /^\/api\/advertisements\/active$/, () => ({ status: 200, json: [SAMI] }));
    await openApp(page);
    await page.locator('[data-testid="home-ad"]').waitFor({ timeout: 15000 });
    R.eq('the card is fully visible at once (no fade or scale)', await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="home-ad"]')).opacity), '1');
    await env.close();
  }

  await browser.close();
  R.done();
})().catch(e => { console.error(e); process.exit(1); });
