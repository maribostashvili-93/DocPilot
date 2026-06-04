// tests/reader.spec.mjs
import { test, expect } from '@playwright/test';

test('reader root mounts and applies token palette', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const root = page.locator('.docpilot-reader');
  await expect(root).toBeVisible();
  const bg = await root.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});

test('legacy .manual-shell is no longer mounted on /docs/doc-manual', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  await expect(page.locator('.docpilot-reader')).toBeVisible();
  await expect(page.locator('.manual-shell')).toHaveCount(0);
});

test('doc head shows title + lede, not the dark Aviator cover', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  await expect(page.locator('.docpilot-reader .doc-title')).toHaveText(/Aviator/i);
  await expect(page.locator('.docpilot-reader')).not.toContainText('AUDIENCE');
  await expect(page.locator('.docpilot-reader')).not.toContainText('TAXONOMY');
});

test('sidebar shows two-level ToC with active highlight on first section', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const aside = page.locator('.docpilot-reader aside.side');
  await expect(aside).toBeVisible();
  await expect(aside.locator('.side-list > li').first().locator('> a')).toHaveClass(/active/);
});

test('reader header is 60px sticky and shows brand + search trigger', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const header = page.locator('.docpilot-reader .reader-header');
  await expect(header).toBeVisible();
  const height = await header.evaluate((el) => el.getBoundingClientRect().height);
  expect(Math.round(height)).toBe(60);
  await expect(header.locator('.search-trigger')).toBeVisible();
});

test('theme toggle flips data-theme on the reader root', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const root = page.locator('.docpilot-reader');
  const before = await root.getAttribute('data-theme');
  await page.locator('.docpilot-reader [aria-label="Toggle theme"]').click();
  const after = await root.getAttribute('data-theme');
  expect(before).not.toBe(after);
});

test('at 320px viewport, body fits with no horizontal scroll and drawer toggles', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const scrollX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(scrollX).toBeLessThanOrEqual(0);
  await page.locator('.docpilot-reader .hamburger').click();
  await expect(page.locator('.docpilot-reader .drawer')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.docpilot-reader .drawer')).toHaveCount(0);
});

test('flow nav at doc end renders no empty dashed boxes', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const flow = page.locator('.docpilot-reader .flow-nav');
  await expect(flow).toBeVisible();
  await expect(flow.locator('.flow-link.prev[disabled], .flow-link.prev[aria-hidden]')).toHaveCount(0);
});

test('footer is not pure black background', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const bg = await page.locator('.docpilot-reader footer.reader-foot').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgb(0, 0, 0)');
});

test('Ctrl+K opens the search modal and filters anchors by title', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const accel = process.platform === 'darwin' ? 'Meta+K' : 'Control+K';
  await page.keyboard.press(accel);
  const modal = page.locator('dialog.search-modal');
  await expect(modal).toBeVisible();
  await modal.locator('input').fill('over');
  await expect(modal.locator('ul li a')).not.toHaveCount(0);
});

test('reader passes axe colour-contrast on /docs/doc-manual (light)', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  const results = await new AxeBuilder({ page })
    .include('.docpilot-reader')
    .options({ runOnly: { type: 'rule', values: ['color-contrast'] } })
    .analyze();
  if (results.violations.length) {
    console.log(JSON.stringify(results.violations, null, 2));
  }
  expect(results.violations).toHaveLength(0);
});

test('reader passes axe colour-contrast on /docs/doc-manual (dark)', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  await page.goto('http://127.0.0.1:5173/docs/doc-manual');
  await page.locator('.docpilot-reader [aria-label="Toggle theme"]').click();
  await page.waitForTimeout(150);
  const results = await new AxeBuilder({ page })
    .include('.docpilot-reader')
    .options({ runOnly: { type: 'rule', values: ['color-contrast'] } })
    .analyze();
  if (results.violations.length) {
    console.log(JSON.stringify(results.violations, null, 2));
  }
  expect(results.violations).toHaveLength(0);
});
