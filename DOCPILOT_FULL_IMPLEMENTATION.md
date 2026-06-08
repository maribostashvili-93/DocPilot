# DocPilot — Full Implementation Plan

> Last updated: 2026-06-09  
> This file is the single source of truth for all implementation detail. All other documents are secondary.

---

## Work Order (Summary)

```
✅ Phase 1    — Planning (complete)
✅ Phase 2A   — Schema Completion (complete)

🔲 Phase 2B   — Storage Adapter Layer          ← start here
🔲 Phase 2C   — Permission System Refactor      ← parallel with 2B
🔲 Phase 2D   — API v2 Content Expansion        ← after 2B + 2C
🔲 Phase 2E   — Workflow Engine                 ← alongside 2D

🔲 Phase 3A   — Component Extraction (primitives)
🔲 Phase 3B   — Token Completion Pass
🔲 Phase 3C   — Responsive Audit
🔲 Phase 3D   — ResearchApp Design System

🔲 Phase 4A   — Comments System
🔲 Phase 4B   — Workflow Transition UI
🔲 Phase 4C   — Translation Locale Management
🔲 Phase 4D   — Product Members
🔲 Phase 4E   — Release Full Lifecycle UI

🔲 Phase 5A   — Research Backend
🔲 Phase 5B   — CMS Bridge

🔲 Phase 6A   — Reader Modernization
🔲 Phase 6B   — API Keys + Webhooks
```

---

## Current State (2026-06-09)

### What Works

| Layer | Status |
|-------|--------|
| SQLite schema | 23 tables — Phase 2A complete |
| Auth | bcrypt, sessions, rate limiting, secure cookies (`server/auth.mjs`) |
| Multi-tenant shell | companies, branding, company-admin, client area |
| Legacy CMS | products/documents/sections/translations/releases via JSON `kv_store` |
| API v2 | auth + tenant + users — content APIs still on legacy server |
| Design token system | `tokens.css`, `primitives.css`, `surfaces.css` — complete |
| Company Admin UI | B+ quality, design tokens 85% |
| Client Area | B quality, design tokens 75% |
| ResearchApp | mock data only, not connected to backend |

### What Is Missing

| Gap | Impact |
|-----|--------|
| No storage adapter layer | two parallel persistence systems (kv_store + SQLite) |
| No `can(user, action, resource)` | flat role map — no granular permissions |
| API v2 has no content routes | products/docs/sections/releases still on legacy server |
| No workflow engine on server | transitions are client-side or unvalidated |
| No comments system | section review flow incomplete |
| ResearchApp not wired to backend | AI center is mock UI only |
| `multitenant.css` token compliance 60% | hardcoded hex/font values remain |
| ResearchApp token compliance 5% | not integrated into design system |
| Responsive coverage thin | CMS + editor not audited below 1024px |

---

---

# ✅ Phase 1 — Planning (Complete)

**Produced:**

| File | Contents |
|------|---------|
| `WORKFLOW_MATRIX.md` | Canonical status transition rules for all entities |
| `PERMISSION_MATRIX.md` | Role baselines + scope layers |
| `DB_SCHEMA_DRAFT.md` | Target PostgreSQL/SQLite schema |

**Nothing to do here. Move to Phase 2.**

---

---

# ✅ Phase 2A — Schema Completion (Complete)

**Files changed:** `server/schema.sql`, `server/db.mjs`

### Tables Added

| Table | Purpose |
|-------|---------|
| `permission_grants` | Scoped `can(user, action, scope_id)` — replaces flat role map |
| `translation_locales` | Per document × locale status + completion % tracking |
| `translation_strings` | Per section × locale body — dirty/saved/review state |
| `release_snapshots` | Immutable content snapshot written at publish time |
| `release_items` | Documents + sections bundled inside a release with readiness score |
| `product_members` | Per-product role delegation without tenant-wide power |
| `comments` | Section-level threaded comments with `is_blocking` flag |
| `workflow_transitions` | Audit log of every status change |

### Columns Added (via `ensureColumn`)

| Table | Column | Purpose |
|-------|--------|---------|
| `sections` | `reviewer` | Reviewer user ID |
| `sections` | `has_unsafe_html` | blocks section from advancing to approved |
| `documents` | `has_unsafe_html` | blocks document from advancing |
| `releases` | `product_id` | top-level product grouping |
| `releases` | `snapshot_id` | FK to release_snapshots after publish |
| `releases` | `reviewer` | assigned reviewer user ID |
| `audit_events` | `product_id` | entity FK context for filtering |
| `audit_events` | `document_id` | entity FK context for filtering |
| `audit_events` | `section_id` | entity FK context for filtering |
| `audit_events` | `release_id` | entity FK context for filtering |

**Verified:** DB boot OK, all 23 tables present, all 10 columns added.

---

---

# 🔲 Phase 2B — Storage Adapter Layer

**Goal:** Bridge the two parallel persistence systems (legacy JSON kv_store + SQLite v2) without breaking existing reads. Dual-write until Phase 2D flips the primary.

**Depends on:** Phase 2A ✅  
**Independent of:** Phase 2C

---

## Files to Create

```
server/adapter/index.mjs
server/adapter/products.mjs
server/adapter/documents.mjs
server/adapter/sections.mjs
server/adapter/translations.mjs
server/adapter/releases.mjs
```

---

## `server/adapter/index.mjs`

```js
import * as products     from './products.mjs';
import * as documents    from './documents.mjs';
import * as sections     from './sections.mjs';
import * as translations from './translations.mjs';
import * as releases     from './releases.mjs';

const ADAPTERS = { products, documents, sections, translations, releases };

export function getAdapter(entityType) {
  const a = ADAPTERS[entityType];
  if (!a) throw new Error(`Unknown adapter type: ${entityType}`);
  return a;
}
```

---

## `server/adapter/products.mjs`

```js
import { db, makeId, nowIso } from '../db.mjs';
import { appendAudit } from '../auth.mjs';

// kv_store key format: "products_<companyId>"
function kvKey(companyId) { return `products_${companyId}`; }

function readKv(companyId) {
  const row = db.prepare(
    "SELECT value FROM kv_store WHERE company_scope = ? AND key = ?"
  ).get(companyId, kvKey(companyId));
  return row ? JSON.parse(row.value) : {};
}

function writeKv(companyId, data) {
  const now = nowIso();
  db.prepare(`
    INSERT INTO kv_store(company_scope, key, value, revision, updated_at)
    VALUES(?, ?, ?, 1, ?)
    ON CONFLICT(company_scope, key)
    DO UPDATE SET value = excluded.value, revision = revision + 1, updated_at = excluded.updated_at
  `).run(companyId, kvKey(companyId), JSON.stringify(data), now);
}

export function get(id) {
  // SQLite first
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (row) return row;
  // kv_store fallback (unmigrated rows)
  const all = db.prepare(
    "SELECT company_scope, value FROM kv_store WHERE key LIKE 'products_%'"
  ).all();
  for (const { company_scope, value } of all) {
    const map = JSON.parse(value);
    if (map[id]) return { ...map[id], _source: 'kv' };
  }
  return null;
}

export function list(companyId, filters = {}) {
  let q = 'SELECT * FROM products WHERE company_id = ?';
  const params = [companyId];
  if (filters.status) { q += ' AND status = ?'; params.push(filters.status); }
  q += ' ORDER BY nav_order ASC, created_at ASC';
  return db.prepare(q).all(...params);
}

export function save(entity, actorId) {
  const now = nowIso();
  const isNew = !entity.id;
  if (isNew) entity.id = entity.id || makeId('prod');

  // SQLite write (primary)
  db.prepare(`
    INSERT INTO products(id, company_id, name, studio, status, description, version, nav_order, created_at, updated_at)
    VALUES(@id, @company_id, @name, @studio, @status, @description, @version, @nav_order, @created_at, @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, studio = excluded.studio, status = excluded.status,
      description = excluded.description, version = excluded.version,
      nav_order = excluded.nav_order, updated_at = excluded.updated_at
  `).run({
    ...entity,
    created_at: entity.created_at || now,
    updated_at: now,
  });

  // kv_store dual-write (Phase 2B → 2D)
  const kv = readKv(entity.company_id);
  kv[entity.id] = { ...entity, updated_at: now };
  writeKv(entity.company_id, kv);

  appendAudit({
    companyId: entity.company_id,
    userId: actorId,
    action: isNew ? 'product.create' : 'product.update',
    entityType: 'product',
    entityId: entity.id,
    productId: entity.id,
  });

  return entity;
}

export function remove(id, actorId) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) return false;

  db.prepare("UPDATE products SET status = 'archived', updated_at = ? WHERE id = ?")
    .run(nowIso(), id);

  const kv = readKv(product.company_id);
  if (kv[id]) { kv[id].status = 'archived'; writeKv(product.company_id, kv); }

  appendAudit({
    companyId: product.company_id,
    userId: actorId,
    action: 'product.archive',
    entityType: 'product',
    entityId: id,
    productId: id,
  });

  return true;
}
```

---

## `server/adapter/documents.mjs`

```js
import { db, makeId, makeSlug, nowIso } from '../db.mjs';
import { appendAudit } from '../auth.mjs';

function kvKey(companyId) { return `documents_${companyId}`; }

function readKv(companyId) {
  const row = db.prepare(
    "SELECT value FROM kv_store WHERE company_scope = ? AND key = ?"
  ).get(companyId, kvKey(companyId));
  return row ? JSON.parse(row.value) : {};
}

function writeKv(companyId, data) {
  const now = nowIso();
  db.prepare(`
    INSERT INTO kv_store(company_scope, key, value, revision, updated_at)
    VALUES(?, ?, ?, 1, ?)
    ON CONFLICT(company_scope, key)
    DO UPDATE SET value = excluded.value, revision = revision + 1, updated_at = excluded.updated_at
  `).run(companyId, kvKey(companyId), JSON.stringify(data), now);
}

export function get(id) {
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id) ?? null;
}

export function getBySlug(companyId, slug) {
  return db.prepare('SELECT * FROM documents WHERE company_id = ? AND slug = ?')
    .get(companyId, slug) ?? null;
}

export function list(companyId, filters = {}) {
  let q = 'SELECT * FROM documents WHERE company_id = ?';
  const params = [companyId];
  if (filters.productId) { q += ' AND product_id = ?'; params.push(filters.productId); }
  if (filters.status)    { q += ' AND status = ?';     params.push(filters.status); }
  q += ' ORDER BY nav_order ASC, created_at ASC';
  return db.prepare(q).all(...params);
}

export function save(entity, actorId) {
  const now = nowIso();
  const isNew = !entity.id;
  if (isNew) {
    entity.id = makeId('doc');
    entity.slug = entity.slug || makeSlug();
  }

  db.prepare(`
    INSERT INTO documents(
      id, company_id, product_id, slug, title, type, status, version,
      description, audience, taxonomy, nav_placement, nav_order,
      owner, reviewer, template_id, has_unsafe_html, created_at, updated_at
    ) VALUES(
      @id, @company_id, @product_id, @slug, @title, @type, @status, @version,
      @description, @audience, @taxonomy, @nav_placement, @nav_order,
      @owner, @reviewer, @template_id, @has_unsafe_html, @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title, type = excluded.type, status = excluded.status,
      version = excluded.version, description = excluded.description,
      audience = excluded.audience, taxonomy = excluded.taxonomy,
      nav_placement = excluded.nav_placement, nav_order = excluded.nav_order,
      owner = excluded.owner, reviewer = excluded.reviewer,
      has_unsafe_html = excluded.has_unsafe_html, updated_at = excluded.updated_at
  `).run({
    ...entity,
    has_unsafe_html: entity.has_unsafe_html ?? 0,
    created_at: entity.created_at || now,
    updated_at: now,
  });

  const kv = readKv(entity.company_id);
  kv[entity.id] = { ...entity, updated_at: now };
  writeKv(entity.company_id, kv);

  appendAudit({
    companyId: entity.company_id,
    userId: actorId,
    action: isNew ? 'document.create' : 'document.update',
    entityType: 'document',
    entityId: entity.id,
    productId: entity.product_id,
    documentId: entity.id,
  });

  return entity;
}

export function remove(id, actorId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!doc) return false;
  db.prepare("UPDATE documents SET status = 'archived', updated_at = ? WHERE id = ?")
    .run(nowIso(), id);
  appendAudit({
    companyId: doc.company_id, userId: actorId,
    action: 'document.archive', entityType: 'document',
    entityId: id, documentId: id,
  });
  return true;
}
```

---

## `server/adapter/sections.mjs`

```js
import { db, makeId, nowIso } from '../db.mjs';
import { appendAudit } from '../auth.mjs';

export function get(id) {
  return db.prepare('SELECT * FROM sections WHERE id = ?').get(id) ?? null;
}

export function listByDocument(documentId) {
  return db.prepare(
    'SELECT * FROM sections WHERE document_id = ? ORDER BY position ASC, created_at ASC'
  ).all(documentId);
}

export function list(companyId, filters = {}) {
  let q = 'SELECT * FROM sections WHERE company_id = ?';
  const params = [companyId];
  if (filters.documentId) { q += ' AND document_id = ?'; params.push(filters.documentId); }
  if (filters.status)     { q += ' AND status = ?';      params.push(filters.status); }
  q += ' ORDER BY position ASC';
  return db.prepare(q).all(...params);
}

export function save(entity, actorId) {
  const now = nowIso();
  const isNew = !entity.id;
  if (isNew) entity.id = makeId('sec');

  db.prepare(`
    INSERT INTO sections(
      id, company_id, document_id, number, slug, title, summary, html,
      status, owner, reviewer, has_unsafe_html, position, created_at, updated_at
    ) VALUES(
      @id, @company_id, @document_id, @number, @slug, @title, @summary, @html,
      @status, @owner, @reviewer, @has_unsafe_html, @position, @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title, summary = excluded.summary, html = excluded.html,
      status = excluded.status, owner = excluded.owner, reviewer = excluded.reviewer,
      has_unsafe_html = excluded.has_unsafe_html, position = excluded.position,
      updated_at = excluded.updated_at
  `).run({
    ...entity,
    has_unsafe_html: entity.has_unsafe_html ?? 0,
    created_at: entity.created_at || now,
    updated_at: now,
  });

  const doc = db.prepare('SELECT product_id FROM documents WHERE id = ?')
    .get(entity.document_id);

  appendAudit({
    companyId: entity.company_id, userId: actorId,
    action: isNew ? 'section.create' : 'section.update',
    entityType: 'section', entityId: entity.id,
    productId: doc?.product_id,
    documentId: entity.document_id,
    sectionId: entity.id,
  });

  return entity;
}

export function remove(id, actorId) {
  const sec = db.prepare('SELECT * FROM sections WHERE id = ?').get(id);
  if (!sec) return false;
  db.prepare("UPDATE sections SET status = 'archived', updated_at = ? WHERE id = ?")
    .run(nowIso(), id);
  appendAudit({
    companyId: sec.company_id, userId: actorId,
    action: 'section.delete', entityType: 'section',
    entityId: id, documentId: sec.document_id, sectionId: id,
  });
  return true;
}
```

---

## `server/adapter/translations.mjs`

```js
import { db, makeId, nowIso } from '../db.mjs';

export function getLocales(documentId) {
  return db.prepare(
    'SELECT * FROM translation_locales WHERE document_id = ? ORDER BY locale ASC'
  ).all(documentId);
}

export function saveLocale({ companyId, documentId, locale, status, completionPct, reviewer }) {
  const now = nowIso();
  const existing = db.prepare(
    'SELECT id FROM translation_locales WHERE document_id = ? AND locale = ?'
  ).get(documentId, locale);

  const id = existing?.id || makeId('tl');

  db.prepare(`
    INSERT INTO translation_locales(id, company_id, document_id, locale, status, completion_pct, reviewer, created_at, updated_at)
    VALUES(@id, @companyId, @documentId, @locale, @status, @completionPct, @reviewer, @now, @now)
    ON CONFLICT(document_id, locale) DO UPDATE SET
      status = excluded.status,
      completion_pct = excluded.completion_pct,
      reviewer = excluded.reviewer,
      updated_at = excluded.updated_at
  `).run({ id, companyId, documentId, locale, status, completionPct: completionPct ?? 0, reviewer: reviewer ?? null, now });

  return db.prepare('SELECT * FROM translation_locales WHERE id = ?').get(id);
}

export function getStrings(sectionId, locale = null) {
  if (locale) {
    return db.prepare(
      'SELECT * FROM translation_strings WHERE section_id = ? AND locale = ?'
    ).all(sectionId, locale);
  }
  return db.prepare(
    'SELECT * FROM translation_strings WHERE section_id = ?'
  ).all(sectionId);
}

export function saveString({ companyId, sectionId, locale, body, state, translatedBy, reviewedBy }) {
  const now = nowIso();
  const existing = db.prepare(
    'SELECT id FROM translation_strings WHERE section_id = ? AND locale = ?'
  ).get(sectionId, locale);

  const id = existing?.id || makeId('ts');

  db.prepare(`
    INSERT INTO translation_strings(id, company_id, section_id, locale, body, state, translated_by, reviewed_by, created_at, updated_at)
    VALUES(@id, @companyId, @sectionId, @locale, @body, @state, @translatedBy, @reviewedBy, @now, @now)
    ON CONFLICT(section_id, locale) DO UPDATE SET
      body = excluded.body,
      state = excluded.state,
      translated_by = excluded.translated_by,
      reviewed_by = excluded.reviewed_by,
      updated_at = excluded.updated_at
  `).run({ id, companyId, sectionId, locale, body, state: state || 'dirty', translatedBy: translatedBy ?? null, reviewedBy: reviewedBy ?? null, now });

  return db.prepare('SELECT * FROM translation_strings WHERE id = ?').get(id);
}
```

---

## `server/adapter/releases.mjs`

```js
import { db, makeId, nowIso } from '../db.mjs';
import { appendAudit } from '../auth.mjs';

export function get(id) {
  return db.prepare('SELECT * FROM releases WHERE id = ?').get(id) ?? null;
}

export function list(companyId, filters = {}) {
  let q = 'SELECT * FROM releases WHERE company_id = ?';
  const params = [companyId];
  if (filters.productId)  { q += ' AND product_id = ?';  params.push(filters.productId); }
  if (filters.documentId) { q += ' AND document_id = ?'; params.push(filters.documentId); }
  if (filters.status)     { q += ' AND status = ?';      params.push(filters.status); }
  q += ' ORDER BY created_at DESC';
  return db.prepare(q).all(...params);
}

export function save(entity, actorId) {
  const now = nowIso();
  const isNew = !entity.id;
  if (isNew) entity.id = makeId('rel');

  db.prepare(`
    INSERT INTO releases(
      id, company_id, product_id, document_id, version, label, status,
      notes, environment, snapshot_id, reviewer, created_at
    ) VALUES(
      @id, @company_id, @product_id, @document_id, @version, @label, @status,
      @notes, @environment, @snapshot_id, @reviewer, @created_at
    )
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label, status = excluded.status,
      notes = excluded.notes, environment = excluded.environment,
      snapshot_id = excluded.snapshot_id, reviewer = excluded.reviewer
  `).run({
    ...entity,
    created_at: entity.created_at || now,
  });

  appendAudit({
    companyId: entity.company_id, userId: actorId,
    action: isNew ? 'release.create' : 'release.update',
    entityType: 'release', entityId: entity.id,
    productId: entity.product_id, releaseId: entity.id,
  });

  return entity;
}

// Creates an immutable snapshot at publish time
export function snapshot(releaseId, payload, actorId) {
  const now = nowIso();
  const snapshotId = makeId('snap');

  db.transaction(() => {
    db.prepare(`
      INSERT INTO release_snapshots(id, release_id, payload, created_at)
      VALUES(?, ?, ?, ?)
    `).run(snapshotId, releaseId, JSON.stringify(payload), now);

    db.prepare('UPDATE releases SET snapshot_id = ?, published_at = ? WHERE id = ?')
      .run(snapshotId, now, releaseId);
  })();

  return snapshotId;
}
```

---

## Dual-Write Strategy

```
Phase 2B  save() ──► SQLite  (primary)
                ──► kv_store (fallback, backwards-compat)

Phase 2D  save() ──► SQLite  (primary, only)
          kv_store write dropped

Phase 5   kv_store removed entirely
```

---

---

# 🔲 Phase 2C — Permission System Refactor

**Goal:** Replace flat `WRITE_PERMISSIONS[role]` with `can(user, action, resource, scope)`.  
**File to create:** `server/authz.mjs`  
**Files to change:** `server/api-v2.mjs`, `server/docpilot-server.mjs`, `src/storage.ts`  
**Depends on:** Phase 2A (`permission_grants` table) ✅  
**Independent of:** Phase 2B

---

## `server/authz.mjs` — Complete File

```js
import { db } from './db.mjs';
import { nowIso } from './db.mjs';

// ─── Role default baselines ───────────────────────────────────────────────────
// '*' = all actions. 'product.*' = all product.* actions.
const ROLE_DEFAULTS = {
  superadmin: ['*'],

  'company-admin': [
    'product.*', 'document.*', 'section.*', 'media.*',
    'user.view', 'user.invite', 'user.edit',
    'settings.view', 'settings.edit',
  ],

  editor: [
    'product.view',
    'document.view', 'document.create', 'document.edit',
    'section.view', 'section.create', 'section.edit', 'section.comment',
    'translation.view',
    'media.view', 'media.upload', 'media.edit',
  ],

  reviewer: [
    'document.view', 'document.review', 'document.approve',
    'section.view', 'section.comment', 'section.review', 'section.approve',
    'translation.view', 'translation.review',
  ],

  viewer: [
    'product.view', 'document.view', 'section.view',
    'translation.view', 'release.view', 'media.view',
  ],

  partner: [
    'document.view', 'section.view', 'section.comment',
    'translation.view',
  ],

  tam: [
    'product.view',
    'document.view', 'document.edit', 'document.review',
    'section.view', 'section.edit', 'section.comment', 'section.review',
    'translation.view', 'translation.edit',
    'release.view', 'release.create',
  ],

  developer: [
    'document.view', 'document.edit',
    'section.view', 'section.edit',
    'media.view', 'media.upload', 'media.edit',
    'settings.view',
    'integration.view', 'integration.manage',
  ],

  'account-manager': [
    'product.view', 'document.view', 'section.view',
  ],
};

// ─── Full action catalog ──────────────────────────────────────────────────────
// Documented here for reference. Enforced via ROLE_DEFAULTS + permission_grants.
export const ALL_ACTIONS = [
  'product.view',    'product.create',  'product.edit',
  'product.archive', 'product.manage',

  'document.view',   'document.create', 'document.edit',
  'document.review', 'document.approve','document.archive',

  'section.view',    'section.create',  'section.edit',
  'section.comment', 'section.review',  'section.approve',
  'section.delete',

  'translation.view','translation.edit','translation.review',
  'translation.publish',

  'release.view',    'release.create',  'release.review',
  'release.approve', 'release.stage',   'release.publish',
  'release.rollback',

  'media.view',      'media.upload',    'media.edit',
  'media.delete',    'media.replace',

  'user.view',       'user.invite',     'user.edit',
  'user.deactivate', 'access.manage',

  'settings.view',   'settings.edit',
  'integration.view','integration.manage',
  'webhook.manage',  'api-key.manage',
];

// ─── can() ────────────────────────────────────────────────────────────────────
/**
 * Check if user (with given roles array) can perform action.
 *
 * @param {object} user        — users row from DB
 * @param {string[]} roles     — user's roles (from user_roles table)
 * @param {string} action      — e.g. 'document.edit'
 * @param {string} scopeType   — 'tenant' | 'product' | 'document'
 * @param {string|null} scopeId — product_id or document_id (null = tenant-wide)
 */
export function can(user, roles, action, scopeType = 'tenant', scopeId = null) {
  if (!user || !action) return false;

  // 1. superadmin bypass
  if (roles.includes('superadmin')) return true;

  const [resource] = action.split('.');

  // 2. role default baseline
  for (const role of roles) {
    const grants = ROLE_DEFAULTS[role] ?? [];
    if (grants.includes('*'))              return true;
    if (grants.includes(action))           return true;
    if (grants.includes(`${resource}.*`))  return true;
  }

  // 3. explicit permission_grants rows (scoped overrides)
  const placeholders = roles.map(() => '?').join(',');
  const row = db.prepare(`
    SELECT id FROM permission_grants
    WHERE company_id = ?
      AND (user_id = ? OR role IN (${placeholders || "'__none__'"}))
      AND action = ?
      AND (scope_id IS NULL OR scope_id = ?)
      AND (expires_at IS NULL OR expires_at > ?)
    LIMIT 1
  `).get(
    user.company_id,
    user.id,
    ...roles,
    action,
    scopeId,
    nowIso(),
  );

  return !!row;
}

// ─── Middleware factory ───────────────────────────────────────────────────────
/**
 * Returns a node-style middleware that checks can() and sends 403 if denied.
 * Usage:  router.put('/path', requireCan('document.edit'), handler)
 */
export function requireCan(action, scopeType = 'tenant', getScopeId = () => null) {
  return function(req, res, next) {
    const { user, roles } = req.auth ?? {};
    if (!user) return send403(res, 'Not authenticated');
    const scopeId = getScopeId(req);
    if (!can(user, roles, action, scopeType, scopeId)) {
      return send403(res, `Missing permission: ${action}`);
    }
    next?.();
  };
}

function send403(res, message) {
  res.writeHead(403, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}
```

---

## Migration: `docpilot-server.mjs`

### Before:
```js
if (!WRITE_PERMISSIONS[role]?.has('documents:write'))
  return send(res, 403, { error: 'Forbidden' });
```

### After:
```js
import { can } from './authz.mjs';
// req.auth = { user, roles } — set by loadAuthFromRequest() from auth.mjs
const { user, roles } = req.auth;
if (!can(user, roles, 'document.edit'))
  return send(res, 403, { error: 'Forbidden' });
```

---

## Migration: `src/storage.ts`

```ts
// canRoleWrite() stays as a UI hint only (button enable/disable)
// Server is the authority — storage.ts checks are defensive hints only
// After Phase 2D, trust server responses instead

export function canRoleWrite(role: UserRole, permission: WritePermission): boolean {
  // This is a UI hint only — server is the source of truth.
  return WRITE_PERMISSIONS[role]?.includes(permission) ?? false;
}
```

---

---

# 🔲 Phase 2D — API v2 Content Expansion

**Goal:** Move all content CRUD from the legacy server to `/api/v2/`.  
**File to change:** `server/api-v2.mjs`  
**Depends on:** Phase 2B ✅ + Phase 2C ✅

---

## Complete Route Table

### Products
```
GET    /api/v2/companies/:cid/products
POST   /api/v2/companies/:cid/products
GET    /api/v2/companies/:cid/products/:pid
PUT    /api/v2/companies/:cid/products/:pid
DELETE /api/v2/companies/:cid/products/:pid
PUT    /api/v2/companies/:cid/products/:pid/status        — workflow transition
```

### Documents
```
GET    /api/v2/companies/:cid/products/:pid/documents
POST   /api/v2/companies/:cid/products/:pid/documents
GET    /api/v2/companies/:cid/documents/:did
PUT    /api/v2/companies/:cid/documents/:did
DELETE /api/v2/companies/:cid/documents/:did
POST   /api/v2/companies/:cid/documents/:did/transition   — status change via workflow engine
GET    /api/v2/companies/:cid/documents/:did/transitions  — history
```

### Sections
```
GET    /api/v2/companies/:cid/documents/:did/sections
POST   /api/v2/companies/:cid/documents/:did/sections
GET    /api/v2/companies/:cid/sections/:sid
PUT    /api/v2/companies/:cid/sections/:sid
DELETE /api/v2/companies/:cid/sections/:sid
POST   /api/v2/companies/:cid/sections/:sid/transition
GET    /api/v2/companies/:cid/sections/:sid/comments
POST   /api/v2/companies/:cid/sections/:sid/comments
PUT    /api/v2/companies/:cid/comments/:coid/resolve
```

### Translations
```
GET    /api/v2/companies/:cid/documents/:did/translation-locales
PUT    /api/v2/companies/:cid/documents/:did/translation-locales/:locale/status
GET    /api/v2/companies/:cid/sections/:sid/translation-strings
PUT    /api/v2/companies/:cid/sections/:sid/translation-strings/:locale
```

### Releases
```
GET    /api/v2/companies/:cid/products/:pid/releases
POST   /api/v2/companies/:cid/products/:pid/releases
GET    /api/v2/companies/:cid/releases/:rid
PUT    /api/v2/companies/:cid/releases/:rid
POST   /api/v2/companies/:cid/releases/:rid/transition    — draft→review→approved→staged→published
POST   /api/v2/companies/:cid/releases/:rid/rollback
GET    /api/v2/companies/:cid/releases/:rid/readiness     — readiness score + blocking list
```

### Media
```
POST   /api/v2/companies/:cid/media             — multipart upload
GET    /api/v2/companies/:cid/media
GET    /api/v2/companies/:cid/media/:mid
PUT    /api/v2/companies/:cid/media/:mid
DELETE /api/v2/companies/:cid/media/:mid
```

---

## Route Handler Pattern (apply to every route)

```js
// GET /api/v2/companies/:cid/products
case matchPath('GET', '/api/v2/companies/:cid/products'): {
  const { user, roles } = await loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!can(user, roles, 'product.view')) return send(res, 403, { error: 'Forbidden' });

  const cid = pathParams.cid;
  if (user.company_id !== cid && !roles.includes('superadmin'))
    return send(res, 403, { error: 'Tenant mismatch' });

  const products = await productAdapter.list(cid, {
    status: url.searchParams.get('status') ?? undefined,
  });
  return send(res, 200, { products });
}

// POST /api/v2/companies/:cid/products
case matchPath('POST', '/api/v2/companies/:cid/products'): {
  const { user, roles } = await loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!can(user, roles, 'product.create')) return send(res, 403, { error: 'Forbidden' });

  const body = await readBody(req);
  if (!body.name?.trim()) return send(res, 400, { error: 'name is required' });

  const product = await productAdapter.save({
    company_id: pathParams.cid,
    name: body.name.trim(),
    studio: body.studio ?? null,
    status: 'draft',
    description: body.description ?? null,
    version: body.version ?? null,
    nav_order: body.nav_order ?? 1,
  }, user.id);

  return send(res, 201, { product });
}
```

---

## Readiness Endpoint — `GET /releases/:rid/readiness`

```js
{
  const release = releaseAdapter.get(pathParams.rid);
  if (!release) return send(res, 404, { error: 'Release not found' });

  const sections = db.prepare(
    `SELECT s.* FROM sections s
     JOIN documents d ON d.id = s.document_id
     WHERE d.id = ?`
  ).all(release.document_id);

  const totalSections    = sections.length;
  const approvedSections = sections.filter(s => s.status === 'approved').length;
  const hasUnsafeHtml    = sections.some(s => s.has_unsafe_html);
  const hasNotes         = !!release.notes?.trim();
  const hasSnapshot      = !!release.snapshot_id;
  const hasReviewer      = !!release.reviewer;

  const locales = db.prepare(
    'SELECT * FROM translation_locales WHERE document_id = ?'
  ).all(release.document_id);
  const translationOk = locales.every(l => l.completion_pct >= 90);

  return send(res, 200, {
    readiness: {
      sectionsApproved:     { total: totalSections, approved: approvedSections, ok: approvedSections === totalSections },
      translationThreshold: { ok: translationOk, locales: locales.map(l => ({ locale: l.locale, pct: l.completion_pct })) },
      releaseNotes:         { ok: hasNotes },
      snapshot:             { ok: hasSnapshot },
      unsafeHtml:           { ok: !hasUnsafeHtml },
      reviewer:             { ok: hasReviewer },
      overallReady:         approvedSections === totalSections && !hasUnsafeHtml && hasNotes && translationOk && hasReviewer,
    },
  });
}
```

---

---

# 🔲 Phase 2E — Workflow Engine

**Goal:** Enforce transition rules and blocking conditions server-side before any status change.  
**File to create:** `server/workflow.mjs`  
**Depends on:** Phase 2A ✅ (`workflow_transitions`, `comments` tables)

---

## `server/workflow.mjs` — Complete File

```js
import { db } from './db.mjs';
import { makeId, nowIso } from './db.mjs';

// ─── Allowed transitions ──────────────────────────────────────────────────────
const TRANSITIONS = {
  product: {
    draft:     ['review'],
    review:    ['published', 'archived'],
    published: ['review', 'archived'],
  },
  document: {
    draft:     ['review'],
    review:    ['draft', 'approved'],
    approved:  ['draft', 'published'],
    published: ['review', 'archived'],
    archived:  ['draft'],
  },
  section: {
    draft:    ['review'],
    review:   ['draft', 'approved'],
    approved: ['draft', 'published'],
    published:['draft', 'archived'],
  },
  'translation-locale': {
    'not-started': ['in-progress'],
    'in-progress': ['review'],
    review:        ['in-progress', 'published'],
    published:     ['in-progress'],
  },
  release: {
    draft:    ['review'],
    review:   ['draft', 'approved'],
    approved: ['staged'],
    staged:   ['approved', 'published'],
    published:['rolled-back'],
  },
};

// ─── validateTransition ───────────────────────────────────────────────────────
export function validateTransition(entityType, from, to) {
  const allowed = TRANSITIONS[entityType]?.[from] ?? [];
  if (!allowed.includes(to)) {
    throw Object.assign(
      new Error(`Invalid transition: ${entityType} ${from} → ${to}. Allowed: ${allowed.join(', ') || 'none'}`),
      { code: 'INVALID_TRANSITION', statusCode: 422 }
    );
  }
}

// ─── checkBlockingRules ───────────────────────────────────────────────────────
// Returns string[] of blocking issue messages. Empty array = no blocks.
export function checkBlockingRules(entityType, entityId) {
  const issues = [];

  if (entityType === 'section') {
    const s = db.prepare('SELECT * FROM sections WHERE id = ?').get(entityId);
    if (!s) return ['Section not found'];
    if (!s.title?.trim())  issues.push('Section title is empty');
    if (s.has_unsafe_html) issues.push('Section contains unsafe HTML — review and clear flag before approving');
    if (!s.reviewer)       issues.push('Section has no assigned reviewer');

    const blocking = db.prepare(
      'SELECT COUNT(*) as n FROM comments WHERE section_id = ? AND is_blocking = 1 AND resolved = 0'
    ).get(entityId);
    if (blocking.n > 0) issues.push(`${blocking.n} unresolved blocking comment(s) remain`);
  }

  if (entityType === 'document') {
    const d = db.prepare('SELECT * FROM documents WHERE id = ?').get(entityId);
    if (!d) return ['Document not found'];
    if (d.has_unsafe_html) issues.push('Document contains unsafe HTML');
    if (!d.reviewer)       issues.push('Document has no assigned reviewer');

    const draftSections = db.prepare(
      "SELECT COUNT(*) as n FROM sections WHERE document_id = ? AND status IN ('draft', 'review')"
    ).get(entityId);
    if (draftSections.n > 0)
      issues.push(`${draftSections.n} section(s) still in draft or review — all must be approved first`);
  }

  if (entityType === 'release') {
    const r = db.prepare('SELECT * FROM releases WHERE id = ?').get(entityId);
    if (!r) return ['Release not found'];
    if (!r.notes?.trim()) issues.push('Release notes are empty');
    if (!r.reviewer)      issues.push('Release has no assigned reviewer');

    const locales = db.prepare(
      'SELECT locale, completion_pct FROM translation_locales WHERE document_id = ?'
    ).all(r.document_id);
    const below = locales.filter(l => l.completion_pct < 90);
    if (below.length > 0)
      issues.push(`Translation incomplete: ${below.map(l => `${l.locale} ${l.completion_pct}%`).join(', ')} (min 90%)`);
  }

  return issues;
}

// ─── recordTransition ─────────────────────────────────────────────────────────
export function recordTransition(entityType, entityId, from, to, actorId, note = null) {
  const tableMap = {
    product:  'products',
    document: 'documents',
    section:  'sections',
    release:  'releases',
    'translation-locale': 'translation_locales',
  };
  const entity = db.prepare(`SELECT company_id FROM ${tableMap[entityType]} WHERE id = ?`).get(entityId);
  if (!entity) throw new Error(`${entityType} ${entityId} not found`);

  db.prepare(`
    INSERT INTO workflow_transitions(id, company_id, entity_type, entity_id, from_status, to_status, actor_id, note, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(makeId('wt'), entity.company_id, entityType, entityId, from, to, actorId, note, nowIso());
}

// ─── applyTransition ──────────────────────────────────────────────────────────
// Full pipeline: validate → check blocking (if moving forward) → update status → record
export function applyTransition(entityType, entityId, to, actorId, note = null) {
  const tableMap = {
    product:  'products',
    document: 'documents',
    section:  'sections',
    release:  'releases',
    'translation-locale': 'translation_locales',
  };
  const entity = db.prepare(`SELECT * FROM ${tableMap[entityType]} WHERE id = ?`).get(entityId);
  if (!entity) throw Object.assign(new Error(`${entityType} not found`), { statusCode: 404 });

  const from = entity.status;
  validateTransition(entityType, from, to);

  const forwardBlockingTargets = ['approved', 'published', 'staged'];
  if (forwardBlockingTargets.includes(to)) {
    const issues = checkBlockingRules(entityType, entityId);
    if (issues.length > 0)
      throw Object.assign(
        new Error(`Transition blocked: ${issues.join('; ')}`),
        { code: 'TRANSITION_BLOCKED', issues, statusCode: 422 }
      );
  }

  db.transaction(() => {
    db.prepare(`UPDATE ${tableMap[entityType]} SET status = ?, updated_at = ? WHERE id = ?`)
      .run(to, nowIso(), entityId);
    recordTransition(entityType, entityId, from, to, actorId, note);
  })();

  return { from, to, entityId, entityType };
}
```

---

## Transition Route Pattern (in `api-v2.mjs`)

```js
// POST /api/v2/companies/:cid/sections/:sid/transition
case matchPath('POST', '/api/v2/companies/:cid/sections/:sid/transition'): {
  const { user, roles } = await loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });

  const body = await readBody(req);
  const { to, note } = body;
  if (!to) return send(res, 400, { error: 'to is required' });

  const actionMap = { review: 'section.review', approved: 'section.approve', draft: 'section.edit' };
  const requiredAction = actionMap[to] ?? 'section.edit';
  if (!can(user, roles, requiredAction)) return send(res, 403, { error: 'Forbidden' });

  try {
    const result = applyTransition('section', pathParams.sid, to, user.id, note ?? null);
    return send(res, 200, { transition: result });
  } catch (err) {
    if (err.statusCode === 422)
      return send(res, 422, { error: err.message, issues: err.issues ?? [] });
    throw err;
  }
}
```

---

---

# 🔲 Phase 3A — Component Extraction

**Goal:** Extract duplicated shell-local components into `src/styles/primitives.css` as single-source `.ds-*` classes.  
**File to change:** `src/styles/primitives.css`  
**Shell files to clean:** `src/multitenant/multitenant.css`, `company-cms.css`, `company-admin.css`, `src/styles.css`

---

## Components to Add to `primitives.css`

### `.ds-topbar-pill`

```css
/* Replaces: .cms-nav-pill, .ca-topbar-tab, .client-topbar-item */
.ds-topbar-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-height: 36px;
  padding: 0 14px;
  border-radius: var(--ds-radius-pill);
  font-family: var(--ds-font-display);
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-text-secondary);
  border: 1px solid transparent;
  transition: background var(--ds-transition-fast), color var(--ds-transition-fast);
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
}
.ds-topbar-pill:hover { background: var(--ds-bg-surface-soft); color: var(--ds-text-primary); }
.ds-topbar-pill.active,
.ds-topbar-pill[aria-current="page"] {
  background: var(--ds-bg-surface-tint);
  color: var(--ds-accent-secondary);
}
```

### `.ds-empty-state`

```css
.ds-empty-state {
  display: grid;
  place-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-16) var(--ds-space-8);
  text-align: center;
}
.ds-empty-state-icon  { font-size: 32px; opacity: 0.35; }
.ds-empty-state-title { font-family: var(--ds-font-display); font-size: var(--ds-text-lg); font-weight: var(--ds-font-weight-bold); color: var(--ds-text-primary); }
.ds-empty-state-body  { font-size: var(--ds-text-md); color: var(--ds-text-secondary); max-width: 380px; }
```

### `.ds-page-header`

```css
.ds-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);
  padding: var(--ds-space-6) 0 var(--ds-space-5);
  flex-wrap: wrap;
}
.ds-page-header-title   { font-family: var(--ds-font-display); font-size: var(--ds-text-2xl); font-weight: var(--ds-font-weight-heavy); color: var(--ds-text-primary); }
.ds-page-header-sub     { font-size: var(--ds-text-sm); color: var(--ds-text-secondary); margin-top: 2px; }
.ds-page-header-actions { display: flex; align-items: center; gap: var(--ds-space-2); flex-shrink: 0; }
```

### `.ds-table-actions`

```css
.ds-table-actions { display: flex; align-items: center; gap: var(--ds-space-1); opacity: 0; transition: opacity var(--ds-transition-fast); }
.ds-table tr:hover .ds-table-actions,
.ds-table tr:focus-within .ds-table-actions { opacity: 1; }
```

### `.ds-dialog`

```css
.ds-dialog-backdrop {
  position: fixed; inset: 0;
  background: var(--ds-bg-overlay);
  z-index: var(--ds-z-modal-backdrop);
  display: grid; place-items: center; padding: var(--ds-space-6);
}
.ds-dialog {
  background: var(--ds-bg-surface);
  border: 1px solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-lg);
  width: 100%; max-width: 520px;
  z-index: var(--ds-z-modal);
}
.ds-dialog-header { padding: var(--ds-space-5) var(--ds-space-6); border-bottom: 1px solid var(--ds-border-subtle); display: flex; align-items: center; justify-content: space-between; }
.ds-dialog-title  { font-family: var(--ds-font-display); font-size: var(--ds-text-lg); font-weight: var(--ds-font-weight-bold); color: var(--ds-text-primary); }
.ds-dialog-body   { padding: var(--ds-space-5) var(--ds-space-6); }
.ds-dialog-footer { padding: var(--ds-space-4) var(--ds-space-6); border-top: 1px solid var(--ds-border-subtle); display: flex; justify-content: flex-end; gap: var(--ds-space-2); }
```

### `.ds-section-card`

```css
.ds-section-card { background: var(--ds-bg-surface); border: 1px solid var(--ds-border-subtle); border-radius: var(--ds-radius-lg); padding: var(--ds-space-4) var(--ds-space-5); transition: border-color var(--ds-transition-fast), box-shadow var(--ds-transition-fast); }
.ds-section-card:hover { border-color: var(--ds-border-strong); box-shadow: var(--ds-shadow-sm); }
.ds-section-card-header { display: flex; align-items: center; justify-content: space-between; gap: var(--ds-space-3); margin-bottom: var(--ds-space-2); }
```

### Missing status badge variants

```css
.ds-status-approved    { background: var(--ds-status-info-bg);    color: var(--ds-status-info-fg); }
.ds-status-staged      { background: var(--ds-amber-50);          color: var(--ds-amber-800); }
.ds-status-rolled-back { background: var(--ds-status-neutral-bg); color: var(--ds-status-neutral-fg); }
.ds-status-not-started { background: var(--ds-bg-surface-soft);   color: var(--ds-text-muted); }
.ds-status-in-progress { background: var(--ds-blue-50);           color: var(--ds-blue-700); }
```

---

## Cleanup Checklist

1. `multitenant.css` — delete `.cms-nav-pill` → replace usages with `.ds-topbar-pill`
2. `company-admin.css` — delete `.ca-topbar-tab`
3. `company-cms.css` — delete `.client-topbar-item`
4. All shells — delete local empty-state blocks
5. All shells — delete local dialog/modal CSS → use `.ds-dialog`

---

---

# 🔲 Phase 3B — Token Completion Pass

**Goal:** Replace all hardcoded hex/font/radius/shadow values with `var(--ds-*)` tokens.  
**Target files (in priority order):**
1. `src/multitenant/multitenant.css` — most violations
2. `src/styles.css` — ~60–80 replacements
3. `src/multitenant/research.css` — full rework, currently 5% compliance

---

## Finding Violations

```bash
# Hardcoded hex colors
rg -n '#[0-9a-fA-F]{3,8}' src/multitenant/multitenant.css

# Raw rgba/rgb
rg -n 'rgba?\(' src/multitenant/multitenant.css

# Raw font stacks
rg -n "font-family:" src/multitenant/multitenant.css

# Raw border-radius
rg -n "border-radius:" src/multitenant/multitenant.css

# Raw box-shadow
rg -n "box-shadow:" src/multitenant/multitenant.css

# Raw transitions
rg -n "transition:" src/multitenant/multitenant.css
```

---

## Replacement Map

| Raw value | Token |
|-----------|-------|
| `#ff1b23` | `var(--ds-accent-primary)` |
| `#63cdff` | `var(--ds-blue-400)` |
| `#191919` | `var(--ds-slate-900)` |
| `#f8f5ef` | `var(--ds-bg-canvas)` |
| `#f8fafc` | `var(--ds-slate-50)` |
| `#2d3748` | `var(--ds-slate-800)` |
| `#e3e8ed` | `var(--ds-border-subtle)` |
| `#64748b` | `var(--ds-slate-500)` |
| `#1e293b` | `var(--ds-slate-900)` |
| `#0f172a` | `var(--ds-slate-950)` |
| `rgba(0,0,0,0.5)` | `var(--ds-bg-overlay)` |
| `rgba(17,25,35,0.07)` | `var(--ds-shadow-sm)` |
| `'Sansation', ...` | `var(--ds-font-display)` |
| `'Roboto', ...` | `var(--ds-font-body)` |
| `border-radius: 6px` | `var(--ds-radius-sm)` |
| `border-radius: 8px` | `var(--ds-radius-md)` |
| `border-radius: 10px` | `var(--ds-radius-lg)` |
| `border-radius: 14px` | `var(--ds-radius-xl)` |
| `border-radius: 999px` | `var(--ds-radius-pill)` |
| `0.18s ease` | `var(--ds-transition-base)` |
| `0 8px 18px rgba(...)` | `var(--ds-shadow-sm)` |

---

## Shell Quality Targets After Phase 3

| Shell | Token compliance now | Target | Grade now | Target grade |
|-------|---------------------|--------|-----------|-------------|
| Company Admin | 85% | 95%+ | B+ | A |
| Client Area | 75% | 90%+ | B | B+ |
| SuperAdmin | 70% | 90%+ | B– | B+ |
| CMS Shell | 70% | 90%+ | C+ | B+ |
| Content Editor | 60% | 85%+ | C | B |
| Research App | 5% | 90%+ | F | B |

---

---

# 🔲 Phase 3C — Responsive Audit

**Five breakpoints:** 1440 / 1280 / 1024 / 768 / 480px

---

## Per-Shell Status

| Shell | 1440 | 1280 | 1024 | 768 | 480 | Known Issues |
|-------|:----:|:----:|:----:|:---:|:---:|-------------|
| Company Admin | ✅ | ✅ | ✅ | ⚠️ | ❌ | Users table clips, actions overlap |
| CMS Shell | ✅ | ✅ | ⚠️ | ❌ | ❌ | No topbar collapse, sidebar overflow |
| Content Editor | ✅ | ✅ | ⚠️ | ❌ | ❌ | 2-col layout needs 1024px collapse |
| Client Area | ✅ | ✅ | ✅ | ⚠️ | ❌ | Doc grid stacks but spacing breaks |
| Research App | ✅ | ⚠️ | ❌ | ❌ | ❌ | Zero responsive rules |
| SuperAdmin | ✅ | ✅ | ✅ | ✅ | ⚠️ | Company list wraps awkwardly |

---

## Priority Fixes

### 1. Content Editor — single column at 1024px

```css
@media (max-width: 1024px) {
  .editor-frame { grid-template-columns: 1fr; }
  .editor-tree  { display: none; }  /* TODO: collapsible drawer in Phase 4 */
}
```

### 2. Company Admin users table — card stack at 768px

```css
@media (max-width: 768px) {
  .ds-table thead { display: none; }
  .ds-table tr    { display: grid; padding: var(--ds-space-3); border-bottom: 1px solid var(--ds-border-subtle); }
  .ds-table td    { border: none; padding: 2px 0; }
}
```

### 3. CMS Shell topbar — collapse at 768px

```css
@media (max-width: 768px) {
  .cms-topbar-nav       { display: none; }
  .cms-topbar-hamburger { display: flex; }
}
```

### 4. Research App sidebar — bottom nav at 1024px

```css
@media (max-width: 1024px) {
  .research-shell   { grid-template-columns: 1fr; grid-template-rows: auto 1fr auto; }
  .research-sidebar { order: 3; display: flex; flex-direction: row; overflow-x: auto; border-top: 1px solid var(--ds-border-subtle); border-left: none; }
}
```

---

## Enforcement Rules

- Never: `height: 100vh` — use `calc(100vh - var(--ds-topbar-height))`
- Never: `overflow: hidden` + inner scroll container without documentation
- Never: horizontal overflow at any breakpoint
- Never: `@media` at breakpoints other than 1440, 1280, 1024, 768, 480
- Always: controls wrap before clipping
- Always: `min-width: 0` on flex/grid children to prevent overflow

---

---

# 🔲 Phase 3D — ResearchApp Design System Integration

**Files to change:** `src/multitenant/research.css`, `src/multitenant/ResearchApp.tsx`

---

## Class Migration Map

| Current class | Replace with |
|---------------|-------------|
| `.research-sidebar-nav a` | `.ds-nav-item` |
| `.research-source-card` | `.ds-card.ds-card-interactive` |
| `.research-btn-primary` | `.ds-btn.ds-btn-primary` |
| `.research-btn-ghost` | `.ds-btn.ds-btn-ghost` |
| `.research-input` | `.ds-input` |
| `.research-badge-pending` | `.ds-status.ds-status-neutral` |
| `.research-badge-ready` | `.ds-status.ds-status-published` |
| `.research-badge-failed` | `.ds-status.ds-status-danger` |
| `.research-badge-analyzing` | `.ds-status.ds-status-warning` |
| `.research-job-row` | `.ds-table tr` |
| `.research-empty` | `.ds-empty-state` |

---

## `research.css` After Cleanup — Layout Only

```css
/* research.css — layout skeleton only, all visual styling via ds-* */
.research-shell {
  display: grid;
  grid-template-columns: var(--ds-sidebar-width) 1fr;
  min-height: 100vh;
}
.research-sidebar {
  border-right: 1px solid var(--ds-border-subtle);
  padding: var(--ds-space-4) 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}
.research-topbar {
  height: var(--ds-topbar-height);
  border-bottom: 1px solid var(--ds-border-subtle);
  display: flex;
  align-items: center;
  padding: 0 var(--ds-space-6);
}
.research-content {
  padding: var(--ds-space-6);
  max-width: var(--ds-content-max);
}
@media (max-width: 1024px) {
  .research-shell { grid-template-columns: 1fr; }
}
```

---

---

# 🔲 Phase 4A — Comments System

**Depends on:** Phase 2D (section routes) + Phase 2E (workflow blocking rules)

---

## Backend — Routes in `api-v2.mjs`

```js
// GET /api/v2/companies/:cid/sections/:sid/comments
const comments = db.prepare(`
  SELECT c.*, u.name as author_name, u.email as author_email
  FROM comments c
  LEFT JOIN users u ON u.id = c.author_id
  WHERE c.section_id = ?
  ORDER BY c.created_at ASC
`).all(pathParams.sid);
return send(res, 200, { comments });

// POST /api/v2/companies/:cid/sections/:sid/comments
const { body, isBlocking, parentId } = await readBody(req);
if (!body?.trim()) return send(res, 400, { error: 'body is required' });
const comment = {
  id: makeId('cmt'), company_id: pathParams.cid,
  section_id: pathParams.sid, author_id: user.id,
  body: body.trim(), is_blocking: isBlocking ? 1 : 0,
  resolved: 0, parent_id: parentId ?? null,
  created_at: nowIso(), updated_at: nowIso(),
};
db.prepare(`INSERT INTO comments(...) VALUES(...)`).run(comment);
return send(res, 201, { comment });

// PUT /api/v2/companies/:cid/comments/:coid/resolve
const now = nowIso();
db.prepare(`UPDATE comments SET resolved = 1, resolved_by = ?, resolved_at = ?, updated_at = ? WHERE id = ?`)
  .run(user.id, now, now, pathParams.coid);
return send(res, 200, { ok: true });
```

---

## Frontend — Comment Thread Panel

```tsx
function SectionCommentPanel({ sectionId }: { sectionId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  return (
    <div className="comment-panel">
      <div className="comment-list">
        {comments.map(c => (
          <div key={c.id} className={`ds-section-comment ${c.is_blocking ? 'is-blocking' : ''} ${c.resolved ? 'is-resolved' : ''}`}>
            <div className="comment-meta">
              <span className="comment-author">{c.author_name}</span>
              <span className="comment-time">{formatDate(c.created_at)}</span>
              {c.is_blocking && <span className="ds-status ds-status-danger">Blocking</span>}
            </div>
            <p className="comment-body">{c.body}</p>
            {!c.resolved && (
              <button className="ds-btn ds-btn-sm ds-btn-ghost" onClick={() => resolve(c.id)}>
                Resolve
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="comment-form">
        <textarea className="ds-textarea" value={body} onChange={e => setBody(e.target.value)} placeholder="Add a comment..." />
        <label className="ds-field">
          <input type="checkbox" checked={isBlocking} onChange={e => setIsBlocking(e.target.checked)} />
          Mark as blocking
        </label>
        <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={submit} disabled={!body.trim()}>
          Comment
        </button>
      </div>
    </div>
  );
}
```

### Comment visual states (CSS)

```css
.ds-section-comment { padding: var(--ds-space-3); border-radius: var(--ds-radius-md); border: 1px solid var(--ds-border-subtle); margin-bottom: var(--ds-space-2); }
.ds-section-comment.is-blocking { border-left: 3px solid var(--ds-amber-500); background: var(--ds-amber-50); }
.ds-section-comment.is-resolved { opacity: 0.5; text-decoration: line-through; }
```

---

---

# 🔲 Phase 4B — Workflow Transition UI

**Depends on:** Phase 2D + Phase 2E

---

## Replace Status Dropdowns with Transition Buttons

```tsx
function WorkflowControls({ entity, entityType, onTransitionSuccess }) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);

  const TRANSITION_LABELS: Record<string, { label: string; variant: string }> = {
    review:    { label: 'Submit for Review', variant: 'ds-btn-primary' },
    approved:  { label: 'Approve',           variant: 'ds-btn-primary' },
    draft:     { label: 'Request Changes',   variant: 'ds-btn-ghost' },
    published: { label: 'Publish',           variant: 'ds-btn-primary' },
    staged:    { label: 'Move to Staging',   variant: 'ds-btn-secondary' },
  };

  const allowedTransitions = TRANSITIONS[entityType]?.[entity.status] ?? [];

  async function confirmTransition() {
    try {
      await api.post(`/${entityType}s/${entity.id}/transition`, { to: confirming });
      onTransitionSuccess(confirming);
      setConfirming(null);
    } catch (err) {
      if (err.response?.status === 422) {
        setIssues(err.response.data.issues ?? [err.response.data.error]);
      }
    }
  }

  return (
    <div className="workflow-controls">
      {allowedTransitions.map(to => {
        const config = TRANSITION_LABELS[to];
        if (!config) return null;
        return (
          <button key={to} className={`ds-btn ds-btn-sm ${config.variant}`} onClick={() => setConfirming(to)}>
            {config.label}
          </button>
        );
      })}

      {confirming && (
        <div className="ds-dialog-backdrop">
          <div className="ds-dialog">
            <div className="ds-dialog-header">
              <span className="ds-dialog-title">Confirm: {TRANSITION_LABELS[confirming]?.label}</span>
            </div>
            {issues.length > 0 && (
              <div className="ds-dialog-body">
                <p>Blocking issues:</p>
                <ul>{issues.map((i, idx) => <li key={idx}>⚠️ {i}</li>)}</ul>
              </div>
            )}
            <div className="ds-dialog-footer">
              <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setConfirming(null)}>Cancel</button>
              <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={confirmTransition} disabled={issues.length > 0}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Workflow History Timeline

```tsx
function WorkflowHistory({ entityType, entityId }) {
  return (
    <div className="workflow-history">
      {transitions.map(t => (
        <div key={t.id} className="transition-entry">
          <div className="transition-dot" data-status={t.to_status} />
          <div className="transition-body">
            <span className="transition-actor">{t.actor_name}</span>
            {' moved to '}
            <span className={`ds-status ds-status-${t.to_status}`}>{t.to_status}</span>
            {t.note && <p className="transition-note">{t.note}</p>}
            <span className="transition-time">{formatDate(t.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

---

# 🔲 Phase 4C — Translation Locale Management

**Depends on:** Phase 2D (translation routes)

---

## Frontend — Translation Tab (CMS)

```tsx
function TranslationLocaleManager({ documentId }) {
  const [locales, setLocales] = useState<TranslationLocale[]>([]);
  const [activeLocale, setActiveLocale] = useState<string | null>(null);

  return (
    <div className="translation-manager">
      <div className="locale-list">
        {locales.map(loc => (
          <button key={loc.locale} className={`locale-item ${activeLocale === loc.locale ? 'active' : ''}`} onClick={() => setActiveLocale(loc.locale)}>
            <span className="locale-name">{LOCALE_NAMES[loc.locale] ?? loc.locale}</span>
            <span className={`ds-status ds-status-${mapLocaleStatus(loc.status)}`}>{loc.status}</span>
            <div className="locale-progress-bar">
              <div className="locale-progress-fill" style={{ width: `${loc.completion_pct}%` }} />
            </div>
            <span className="locale-pct">{loc.completion_pct}%</span>
          </button>
        ))}
      </div>

      {activeLocale && <TranslationStringsEditor documentId={documentId} locale={activeLocale} />}

      {locales.some(l => l.completion_pct < 90) && (
        <div className="translation-warning">
          ⚠️ Some locales are below the 90% release threshold
        </div>
      )}
    </div>
  );
}
```

---

## Release Readiness Integration

```
GET /releases/:rid/readiness
  → translationThreshold.ok = false if any locale < 90%

UI warning banner:
  "⚠️ Release Blocked: Georgian 72% (minimum 90% required)"
```

---

---

# 🔲 Phase 4D — Product Members

**Depends on:** Phase 2D + Phase 2C

---

## Backend Routes

```
GET    /api/v2/companies/:cid/products/:pid/members
POST   /api/v2/companies/:cid/products/:pid/members       requires: product.manage
DELETE /api/v2/companies/:cid/products/:pid/members/:uid  requires: product.manage
```

```js
// POST — add or update member role
const { userId, role } = await readBody(req);
db.prepare(`
  INSERT INTO product_members(id, product_id, user_id, role, granted_by, granted_at)
  VALUES(?, ?, ?, ?, ?, ?)
  ON CONFLICT(product_id, user_id) DO UPDATE SET role = excluded.role
`).run(makeId('pm'), pathParams.pid, userId, role, user.id, nowIso());
return send(res, 201, { ok: true });
```

---

## Frontend — Team Tab

```tsx
function ProductMembersPanel({ productId }) {
  return (
    <div className="product-members">
      <div className="ds-page-header">
        <div>
          <p className="ds-page-header-title">Team</p>
          <p className="ds-page-header-sub">Members scoped to this product only</p>
        </div>
        <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={() => setAdding(true)}>Add Member</button>
      </div>
      <table className="ds-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Granted By</th><th>Since</th><th></th></tr></thead>
        <tbody>
          {members.map(m => (
            <tr key={m.user_id}>
              <td>{m.name}</td>
              <td>{m.email}</td>
              <td><span className="ds-badge">{m.role}</span></td>
              <td>{m.granted_by_name}</td>
              <td>{formatDate(m.granted_at)}</td>
              <td className="ds-table-actions">
                <button className="ds-btn ds-btn-sm ds-btn-ghost" onClick={() => removeMember(m.user_id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

---

# 🔲 Phase 4E — Release Full Lifecycle UI

**Depends on:** Phase 2D + Phase 2E

---

## Release Status Stepper

```
draft ──► review ──► approved ──► staged ──► published
                                                  ↓
                                            rolled-back
```

```tsx
const RELEASE_STEPS = ['draft', 'review', 'approved', 'staged', 'published'];

function ReleaseStatusStepper({ release, transitions }) {
  const currentIdx = RELEASE_STEPS.indexOf(release.status);
  return (
    <div className="release-stepper">
      {RELEASE_STEPS.map((step, idx) => {
        const t = transitions.find(t => t.to_status === step);
        return (
          <div key={step} className={`step ${idx < currentIdx ? 'past' : ''} ${idx === currentIdx ? 'current' : ''}`}>
            <div className="step-dot" />
            <div className="step-body">
              <span className={`ds-status ds-status-${step}`}>{step}</span>
              {t && <div className="step-meta"><span>{t.actor_name}</span><span>{formatDate(t.created_at)}</span></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## Readiness Panel

```tsx
function ReleaseReadinessPanel({ releaseId }) {
  const ITEMS = [
    { key: 'sectionsApproved',    label: d => `${d.approved ?? 0}/${d.total ?? 0} sections approved` },
    { key: 'translationThreshold',label: d => `Translation threshold: ${d.ok ? 'met' : 'not met'}` },
    { key: 'releaseNotes',        label: () => 'Release notes present' },
    { key: 'snapshot',            label: () => 'Snapshot created' },
    { key: 'unsafeHtml',          label: () => 'No unsafe HTML' },
    { key: 'reviewer',            label: () => 'Reviewer assigned' },
  ];
  return (
    <div className="readiness-panel">
      {ITEMS.map(({ key, label }) => {
        const item = readiness?.[key];
        return (
          <div key={key} className={`readiness-item ${item?.ok ? 'ok' : 'blocked'}`}>
            <span>{item?.ok ? '✅' : '⚠️'}</span>
            <span>{label(item ?? {})}</span>
          </div>
        );
      })}
    </div>
  );
}
```

---

## Rollback Flow

```tsx
function RollbackButton({ releaseId, onRollback }) {
  const [confirming, setConfirming] = useState(false);
  async function doRollback() {
    await api.post(`/releases/${releaseId}/rollback`);
    onRollback();
    setConfirming(false);
  }
  return (
    <>
      <button className="ds-btn ds-btn-sm ds-btn-danger" onClick={() => setConfirming(true)}>Rollback</button>
      {confirming && (
        <div className="ds-dialog-backdrop">
          <div className="ds-dialog">
            <div className="ds-dialog-header"><span className="ds-dialog-title">Confirm Rollback</span></div>
            <div className="ds-dialog-body">
              <p>This will mark the release as <strong>rolled-back</strong> and record a transition event.</p>
              <p>The snapshot is NOT deleted — all history is preserved.</p>
            </div>
            <div className="ds-dialog-footer">
              <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setConfirming(false)}>Cancel</button>
              <button className="ds-btn ds-btn-danger ds-btn-sm" onClick={doRollback}>Confirm Rollback</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

---

# 🔲 Phase 5A — Research Backend

**Files to create:**
```
server/research/sources.mjs
server/research/jobs.mjs
server/research/drafts.mjs
```

---

## API Routes

```
GET    /api/v2/companies/:cid/research/sources
POST   /api/v2/companies/:cid/research/sources
GET    /api/v2/companies/:cid/research/sources/:sid
DELETE /api/v2/companies/:cid/research/sources/:sid
POST   /api/v2/companies/:cid/research/sources/:sid/analyze
GET    /api/v2/companies/:cid/research/jobs
GET    /api/v2/companies/:cid/research/drafts
POST   /api/v2/companies/:cid/research/drafts/:did/send-to-cms
```

---

## `server/research/jobs.mjs`

```js
import { makeId, nowIso, db } from '../db.mjs';
import * as sources from './sources.mjs';

const JOBS_KEY = cid => `research_jobs_${cid}`;

function readJobs(cid) {
  const row = db.prepare("SELECT value FROM kv_store WHERE company_scope = ? AND key = ?").get(cid, JOBS_KEY(cid));
  return row ? Object.values(JSON.parse(row.value)) : [];
}

function writeJobs(cid, jobs) {
  const map = Object.fromEntries(jobs.map(j => [j.id, j]));
  db.prepare(`INSERT INTO kv_store(company_scope, key, value, revision, updated_at) VALUES(?, ?, ?, 1, ?) ON CONFLICT(company_scope, key) DO UPDATE SET value = excluded.value, revision = revision+1, updated_at = excluded.updated_at`)
    .run(cid, JOBS_KEY(cid), JSON.stringify(map), nowIso());
}

export async function triggerAnalysis(cid, sourceId) {
  const source = sources.get(cid, sourceId);
  if (!source) throw new Error('Source not found');

  const job = { id: makeId('job'), company_id: cid, source_id: sourceId, status: 'pending', error: null, result: null, created_at: nowIso() };
  const jobs = readJobs(cid);
  jobs.push(job);
  writeJobs(cid, jobs);

  // Fire async — do not await
  runAnalysis(cid, job.id, source).catch(err => updateJob(cid, job.id, { status: 'failed', error: err.message }));

  return job;
}

async function runAnalysis(cid, jobId, source) {
  updateJob(cid, jobId, { status: 'running' });
  // TODO: real URL fetch + AI analysis call (Claude API)
  await new Promise(r => setTimeout(r, 2000));
  updateJob(cid, jobId, { status: 'completed', result: { summary: `Analyzed: ${source.url ?? source.title}` } });
}

function updateJob(cid, jobId, updates) {
  const jobs = readJobs(cid);
  const idx = jobs.findIndex(j => j.id === jobId);
  if (idx >= 0) { jobs[idx] = { ...jobs[idx], ...updates, updated_at: nowIso() }; writeJobs(cid, jobs); }
}

export function list(cid) { return readJobs(cid); }
```

---

## `server/research/drafts.mjs`

```js
import { makeId, nowIso, db } from '../db.mjs';
import * as docAdapter from '../adapter/documents.mjs';

const DRAFTS_KEY = cid => `research_drafts_${cid}`;

function readDrafts(cid) {
  const row = db.prepare("SELECT value FROM kv_store WHERE company_scope = ? AND key = ?").get(cid, DRAFTS_KEY(cid));
  return row ? Object.values(JSON.parse(row.value)) : [];
}

function writeDrafts(cid, drafts) {
  const map = Object.fromEntries(drafts.map(d => [d.id, d]));
  db.prepare(`INSERT INTO kv_store(company_scope, key, value, revision, updated_at) VALUES(?, ?, ?, 1, ?) ON CONFLICT(company_scope, key) DO UPDATE SET value = excluded.value, revision = revision+1, updated_at = excluded.updated_at`)
    .run(cid, DRAFTS_KEY(cid), JSON.stringify(map), nowIso());
}

export function list(cid) { return readDrafts(cid); }
export function get(cid, id) { return readDrafts(cid).find(d => d.id === id) ?? null; }

export function create(cid, { title, sourceId, content }) {
  const draft = { id: makeId('rdr'), company_id: cid, title, source_id: sourceId, content, status: 'pending-review', created_at: nowIso() };
  const drafts = readDrafts(cid);
  drafts.push(draft);
  writeDrafts(cid, drafts);
  return draft;
}

export async function sendToCms(cid, draftId, productId, actorId) {
  const draft = get(cid, draftId);
  if (!draft) throw new Error('Draft not found');

  const doc = await docAdapter.save({
    company_id: cid, product_id: productId,
    title: draft.title, type: 'guide', status: 'draft',
    metadata: JSON.stringify({ researchSourceId: draft.source_id, researchDraftId: draftId }),
  }, actorId);

  const drafts = readDrafts(cid);
  const idx = drafts.findIndex(d => d.id === draftId);
  if (idx >= 0) { drafts[idx].status = 'sent-to-cms'; drafts[idx].cms_document_id = doc.id; writeDrafts(cid, drafts); }

  return { documentId: doc.id };
}
```

---

---

# 🔲 Phase 5B — CMS Bridge

**Depends on:** Phase 5A + Phase 2D

---

## Frontend — ResearchApp Draft Review

```tsx
function DraftReviewPage({ draftId }) {
  async function sendToCms() {
    const { documentId } = await api.post(`/research/drafts/${draftId}/send-to-cms`, { productId });
    navigate(`/c/${slug}/admin/cms/documents/${documentId}`);
  }
  return (
    <div className="research-content">
      <div className="ds-page-header">
        <div>
          <p className="ds-page-header-title">{draft?.title}</p>
          <p className="ds-page-header-sub">Research Draft — Pending Review</p>
        </div>
        <div className="ds-page-header-actions">
          <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={discard}>Discard</button>
          <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={sendToCms} disabled={!productId}>Send to CMS</button>
        </div>
      </div>
      <div className="draft-content" dangerouslySetInnerHTML={{ __html: draft?.content ?? '' }} />
    </div>
  );
}
```

## CMS — Research Source Badge

```tsx
{document.metadata?.researchSourceId && (
  <a href={`/c/${slug}/admin/research/sources/${document.metadata.researchSourceId}`} className="ds-badge research-source-badge">
    🔬 From Research
  </a>
)}
```

---

---

# 🔲 Phase 6A — Reader Modernization

**Files to change:** `src/reader/DocReader.tsx`, `src/reader/reader.css`, `src/reader/theme.ts`

---

## Token Migration

```css
/* reader.css — dark mode token overrides */
.reader-shell[data-theme="dark"] {
  color-scheme: dark;
  --ds-bg-canvas:      var(--ds-slate-950);
  --ds-bg-surface:     var(--ds-slate-900);
  --ds-text-primary:   var(--ds-slate-100);
  --ds-text-secondary: var(--ds-slate-400);
  --ds-border-subtle:  var(--ds-slate-800);
}
```

---

## Sticky TOC + Scroll-Spy

```tsx
useEffect(() => {
  const observer = new IntersectionObserver(
    entries => {
      const visible = entries.find(e => e.isIntersecting);
      if (visible) setActiveId(visible.target.id);
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );
  sections.forEach(s => {
    const el = document.getElementById(`section-${s.id}`);
    if (el) observer.observe(el);
  });
  return () => observer.disconnect();
}, [sections]);
```

---

## Language + Version Switcher

```tsx
function ReaderControls({ availableLocales, availableVersions, currentLocale, currentVersion }) {
  return (
    <div className="reader-controls">
      {availableLocales.length > 1 && (
        <select className="ds-select ds-select-sm" value={currentLocale} onChange={e => navigate(`?locale=${e.target.value}`)}>
          {availableLocales.map(l => <option key={l.locale} value={l.locale}>{LOCALE_NAMES[l.locale]}</option>)}
        </select>
      )}
      {availableVersions.length > 1 && (
        <select className="ds-select ds-select-sm" value={currentVersion} onChange={e => navigate(`?version=${e.target.value}`)}>
          {availableVersions.map(v => <option key={v.id} value={v.version}>{v.version}</option>)}
        </select>
      )}
    </div>
  );
}
```

---

---

# 🔲 Phase 6B — API Keys + Webhooks

---

## Schema Additions (`server/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT '["*"]',
  created_by TEXT REFERENCES users(id),
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT NOT NULL DEFAULT '["*"]',
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id),
  last_delivered_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload TEXT NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  duration_ms INTEGER,
  delivered_at TEXT NOT NULL
);
```

---

## Bearer Token Auth Extension (`api-v2.mjs`)

```js
// In loadAuthFromRequest(), after cookie check:
const authHeader = req.headers['authorization'] ?? '';
if (authHeader.startsWith('Bearer ')) {
  const rawToken = authHeader.slice(7);
  const keyHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const key = db.prepare(`SELECT * FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL`).get(keyHash);
  if (key) {
    db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(nowIso(), key.id);
    return {
      user: { id: `apikey:${key.id}`, company_id: key.company_id, _isApiKey: true },
      roles: ['api-key'],
      scopes: JSON.parse(key.scopes),
    };
  }
}
```

---

## Webhook Delivery

```js
// server/webhooks.mjs
export async function deliverWebhooks(companyId, event, payload) {
  const endpoints = db.prepare("SELECT * FROM webhook_endpoints WHERE company_id = ? AND active = 1").all(companyId);
  for (const ep of endpoints) {
    const eventsFilter = JSON.parse(ep.events);
    if (!eventsFilter.includes('*') && !eventsFilter.includes(event)) continue;
    const body = JSON.stringify({ event, data: payload, timestamp: nowIso() });
    const sig  = crypto.createHmac('sha256', ep.secret).update(body).digest('hex');
    const start = Date.now();
    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-DocPilot-Signature': sig },
        body,
        signal: AbortSignal.timeout(5000),
      });
      recordDelivery(ep.id, event, body, res.status, await res.text(), Date.now() - start);
    } catch (err) {
      recordDelivery(ep.id, event, body, 0, err.message, Date.now() - start);
    }
  }
}
```

---

---

# UI/UX Enforcement Rules

## Red Flags — Flag Immediately

- Same component defined in 3+ different shell CSS files → extract to `primitives.css`
- `height: 100vh` + `overflow: hidden` + inner scroll container
- `outline: none` with no `:focus-visible` replacement
- Raw hex color in any shell CSS file
- `'Sansation'` or `'Roboto'` hardcoded font stack (must use `var(--ds-font-*)`)
- Topbar that clips content instead of wrapping or collapsing at breakpoint
- `style={{ background: ... }}` or `style={{ color: ... }}` inline in TSX

## Grep Targets for Audit Pass

```bash
rg -n '#[0-9a-fA-F]{3,8}' src/
rg -n "font-family:" src/ --include="*.css"
rg -n "style=\{" src/multitenant/ src/App.tsx | grep -E "color|background|border"
rg -n "overflow: hidden" src/ --include="*.css"
rg -n "btn|pill|badge|status" src/ --include="*.css" | grep -v "ds-"
rg -n "@media" src/ --include="*.css" | grep -v "1440\|1280\|1024\|768\|480"
```

## File Ownership Rules

| What belongs here | File | Must NOT appear in |
|-------------------|------|--------------------|
| Color / typography / spacing tokens | `src/styles/tokens.css` | Any shell file |
| Button, input, card, badge, dialog primitives | `src/styles/primitives.css` | Any shell file |
| Surface / shell-level tokens | `src/styles/surfaces.css` | `tokens.css` |
| Cross-shell layout contracts | `src/styles.css` | Shell-specific files |
| Shell-specific layout only | `src/multitenant/*.css` | tokens or primitives |

## Responsive Minimums

Every shell must be verified at:
- `1440px` — no oversized empty gaps
- `1280px` — desktop grids still balanced
- `1024px` — sidebars/tables/actions still usable
- `768px` — header actions wrap cleanly
- `480px` — actions and filters stack without clipping

---

## What NOT to Build Until Phase 4 is Complete

- Heavy analytics dashboards
- Jira / GitHub bidirectional sync
- Elasticsearch / dedicated search platform
- Automated multi-language AI translation (without human review)
- Complex public reader redesign beyond Phase 6A scope
- SSO / SAML enterprise auth
- Real-time collaboration (WebSocket presence)

---

## Implementation Sequence

```
DONE  Phase 1    — Planning
DONE  Phase 2A   — Schema completion

NOW   Phase 2B   — Storage adapter layer
      Phase 2C   — Permission system refactor   (parallel with 2B)
      Phase 2D   — API v2 content expansion     (after 2B + 2C)
      Phase 2E   — Workflow engine              (alongside 2D)

NEXT  Phase 3A   — Component extraction (primitives)
      Phase 3B   — Token completion pass
      Phase 3C   — Responsive audit
      Phase 3D   — ResearchApp design system integration

THEN  Phase 4A   — Comments system
      Phase 4B   — Workflow transition UI
      Phase 4C   — Translation locale management
      Phase 4D   — Product members
      Phase 4E   — Release full lifecycle UI

LATER Phase 5A   — Research backend
      Phase 5B   — CMS bridge
      Phase 6A   — Reader modernization
      Phase 6B   — API keys + webhooks
```
