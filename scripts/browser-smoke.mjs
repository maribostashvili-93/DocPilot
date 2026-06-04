#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const APP_PORT = Number.parseInt(process.env.DOCPILOT_SMOKE_PORT || '5173', 10);
const API_PORT = Number.parseInt(process.env.DOCPILOT_PORT || '4179', 10);
const BASE_URL = `http://127.0.0.1:${APP_PORT}`;
const DATA_DIR = process.env.DOCPILOT_SMOKE_DATA_DIR || join(ROOT, '.docpilot-smoke-data');
const ADMIN_USER = process.env.DOCPILOT_SMOKE_USER || 'admin';
const ADMIN_PASSWORD = process.env.DOCPILOT_SMOKE_PASSWORD || 'admin';
const ALLOWED_WARNING_PATTERNS = [
  /React Router Future Flag Warning:.*v7_startTransition/i,
  /React Router Future Flag Warning:.*v7_relativeSplatPath/i,
];

const children = [];

function startProcess(command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(child);
  child.stdout.on('data', (chunk) => {
    if (process.env.DOCPILOT_SMOKE_DEBUG) process.stdout.write(chunk);
  });
  child.stderr.on('data', (chunk) => {
    if (process.env.DOCPILOT_SMOKE_DEBUG) process.stderr.write(chunk);
  });
  return child;
}

async function waitForUrl(url, label) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < 30_000) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${label}: ${url}${lastError ? ` (${lastError.message})` : ''}`);
}

async function expectText(page, path, text) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  await page.locator('body').waitFor({ state: 'visible' });
  const pattern = text instanceof RegExp ? text : new RegExp(text);
  const started = Date.now();
  let body = '';
  while (Date.now() - started < 10_000) {
    body = await page.locator('body').innerText();
    pattern.lastIndex = 0;
    if (pattern.test(body)) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.match(body, pattern, `Expected ${path} to include ${text}`);
}

async function shutdown() {
  for (const child of children.reverse()) {
    if (!child.killed) child.kill('SIGTERM');
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  rmSync(DATA_DIR, { recursive: true, force: true });
}

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(130);
});
process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(143);
});

async function main() {
  rmSync(DATA_DIR, { recursive: true, force: true });

  startProcess(process.execPath, ['server/docpilot-server.mjs'], {
    DOCPILOT_PORT: String(API_PORT),
    DOCPILOT_DATA_DIR: DATA_DIR,
  });
  startProcess(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', '--host', '127.0.0.1', '--port', String(APP_PORT), '--strictPort']);

  await waitForUrl(`http://127.0.0.1:${API_PORT}/api/docpilot/health`, 'DocPilot persistence API');
  await waitForUrl(BASE_URL, 'Vite app');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleRecords = [];
  const unexpectedErrors = [];
  const unexpectedWarnings = [];

  page.on('console', (message) => {
    const record = { type: message.type(), text: message.text() };
    consoleRecords.push(record);
    if (record.type === 'error') unexpectedErrors.push(record);
    if (record.type === 'warning' && !ALLOWED_WARNING_PATTERNS.some((pattern) => pattern.test(record.text))) {
      unexpectedWarnings.push(record);
    }
  });
  page.on('pageerror', (error) => {
    unexpectedErrors.push({ type: 'pageerror', text: error.stack || error.message });
  });

  const visited = [];
  const visit = async (path, text) => {
    await expectText(page, path, text);
    visited.push(path);
  };

  await visit('/', /DocPilot|Aviator/i);
  await visit('/docs/doc-manual', /Aviator/i);

  await page.waitForSelector('.docpilot-reader', { state: 'visible', timeout: 5_000 });
  const hasLegacyShell = await page.locator('.manual-shell').count();
  assert.equal(hasLegacyShell, 0, 'Legacy .manual-shell should not mount on /docs/doc-manual.');

  await visit('/games/aviator-crash', /Aviator Crash/i);
  await visit('/docs/doc-integration', /Integration Documentation/i);

  await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/admin/login', { timeout: 5_000 });
  assert.match(page.url(), /\/admin\/login$/, 'Protected admin route should redirect to login.');
  visited.push('/admin/dashboard -> /admin/login');

  await page.getByLabel('USERNAME').fill(ADMIN_USER);
  await page.getByLabel('PASSWORD').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/admin/dashboard');
  await visit('/admin/dashboard', /DocPilot Dashboard/i);
  await visit('/admin/documents', /Documentation Streams/i);
  await visit('/admin/sections', /Content Editor/i);
  await visit('/admin/translations', /Translations/i);
  await visit('/admin/publishing', /Publishing/i);
  await visit('/admin/users', /Users/i);

  await browser.close();

  const warnings = Array.from(consoleRecords
    .filter((record) => record.type === 'warning')
    .reduce((map, record) => {
      const current = map.get(record.text) || { type: record.type, text: record.text, count: 0 };
      current.count += 1;
      map.set(record.text, current);
      return map;
    }, new Map())
    .values());
  if (unexpectedErrors.length || unexpectedWarnings.length) {
    console.error(JSON.stringify({ visited, warnings, unexpectedErrors, unexpectedWarnings }, null, 2));
    throw new Error(`Browser smoke saw ${unexpectedErrors.length} unexpected console/page error(s) and ${unexpectedWarnings.length} unexpected warning(s).`);
  }

  console.log(JSON.stringify({
    ok: true,
    visited,
    warnings,
    console_error_count: 0,
    unexpected_warning_count: 0,
  }, null, 2));
}

main()
  .finally(shutdown)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
