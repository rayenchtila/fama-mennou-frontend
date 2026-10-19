// Extracted from ../audit.js: WCAG contrast of every text item in the open dialog (computed styles, then pixels for anything that fails).
function collect() {
  const parse = s => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (top, bot) => {
    const a = top.a + bot.a * (1 - top.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (top.r * top.a + bot.r * bot.a * (1 - top.a)) / a,
      g: (top.g * top.a + bot.g * bot.a * (1 - top.a)) / a,
      b: (top.b * top.a + bot.b * bot.a * (1 - top.a)) / a,
      a,
    };
  };
  const lum = c => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const page = parse(getComputedStyle(document.documentElement).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };

  const surfaceOf = el => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const bg = parse(getComputedStyle(e).backgroundColor);
      if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= 1) break; }
    }
    let base = layers.length && layers[layers.length - 1].a >= 1 ? layers.pop() : { ...page, a: 1 };
    while (layers.length) base = over(layers.pop(), base);
    return base;
  };
  const opacityOf = el => { let o = 1; for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
  const visible = el => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    }
    return true;
  };

  const root = document.querySelector('[role=dialog]');
  const out = [];
  const add = (el, text, fg, bg, kind) => {
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10);
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const r = el.getBoundingClientRect();
    out.push({
      text: text.slice(0, 46), kind, size, need: large ? 3 : 4.5,
      cls: (el.className && el.className.toString().split(' ').slice(0, 3).join(' ')) || el.tagName,
      brand: !!el.closest('.ds-brand-accent'),
      fg, ratio: +ratio(over(fg, bg), bg).toFixed(2),
      rect: { x: r.left, y: r.top, width: r.width, height: r.height },
    });
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent.trim();
    const el = n.parentElement;
    if (!text || !el || seen.has(el) || !visible(el)) continue;
    if (el.closest('.sr-only, script, style, iframe')) continue;
    if (el.closest('button:disabled, [aria-disabled="true"], input:disabled, select:disabled, textarea:disabled')) continue; // inactive controls carry no contrast requirement (WCAG 1.4.3)
    if (getComputedStyle(el).fontFamily.includes('Material')) continue; // icon ligatures are drawn as glyphs
    seen.add(el);
    const fg0 = parse(getComputedStyle(el).color);
    if (!fg0) continue;
    add(el, text, { ...fg0, a: fg0.a * opacityOf(el) }, surfaceOf(el), 'text');
  }
  for (const input of root.querySelectorAll('input, textarea')) {
    if (!visible(input) || !input.placeholder) continue;
    const fg = parse(getComputedStyle(input, '::placeholder').color);
    add(input, 'placeholder: ' + input.placeholder, fg, surfaceOf(input), 'placeholder');
  }
  return out;
}

// Re-measure from pixels: the most common colour inside the element's box is its background.
async function pixelRatio(page, row) {
  const pad = 2;
  const clip = {
    x: Math.max(0, Math.floor(row.rect.x) - pad), y: Math.max(0, Math.floor(row.rect.y) - pad),
    width: Math.ceil(row.rect.width) + pad * 2, height: Math.ceil(row.rect.height) + pad * 2,
  };
  const vp = page.viewportSize();
  clip.width = Math.min(clip.width, vp.width - clip.x); clip.height = Math.min(clip.height, vp.height - clip.y);
  if (clip.width < 1 || clip.height < 1) return null;
  const png = (await page.screenshot({ clip })).toString('base64');
  return page.evaluate(async ({ png, fg }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const bins = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const k = (d[i] >> 3) + ',' + (d[i + 1] >> 3) + ',' + (d[i + 2] >> 3);
      const b = bins.get(k) || { n: 0, r: 0, g: 0, b: 0 };
      b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; bins.set(k, b);
    }
    let top = null; for (const b of bins.values()) if (!top || b.n > top.n) top = b;
    const bg = { r: top.r / top.n, g: top.g / top.n, b: top.b / top.n };
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = c => 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    // the text colour composited over the measured background
    const eff = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
    return { bg: `rgb(${bg.r | 0},${bg.g | 0},${bg.b | 0})`, ratio: +((Math.max(L(eff), L(bg)) + 0.05) / (Math.min(L(eff), L(bg)) + 0.05)).toFixed(2) };
  }, { png, fg: row.fg });
}


module.exports = { collect, pixelRatio };
