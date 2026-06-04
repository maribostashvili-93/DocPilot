import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5173';
const AVIATOR_EMAIL = process.env.AVIATOR_EMAIL || 'admin@aviator-studio.local';
const AVIATOR_PW = process.env.AVIATOR_PASSWORD || '';
if (!AVIATOR_PW) { console.error('set AVIATOR_PASSWORD env var'); process.exit(1); }
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

console.log('1) login at /c/aviator');
await page.goto(`${BASE}/c/aviator`, { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', AVIATOR_EMAIL);
await page.fill('input[type="password"]', AVIATOR_PW);
await page.click('button[type="submit"]');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);
console.log('   after login url:', page.url());

console.log('2) navigate to /c/aviator/admin');
await page.goto(`${BASE}/c/aviator/admin`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
console.log('   admin url:', page.url());

await page.screenshot({ path: '/tmp/aviator-admin-users.png', fullPage: true });

const probe = await page.evaluate(() => {
  const shell = document.querySelector('.company-admin');
  const table = document.querySelector('.company-admin-table');
  const rows = Array.from(document.querySelectorAll('.company-admin-table tbody tr'));
  const styleOf = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, color: cs.color };
  };
  return {
    url: location.href,
    body: styleOf(document.body),
    shell: styleOf(shell),
    table: styleOf(table),
    rowCount: rows.length,
    rows: rows.map((tr) => ({
      cls: tr.className,
      tr: styleOf(tr),
      tds: Array.from(tr.querySelectorAll('td')).map((td) => {
        const sub = Array.from(td.querySelectorAll('*'));
        return {
          text: (td.textContent || '').trim().slice(0, 40),
          td: styleOf(td),
          children: sub.slice(0, 4).map((c) => ({
            tag: c.tagName.toLowerCase(),
            cls: c.className || '',
            text: (c.textContent || '').trim().slice(0, 30),
            ...styleOf(c),
          })),
        };
      }),
    })),
  };
});
console.log(JSON.stringify(probe, null, 2));

// Get the actual matched CSS rule for the even row's background
const cdp = await ctx.newCDPSession(page);
await cdp.send('DOM.enable');
await cdp.send('CSS.enable');
const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
const targetSel = '.company-admin-table tbody tr:nth-child(2)';
const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: targetSel });
if (nodeId) {
  const matched = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
  const bgRules = [];
  for (const m of matched.matchedCSSRules || []) {
    const rule = m.rule;
    const props = rule.style.cssText || '';
    if (props.includes('background')) {
      bgRules.push({ selector: rule.selectorList?.text, props, origin: rule.origin });
    }
  }
  console.log('matched bg rules for', targetSel, JSON.stringify(bgRules, null, 2));
} else {
  console.log('no even row found');
}
console.log('errors:', JSON.stringify(errors));
await browser.close();
