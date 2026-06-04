// Visit a list of authenticated routes and flag any text element whose
// foreground color is within deltaE-ish proximity to its computed background.
// Heuristic, not WCAG — but catches white-on-white, dark-on-dark, and the
// "near-invisible" class.

import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5173';
const AVIATOR_EMAIL = process.env.AVIATOR_EMAIL || 'admin@aviator-studio.local';
const AVIATOR_PW = process.env.AVIATOR_PASSWORD || '';
const SUPER_EMAIL = process.env.SUPER_EMAIL || 'admin@docpilot.local';
const SUPER_PW = process.env.SUPER_PASSWORD || '';
if (!AVIATOR_PW || !SUPER_PW) {
  console.error('set AVIATOR_PASSWORD and SUPER_PASSWORD env vars');
  process.exit(1);
}

function parseRgba(str) {
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(',').map((s) => Number(s.trim()));
  return { r, g, b, a };
}

function luminance({ r, g, b }) {
  const toLin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function contrastRatio(fg, bgChain) {
  // Composite bg over white if it's semi-transparent — same heuristic
  // browsers fall back to. We walk the parent chain when bg has alpha < 1.
  let bg = { r: 255, g: 255, b: 255 };
  for (let i = bgChain.length - 1; i >= 0; i--) {
    const layer = parseRgba(bgChain[i]);
    if (!layer) continue;
    const a = layer.a;
    bg = {
      r: layer.r * a + bg.r * (1 - a),
      g: layer.g * a + bg.g * (1 - a),
      b: layer.b * a + bg.b * (1 - a),
    };
  }
  const f = parseRgba(fg) || { r: 0, g: 0, b: 0, a: 1 };
  const lF = luminance(f);
  const lB = luminance(bg);
  const [lighter, darker] = lF > lB ? [lF, lB] : [lB, lF];
  return (lighter + 0.05) / (darker + 0.05);
}

async function loginCompany(page) {
  await page.goto(`${BASE}/c/aviator`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', AVIATOR_EMAIL);
  await page.fill('input[type="password"]', AVIATOR_PW);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
}

async function loginSuper(page) {
  await page.goto(`${BASE}/admin/v2/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', SUPER_EMAIL);
  await page.fill('input[type="password"]', SUPER_PW);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
}

async function scanPage(page, label) {
  await page.waitForTimeout(700);
  const findings = await page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const text = (n.nodeValue || '').trim();
      if (!text || text.length < 2) continue;
      const el = n.parentElement;
      if (!el) continue;
      // Skip script/style/etc
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'noscript', 'svg', 'path'].includes(tag)) continue;
      const cs = getComputedStyle(el);
      const fg = cs.color;
      // Walk up to build the bg chain until we hit a fully opaque ancestor.
      const bgChain = [];
      let cur = el;
      while (cur && cur !== document.documentElement) {
        const c = getComputedStyle(cur).backgroundColor;
        bgChain.push(c);
        // Stop only when the layer is FULLY OPAQUE (alpha === 1).
        // Semi-transparent rgba(255,255,255,0.03) must keep walking so
        // we composite onto the dark .company-admin parent below.
        const m = c.match(/rgba?\(([^)]+)\)/);
        if (m) {
          const parts = m[1].split(',').map((s) => Number(s.trim()));
          const alpha = parts.length === 4 ? parts[3] : 1;
          if (alpha >= 1) break;
        }
        cur = cur.parentElement;
      }
      // Also include the body bg as the final fallback layer.
      bgChain.push(getComputedStyle(document.body).backgroundColor);
      out.push({
        tag,
        cls: el.className || '',
        text: text.slice(0, 60),
        fg,
        bgChain,
      });
    }
    return out;
  });

  const bad = [];
  for (const f of findings) {
    const ratio = contrastRatio(f.fg, f.bgChain);
    if (ratio < 2.0) {
      bad.push({ ...f, ratio: ratio.toFixed(2) });
    }
  }
  return { label, total: findings.length, bad };
}

const browser = await chromium.launch({ headless: true });
const results = [];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 812 },
];

for (const vp of VIEWPORTS) {
  // --- Company admin paths ---
  {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    await loginCompany(page);

    for (const path of ['/c/aviator/admin', '/c/aviator/app']) {
      try {
        await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
        results.push(await scanPage(page, `${vp.name}:Company:${path}`));
      } catch (e) {
        results.push({ label: `${vp.name}:Company:${path}`, error: e.message });
      }
    }
    // Tabs on /admin
    await page.goto(`${BASE}/c/aviator/admin`, { waitUntil: 'networkidle' });
    for (const tab of ['users', 'branding', 'audit']) {
      try {
        const button = await page.$(`button[role="tab"]:has-text("${tab}")`);
        if (button) {
          await button.click();
          results.push(await scanPage(page, `${vp.name}:Company:/admin#${tab}`));
        }
      } catch (e) {
        results.push({ label: `${vp.name}:Company:tab=${tab}`, error: e.message });
      }
    }
    await ctx.close();
  }

  // --- SuperAdmin paths ---
  {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    await loginSuper(page);

    for (const path of [
      '/admin/v2/companies',
      '/admin/v2/audit',
      '/admin/v2/companies/co_b93655ce27081a78',
      '/admin/v2/companies/co_b93655ce27081a78/users',
    ]) {
      try {
        await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
        const r = await scanPage(page, `${vp.name}:Super:${path}`);
        await page.screenshot({
          path: `/tmp/sweep-${vp.name}-${path.replace(/[/:]+/g, '_')}.png`,
          fullPage: true,
        });
        results.push(r);
      } catch (e) {
        results.push({ label: `${vp.name}:Super:${path}`, error: e.message });
      }
    }
    await ctx.close();
  }
}

await browser.close();

console.log('=== Contrast sweep results ===\n');
for (const r of results) {
  if (r.error) {
    console.log(`[${r.label}] ERROR: ${r.error}\n`);
    continue;
  }
  console.log(`[${r.label}] scanned ${r.total} text nodes, ${r.bad.length} low-contrast`);
  for (const b of r.bad.slice(0, 8)) {
    console.log(`  ratio=${b.ratio} <${b.tag} class="${b.cls.slice(0, 50)}"> "${b.text}"`);
    console.log(`    fg=${b.fg} bg=[${b.bgChain.slice(0, 2).join(' / ')}]`);
  }
  if (r.bad.length > 8) console.log(`  ... +${r.bad.length - 8} more`);
  console.log('');
}
