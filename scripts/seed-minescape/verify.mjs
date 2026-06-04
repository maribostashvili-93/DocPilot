#!/usr/bin/env node
/**
 * Headless smoke check for the new Minescape complete guide.
 *
 * Visits:
 *   /                            (landing)
 *   /products/minescape          (product page)
 *   /docs/minescape-complete-guide (full document)
 *
 * Fails on console errors or unhandled page errors.
 */
import { createRequire } from 'node:module';
import { setTimeout as wait } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');

const BASE = process.env.DOCPILOT_BASE || 'http://localhost:5173';

const ALLOWED_WARNING_PATTERNS = [
  /v7_startTransition/i,
  /v7_relativeSplatPath/i,
];

const urls = [
  '/',
  '/products/minescape',
  '/docs/minescape-complete-guide',
];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const fails = [];

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') fails.push({ url: page.url(), kind: 'console.error', text });
    if (type === 'warning' && !ALLOWED_WARNING_PATTERNS.some((re) => re.test(text))) {
      fails.push({ url: page.url(), kind: 'console.warning', text });
    }
  });
  page.on('pageerror', (err) => fails.push({ url: page.url(), kind: 'pageerror', text: String(err) }));

  for (const path of urls) {
    const url = `${BASE}${path}`;
    process.stdout.write(`visit ${url} ... `);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await wait(500); // let React hydrate
    const title = await page.title();
    const bodyText = (await page.evaluate(() => document.body.innerText)).slice(0, 240);
    process.stdout.write(`title="${title}"\n`);
    if (bodyText.toLowerCase().includes('something went wrong')) {
      fails.push({ url, kind: 'error-boundary', text: bodyText });
    }
  }

  // Inspect content of the doc page directly
  await page.goto(`${BASE}/docs/minescape-complete-guide`, { waitUntil: 'domcontentloaded' });
  await wait(1000);
  const h1 = await page.evaluate(() => document.querySelector('h1')?.innerText ?? '(no h1)');
  const sectionCount = await page.evaluate(() => document.querySelectorAll('.section-banner').length);
  const imgCount = await page.evaluate(() => document.querySelectorAll('section.content img').length);
  const markerCount = await page.evaluate(() => document.querySelectorAll('.doc-marker').length);
  console.log(`doc h1="${h1}"  section-banners=${sectionCount}  images=${imgCount}  markers=${markerCount}`);

  if (sectionCount === 0) fails.push({ url: page.url(), kind: 'render', text: 'No section-banners found on doc page' });
  if (imgCount === 0) fails.push({ url: page.url(), kind: 'render', text: 'No images rendered on doc page' });

  await browser.close();

  if (fails.length) {
    console.error('\nFAILURES:');
    for (const f of fails) console.error(JSON.stringify(f));
    process.exit(1);
  }
  console.log('\nOK — Minescape complete guide is live.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
