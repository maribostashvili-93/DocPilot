// Probe the UserCreateModal mid-flow on both viewports. Open the modal,
// scan its computed contrast, screenshot.

import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5173';
const AVIATOR_EMAIL = process.env.AVIATOR_EMAIL || 'admin@aviator-studio.local';
const AVIATOR_PW = process.env.AVIATOR_PASSWORD || '';
if (!AVIATOR_PW) { console.error('set AVIATOR_PASSWORD env var'); process.exit(1); }

function parseRgba(s) {
  const m = s && s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(',').map((x) => Number(x.trim()));
  return { r, g, b, a };
}
function luminance({ r, g, b }) {
  const t = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * t(r) + 0.7152 * t(g) + 0.0722 * t(b);
}
function ratio(fg, bgChain) {
  let bg = { r: 255, g: 255, b: 255 };
  for (let i = bgChain.length - 1; i >= 0; i--) {
    const L = parseRgba(bgChain[i]); if (!L) continue;
    bg = { r: L.r * L.a + bg.r * (1 - L.a), g: L.g * L.a + bg.g * (1 - L.a), b: L.b * L.a + bg.b * (1 - L.a) };
  }
  const f = parseRgba(fg) || { r: 0, g: 0, b: 0, a: 1 };
  const a = luminance(f), b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const browser = await chromium.launch({ headless: true });
for (const vp of [{ name: 'desktop', w: 1280, h: 800 }, { name: 'mobile', w: 375, h: 812 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/c/aviator`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', AVIATOR_EMAIL);
  await page.fill('input[type="password"]', AVIATOR_PW);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/v2/auth/login') && r.status() === 200, { timeout: 8000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.goto(`${BASE}/c/aviator/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  // debug
  await page.screenshot({ path: `/tmp/probe-debug-${vp.name}-admin.png`, fullPage: true });
  console.log(`  [${vp.name}] admin url:`, page.url(), 'title:', await page.title());

  // open the modal
  await page.waitForSelector('button.company-admin-btn', { timeout: 8000 });
  await page.click('button.company-admin-btn:has-text("+ New user")');
  await page.waitForSelector('.company-admin-modal', { state: 'visible' });
  await page.waitForTimeout(400);

  // type some content in the password field so we render the meta line
  await page.fill('input[name="name"]', 'Probe User');
  await page.fill('input[name="email"]', 'probe@aviator.local');
  await page.fill('.company-admin-modal input[type="password"], .company-admin-modal input[name="password"]', 'TestPass123!Aa');
  await page.waitForTimeout(300);

  await page.screenshot({ path: `/tmp/sweep-${vp.name}-modal-create-user.png`, fullPage: true });

  const findings = await page.evaluate(() => {
    const modal = document.querySelector('.company-admin-modal');
    if (!modal) return null;
    const walker = document.createTreeWalker(modal, NodeFilter.SHOW_TEXT);
    const out = [];
    let n;
    while ((n = walker.nextNode())) {
      const text = (n.nodeValue || '').trim();
      if (!text || text.length < 2) continue;
      const el = n.parentElement;
      if (!el || ['script', 'style'].includes(el.tagName.toLowerCase())) continue;
      const cs = getComputedStyle(el);
      const chain = [];
      let cur = el;
      while (cur && cur !== document.documentElement) {
        const c = getComputedStyle(cur).backgroundColor;
        chain.push(c);
        const m = c.match(/rgba?\(([^)]+)\)/);
        if (m) {
          const parts = m[1].split(',').map((x) => Number(x.trim()));
          const a = parts.length === 4 ? parts[3] : 1;
          if (a >= 1) break;
        }
        cur = cur.parentElement;
      }
      chain.push(getComputedStyle(document.body).backgroundColor);
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: el.className || '',
        text: text.slice(0, 50),
        fg: cs.color,
        bgChain: chain,
      });
    }
    return out;
  });

  const bad = (findings || []).filter((f) => ratio(f.fg, f.bgChain) < 2.0);
  console.log(`[${vp.name}] modal scanned ${findings ? findings.length : 0} text nodes, ${bad.length} low-contrast`);
  for (const b of bad.slice(0, 10)) {
    console.log(`  ratio=${ratio(b.fg, b.bgChain).toFixed(2)} <${b.tag} class="${b.cls.slice(0, 60)}"> "${b.text}"`);
    console.log(`    fg=${b.fg} bg=[${b.bgChain.slice(0, 2).join(' / ')}]`);
  }

  // also probe inputs (placeholder + actual values)
  const inputs = await page.evaluate(() => {
    const ins = Array.from(document.querySelectorAll('.company-admin-modal input, .company-admin-modal select'));
    return ins.map((el) => {
      const cs = getComputedStyle(el);
      return {
        name: el.name || el.type,
        bg: cs.backgroundColor,
        color: cs.color,
        borderColor: cs.borderColor,
      };
    });
  });
  console.log(`  input styles:`, JSON.stringify(inputs));
  await ctx.close();
}
await browser.close();
