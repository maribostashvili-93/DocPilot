import { createRequire } from 'node:module';
import { setTimeout as wait } from 'node:timers/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');
const BASE = 'http://localhost:5173';
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERR '+String(e)));
const snip = async () => (await page.evaluate(()=>document.body.innerText)).replace(/\s+/g,' ').trim();

// 1. PUBLIC DOC logged-out
await page.goto(`${BASE}/docs/minescape-complete-guide`, { waitUntil: 'networkidle' }); await wait(1200);
console.log('[1 doc] url=', page.url().replace(BASE,''),
  '| h1=', await page.evaluate(()=>document.querySelector('h1')?.innerText??'(none)'),
  '| sections=', await page.evaluate(()=>document.querySelectorAll('.section-banner').length),
  '| markers=', await page.evaluate(()=>document.querySelectorAll('.doc-marker').length),
  '| imgs=', await page.evaluate(()=>document.querySelectorAll('section.content img').length));

// 2. SUPERADMIN login
await page.goto(`${BASE}/admin/v2/login`, { waitUntil: 'networkidle' }); await wait(400);
const SUPER_PW = process.env.SUPER_PASSWORD;
if (!SUPER_PW) { console.error('set SUPER_PASSWORD env var'); process.exit(1); }
await page.fill('input[name=email],input[type=email]', process.env.SUPER_EMAIL || 'admin@docpilot.local');
await page.fill('input[name=password],input[type=password]', SUPER_PW);
await page.click('button[type=submit]'); await wait(1500);
console.log('[2 login] url=', page.url().replace(BASE,''), '| dash snippet=', (await snip()).slice(0,120));

// 3. Navigate console tabs by clicking nav items
for (const label of ['Companies','Audit','Profile']) {
  const link = page.locator(`a:has-text("${label}"), button:has-text("${label}")`).first();
  if (await link.count()) { await link.click().catch(()=>{}); await wait(900);
    console.log(`[3 ${label}] url=`, page.url().replace(BASE,''), '|', (await snip()).slice(0,130));
  } else console.log(`[3 ${label}] NAV NOT FOUND`);
}

// 4. Company landing (public)
await page.goto(`${BASE}/c/qM6AMqBtmOFaxmg1`, { waitUntil: 'networkidle' }); await wait(700);
console.log('[4 landing]', (await snip()).slice(0,130));

// 5. Tenant CMS path (Codex-added) while superadmin-authed
await page.goto(`${BASE}/c/qM6AMqBtmOFaxmg1/admin/cms`, { waitUntil: 'networkidle' }); await wait(1200);
console.log('[5 tenant-cms] url=', page.url().replace(BASE,''), '|', (await snip()).slice(0,130));

console.log('\nCONSOLE ERRORS:', errs.length ? [...new Set(errs)].slice(0,8) : 'none');
await browser.close();
