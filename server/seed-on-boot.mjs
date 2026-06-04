// Idempotent boot-time seed. Runs on every server start; only inserts what's missing.
//
// Reads admin credentials from env vars:
//   ADMIN_EMAIL    — admin email; defaults to admin@example.com
//   ADMIN_PASSWORD — required for first-time seed; subsequent boots ignore it
//   COMPANY_SLUG   — defaults to 'demo'
//   COMPANY_NAME   — defaults to 'Demo Company'
//
// On a clean database: creates the company, the company-admin user, an initial
// branding row, and copies server/seed-state.json into the CMS state file so the
// docs grid + sections render on first paint. On an existing database: silently
// no-ops (we never reset passwords here — use the admin UI for that).

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, makeId, nowIso } from './db.mjs';
import { createUser, setUserRoles, findUserByEmail } from './auth.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DEFAULTS = {
  email: 'admin@example.com',
  // No default password — the operator must set ADMIN_PASSWORD on first deploy.
  companySlug: 'demo',
  companyName: 'Demo Company',
  adminName: 'Platform Admin',
};

function ensureCompany(slug, name) {
  const existing = db.prepare('SELECT * FROM companies WHERE slug = ?').get(slug);
  if (existing) return existing;
  const id = makeId('co');
  const now = nowIso();
  db.prepare(`
    INSERT INTO companies (id, slug, name, status, created_at, updated_at)
    VALUES (?, ?, ?, 'active', ?, ?)
  `).run(id, slug, name, now, now);
  db.prepare(`
    INSERT INTO company_branding (company_id, primary_color, accent_color, hero_title, hero_subtitle, description, footer_text, updated_at)
    VALUES (?, '#ff1b23', '#63cdff', ?, ?, ?, ?, ?)
  `).run(
    id,
    `${name} Documentation`,
    `Welcome. Sign in to view the latest game, back-office, and integration documentation prepared for your team.`,
    `${name} client area — internal & partner documentation, hosted on DocPilot.`,
    `${name} · Hosted by DocPilot`,
    now,
  );
  console.log(`[seed] Created company "${name}" (${slug}) → ${id}`);
  return db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
}

function ensureCmsState() {
  // Copy server/seed-state.json into the live state file if the live file is
  // missing or has no keys. Tenant docs live in legacy JSON state, not SQLite —
  // without this the docs grid in /c/<slug> renders empty even though
  // /docs/:slug fallback works.
  const seedPath = join(__dirname, 'seed-state.json');
  const stateFile = process.env.DOCPILOT_STATE_FILE
    || join(process.env.DOCPILOT_DATA_DIR || join(ROOT, '.docpilot-data'), 'cms-state.json');
  if (!existsSync(seedPath)) return;
  let live = { keys: {} };
  if (existsSync(stateFile)) {
    try { live = JSON.parse(readFileSync(stateFile, 'utf8')) || { keys: {} }; }
    catch { live = { keys: {} }; }
  }
  const liveKeyCount = Object.keys(live.keys || {}).length;
  if (liveKeyCount > 0) {
    console.log(`[seed] cms-state has ${liveKeyCount} key(s) already; skipping state seed.`);
    return;
  }
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
  mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, JSON.stringify(seed, null, 2));
  console.log(`[seed] Wrote initial cms-state with ${Object.keys(seed.keys || {}).length} key(s) → ${stateFile}`);
}

export async function seedOnBoot() {
  const slug = process.env.COMPANY_SLUG || DEFAULTS.companySlug;
  const name = process.env.COMPANY_NAME || DEFAULTS.companyName;
  const email = process.env.ADMIN_EMAIL || DEFAULTS.email;
  const password = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || DEFAULTS.adminName;

  ensureCmsState();

  const company = ensureCompany(slug, name);

  // Only attempt to create the admin user if password is set AND user doesn't already exist.
  const existing = findUserByEmail(company.id, email);
  if (existing) {
    console.log(`[seed] Admin "${email}" already exists for ${slug}; skipping.`);
    return;
  }

  if (!password) {
    console.warn(
      `[seed] No ADMIN_PASSWORD env var set — skipping admin user creation. ` +
      `Set ADMIN_PASSWORD on first boot to create "${email}" for company "${slug}".`,
    );
    return;
  }

  const user = await createUser({
    email,
    password,
    name: adminName,
    companyId: company.id,
    status: 'active',
  });
  setUserRoles(user.id, ['company-admin']);
  console.log(`[seed] Created admin user "${email}" → ${user.id}, role=company-admin`);
}
