# DocPilot — Master Roadmap

Single source of truth for all product, implementation, and UI/UX phases.
Combines: Foundation Plan · Product Roadmap Skill · UI/UX Audit · Enforcement Checklist.

Last updated: 2026-06-08

---

## Product Overview

DocPilot is documentation operations software for multi-tenant teams.

Core workflow spine:
```
Product → Document → Section → Review → Translate → Release → Publish
```

It is not a file archive. It is not a generic wiki. It is a governed content pipeline
where ownership, review, translation, and publishing are first-class workflow states.

---

## Current State (as of 2026-06-08)

### What exists and works

| Layer | State |
|-------|-------|
| SQLite schema | 23 tables — Phase 2A complete |
| Auth system | bcrypt, sessions, rate limiting, secure cookies |
| Multi-tenant shell | companies, branding, company-admin, client area |
| Legacy CMS | products/documents/sections/translations/releases via JSON kv_store |
| API v2 | auth + tenant + users — content APIs still legacy |
| Design token system | tokens.css, primitives.css, surfaces.css — complete |
| Company Admin shell | strongest UI quality — B+ alignment |
| Client Area | improved — B alignment |
| ResearchApp | mock data, not connected to backend |

### What is missing

| Gap | Impact |
|-----|--------|
| 8 schema tables were missing | Phase 2A fixed this |
| No storage adapter layer | two disconnected persistence systems |
| Flat role permissions | no scoped `can(user, action, resource)` |
| API v2 has no content routes | products/docs/sections/releases still on legacy server |
| No workflow engine | transitions not validated server-side |
| No comments system | section review flow is incomplete |
| ResearchApp not wired | AI center is mock UI only |
| multitenant.css token compliance 60% | hardcoded hex/font values remain |
| ResearchApp token compliance 5% | not integrated into design system |
| Responsive coverage thin | CMS and editor not audited below 1024px |

---

## Product Phases (high-level)

These are the product-level phases. Each maps to one or more implementation phases below.

### Phase A — Foundation
Persistence, backend structure, permissions, workflow spine, readiness logic, activity/audit.

Maps to: Implementation Phase 2 (all sub-phases).

Outputs:
- stable SQLite schema with all entities normalized
- scoped permission model replacing flat role map
- API v2 covering all content types
- workflow engine with blocking rules
- audit log with entity FK context

### Phase B — Collaboration
Comments, reviewer workflow, assignments, approvals, notifications, activity history.

Maps to: Implementation Phase 4A–B.

Outputs:
- section comment threads with blocking flag
- review request model
- assignment model (owner + reviewer per section/document)
- approval rules enforced at transition layer
- activity feed per document

### Phase C — Publishing
Release governance, stage vs production, publish gates, rollback, readiness checklists.

Maps to: Implementation Phase 4C–E.

Outputs:
- full release state machine (draft → review → approved → staged → published → rolled-back)
- translation threshold checks blocking release
- readiness score per release
- rollback creates new release event — does not mutate history
- environment labels: draft / staging / production

### Phase D — Reader and Discovery
Public docs delivery, search, version/language switching, reader feedback.

Maps to: Implementation Phase 6A.

Outputs:
- token-based theming in reader
- improved section navigation (sticky TOC, scroll-spy)
- search within document
- version switcher
- language switcher tied to translation_locales

### Phase E — Growth
Integrations, API keys, webhooks, analytics starter, AI research pipeline.

Maps to: Implementation Phase 5 + 6B.

Outputs:
- tenant API key management
- webhook delivery + log
- AI source ingestion and draft generation
- CMS bridge: research draft → document draft
- analytics starter metrics

---

## Implementation Phases — Full Detail

### ✅ Phase 1 — Planning (COMPLETE)

Deliverables produced:

| File | Content |
|------|---------|
| WORKFLOW_MATRIX.md | Canonical workflow states and transition rules for all entities |
| PERMISSION_MATRIX.md | Granular permission model with role baselines and scope layers |
| DB_SCHEMA_DRAFT.md | Target PostgreSQL/SQLite schema for all 15+ entities |

Nothing to do here. Move to Phase 2.

---

### ✅ Phase 2A — Schema Completion (COMPLETE)

**Files changed:** `server/schema.sql`, `server/db.mjs`

Tables added (all `CREATE TABLE IF NOT EXISTS` — safe on existing databases):

| Table | Purpose |
|-------|---------|
| `permission_grants` | Scoped `can(user, action, scope_id)` replacing flat role→write map |
| `translation_locales` | Per document × locale status + completion % tracking |
| `translation_strings` | Per section × locale body with dirty / saved / review state |
| `release_snapshots` | Immutable content snapshot at publish time, separate from releases row |
| `release_items` | Documents and sections bundled inside a release with readiness score |
| `product_members` | Per-product role delegation without tenant-wide power |
| `comments` | Section-level threaded comments with `is_blocking` flag |
| `workflow_transitions` | Auditable log of every state change, separate from audit_events noise |

Columns added to existing tables via `ensureColumn()` (safe for existing databases):

| Table | Column | Purpose |
|-------|--------|---------|
| `sections` | `reviewer` | Reviewer user ID |
| `sections` | `has_unsafe_html` | Blocks section from advancing to approved |
| `documents` | `has_unsafe_html` | Blocks document from advancing |
| `releases` | `product_id` | Top-level product grouping for release |
| `releases` | `snapshot_id` | FK to release_snapshots after publish |
| `releases` | `reviewer` | Assigned reviewer user ID |
| `audit_events` | `product_id` | Entity FK context for filtering |
| `audit_events` | `document_id` | Entity FK context for filtering |
| `audit_events` | `section_id` | Entity FK context for filtering |
| `audit_events` | `release_id` | Entity FK context for filtering |

Verified: DB boot OK, all 23 tables present, all 10 columns added.

---

### 🔲 Phase 2B — Storage Adapter Layer

**Goal:** Bridge the two parallel persistence systems (legacy JSON kv_store + new SQLite v2)
without breaking existing reads. Dual-write until Phase 2D flips the primary.

**Files to create:**

```
server/adapter/index.mjs          — factory: getAdapter(entityType)
server/adapter/products.mjs       — get / save / list / delete
server/adapter/documents.mjs      — get / save / list / delete + getBySlug
server/adapter/sections.mjs       — get / save / list / delete + listByDocument
server/adapter/translations.mjs   — getLocales / saveLocale / getStrings / saveString
server/adapter/releases.mjs       — get / save / list / transition + snapshot
```

**Interface contract per adapter:**

```js
// Every adapter exports:
export async function get(id)                         // read one — SQLite first, kv fallback
export async function save(entity, actorId)           // write both SQLite AND kv_store
export async function list(companyId, filters = {})   // query SQLite
export async function remove(id, actorId)             // soft-delete (status = 'archived')
```

**Dual-write logic:**

```
Phase 2B: save() writes to SQLite AND kv_store
Phase 2D: after all content routes move to v2, drop kv_store write
Phase 5:  remove JSON persistence entirely
```

**Key decisions:**
- `get()` attempts SQLite first; if not found (unmigrated row), falls back to kv_store
- `save()` wraps both writes in a `db.transaction()` — SQLite must succeed before kv
- All adapters call `appendAudit()` from auth.mjs with `document_id` / `section_id` context

**Dependencies:** Phase 2A (tables must exist). No dependency on Phase 2C.

---

### 🔲 Phase 2C — Permission System Refactor

**Goal:** Replace flat `documents:write` role map with `can(user, action, resource, scope)`.

**Files to create:** `server/authz.mjs`

**Files to change:** `server/api-v2.mjs`, `server/docpilot-server.mjs`, `src/storage.ts`

#### Action Catalog

Full list of actions `authz.mjs` must recognize:

```
product.view          product.create        product.edit
product.archive       product.manage

document.view         document.create       document.edit
document.review       document.approve      document.archive

section.view          section.create        section.edit
section.comment       section.review        section.approve
section.delete

translation.view      translation.edit      translation.review
translation.publish

release.view          release.create        release.review
release.approve       release.stage         release.publish
release.rollback

media.view            media.upload          media.edit
media.delete          media.replace

user.view             user.invite           user.edit
user.deactivate       access.manage

settings.view         settings.edit
integration.view      integration.manage
webhook.manage        api-key.manage
```

#### Role Default Baseline

```js
// server/authz.mjs
const ROLE_DEFAULTS = {
  superadmin: ['*'],  // all actions
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
```

#### `can()` function

```js
// server/authz.mjs
export function can(user, roles, action, scopeType = 'tenant', scopeId = null) {
  // 1. superadmin bypasses all checks
  if (roles.includes('superadmin')) return true;
  // 2. check role default baseline
  for (const role of roles) {
    const grants = ROLE_DEFAULTS[role] ?? [];
    if (grants.includes('*')) return true;
    const [resource, verb] = action.split('.');
    if (grants.includes(action)) return true;
    if (grants.includes(`${resource}.*`)) return true;
  }
  // 3. check explicit permission_grants rows
  const row = db.prepare(`
    SELECT id FROM permission_grants
    WHERE company_id = ?
      AND (user_id = ? OR role IN (${roles.map(() => '?').join(',')}))
      AND action = ?
      AND (scope_id IS NULL OR scope_id = ?)
      AND (expires_at IS NULL OR expires_at > ?)
    LIMIT 1
  `).get(user.company_id, user.id, ...roles, action, scopeId, nowIso());
  return !!row;
}
```

**Migration path for existing checks:**

Replace in `server/docpilot-server.mjs`:
```js
// Before
if (!WRITE_PERMISSIONS[role]?.has('documents:write')) return send(res, 403, ...);

// After
import { can } from './authz.mjs';
if (!can(user, roles, 'document.edit')) return send(res, 403, ...);
```

Replace in `src/storage.ts`:
```ts
// Before
export function canRoleWrite(role: UserRole, permission: WritePermission) {
  return WRITE_PERMISSIONS[role].includes(permission);
}

// After — calls /api/v2/auth/me roles and checks against server-side truth
// (storage.ts canRoleWrite becomes a thin hint only; server enforces)
```

**Dependencies:** Phase 2A (permission_grants table). Independent of 2B.

---

### 🔲 Phase 2D — API v2 Content Expansion

**Goal:** Move all content CRUD from the legacy server to `/api/v2/`.

**File to change:** `server/api-v2.mjs`
**Depends on:** Phase 2B (storage adapter) + Phase 2C (authz)

#### Products

```
GET    /api/v2/companies/:cid/products
POST   /api/v2/companies/:cid/products
PUT    /api/v2/companies/:cid/products/:pid
DELETE /api/v2/companies/:cid/products/:pid
PUT    /api/v2/companies/:cid/products/:pid/status        — workflow transition
```

Each route must:
- call `can(user, roles, 'product.edit', 'tenant')` or appropriate action
- use `productAdapter.save()` from Phase 2B (dual-write)
- call `appendAudit()` with `product_id` context

#### Documents

```
GET    /api/v2/companies/:cid/products/:pid/documents
POST   /api/v2/companies/:cid/products/:pid/documents
GET    /api/v2/companies/:cid/documents/:did
PUT    /api/v2/companies/:cid/documents/:did
DELETE /api/v2/companies/:cid/documents/:did
POST   /api/v2/companies/:cid/documents/:did/transition   — status change via workflow engine
```

#### Sections

```
GET    /api/v2/companies/:cid/documents/:did/sections
POST   /api/v2/companies/:cid/documents/:did/sections
GET    /api/v2/companies/:cid/sections/:sid
PUT    /api/v2/companies/:cid/sections/:sid
DELETE /api/v2/companies/:cid/sections/:sid
POST   /api/v2/companies/:cid/sections/:sid/transition
GET    /api/v2/companies/:cid/sections/:sid/comments
POST   /api/v2/companies/:cid/sections/:sid/comments
PUT    /api/v2/companies/:cid/comments/:commentId/resolve
```

#### Translations

```
GET    /api/v2/companies/:cid/documents/:did/translation-locales
PUT    /api/v2/companies/:cid/documents/:did/translation-locales/:locale/status
GET    /api/v2/companies/:cid/sections/:sid/translation-strings
PUT    /api/v2/companies/:cid/sections/:sid/translation-strings/:locale
```

#### Releases

```
GET    /api/v2/companies/:cid/products/:pid/releases
POST   /api/v2/companies/:cid/products/:pid/releases
GET    /api/v2/companies/:cid/releases/:rid
PUT    /api/v2/companies/:cid/releases/:rid
POST   /api/v2/companies/:cid/releases/:rid/transition    — draft→review→approved→staged→published
POST   /api/v2/companies/:cid/releases/:rid/rollback
GET    /api/v2/companies/:cid/releases/:rid/readiness     — readiness score + blocking list
```

#### Media

```
POST   /api/v2/companies/:cid/media             — multipart upload (replaces legacy server handler)
GET    /api/v2/companies/:cid/media
GET    /api/v2/companies/:cid/media/:mid
PUT    /api/v2/companies/:cid/media/:mid
DELETE /api/v2/companies/:cid/media/:mid
```

---

### 🔲 Phase 2E — Workflow Engine

**Goal:** Enforce transition rules and blocking conditions server-side before any status change.

**File to create:** `server/workflow.mjs`

**Allowed transitions** (from WORKFLOW_MATRIX.md):

```js
const TRANSITIONS = {
  product:  { draft: ['review'], review: ['published', 'archived'], published: ['review', 'archived'] },
  document: { draft: ['review'], review: ['draft', 'approved'], approved: ['draft', 'published'], published: ['review', 'archived'], archived: ['draft'] },
  section:  { draft: ['review'], review: ['draft', 'approved'], approved: ['draft', 'published'], published: ['draft', 'archived'] },
  'translation-locale': { 'not-started': ['in-progress'], 'in-progress': ['review'], review: ['in-progress', 'published'], published: ['in-progress'] },
  release:  { draft: ['review'], review: ['draft', 'approved'], approved: ['staged'], staged: ['approved', 'published'], published: ['rolled-back'] },
};

export function validateTransition(entityType, from, to) {
  const allowed = TRANSITIONS[entityType]?.[from] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid transition: ${entityType} ${from} → ${to}`);
  }
}
```

**Blocking rules** (checked before `approved` or `published`):

```js
export function checkBlockingRules(entityType, entityId) {
  const issues = [];
  if (entityType === 'section') {
    const s = db.prepare('SELECT * FROM sections WHERE id = ?').get(entityId);
    if (!s.title?.trim())       issues.push('Section title is empty');
    if (s.has_unsafe_html)      issues.push('Section contains unsafe HTML');
    if (!s.reviewer)            issues.push('Section has no assigned reviewer');
    const blocking = db.prepare(
      'SELECT count(*) as n FROM comments WHERE section_id = ? AND is_blocking = 1 AND resolved = 0'
    ).get(entityId);
    if (blocking.n > 0)         issues.push(`${blocking.n} unresolved blocking comment(s)`);
  }
  if (entityType === 'document') {
    const d = db.prepare('SELECT * FROM documents WHERE id = ?').get(entityId);
    if (d.has_unsafe_html)      issues.push('Document contains unsafe HTML');
    if (!d.reviewer)            issues.push('Document has no assigned reviewer');
    const draftSections = db.prepare(
      "SELECT count(*) as n FROM sections WHERE document_id = ? AND status IN ('draft', 'review')"
    ).get(entityId);
    if (draftSections.n > 0)    issues.push(`${draftSections.n} section(s) still in draft/review`);
  }
  if (entityType === 'release') {
    const r = db.prepare('SELECT * FROM releases WHERE id = ?').get(entityId);
    if (!r.notes?.trim())       issues.push('Release notes are empty');
    // TODO: translation threshold check (Phase 4C)
  }
  return issues;  // empty = OK, non-empty = blocked
}
```

**`recordTransition()`:**

```js
export function recordTransition(entityType, entityId, from, to, actorId, note = null) {
  db.prepare(`
    INSERT INTO workflow_transitions (id, company_id, entity_type, entity_id, from_status, to_status, actor_id, note, created_at)
    SELECT ?, company_id, ?, ?, ?, ?, ?, ?, ?
    FROM ${entityType === 'section' ? 'sections' : entityType + 's'} WHERE id = ?
  `).run(makeId('wt'), entityType, entityId, from, to, actorId, note, nowIso(), entityId);
}
```

---

## Phase 3 — UI/UX & Design System

### Current Design System State

**`src/styles/tokens.css`** — COMPLETE ✅
Full token layer: color scales, semantic tokens, typography, spacing (4px grid), radius, z-index, transitions, layout constants, legacy alias bridge.

**`src/styles/primitives.css`** — MOSTLY COMPLETE ✅
```
.ds-btn + variants (primary, secondary, outline, ghost, danger, pill, icon, sm, lg)
.ds-input / .ds-select / .ds-textarea
.ds-field / .ds-label / .ds-helper-text
.ds-card + body/panel/feature/interactive variants
.ds-badge / .ds-status + semantic variants
.ds-table + th/td rules
.ds-nav-group / .ds-nav-item (with active + aria-current states)
.ds-stat / .ds-stat-label / .ds-stat-value / .ds-stat-delta
```

**Missing from primitives (Phase 3A target):**
```
.ds-topbar-pill          — nav pills inside topbars (duplicated in 3 shells)
.ds-empty-state          — empty list placeholder block
.ds-page-header          — title + subtitle + actions row
.ds-table-actions        — row-level action group
.ds-section-card         — editor section card
.ds-dialog + children    — modal/dialog shell
.ds-status-approved      — missing from status badge variants
.ds-status-staged        — missing from status badge variants
.ds-status-rolled-back   — missing from status badge variants
```

### Shell Quality Ratings

| Shell | Token compliance | Responsive | Component reuse | Grade |
|-------|-----------------|------------|-----------------|-------|
| Company Admin | 85% | 80% | 75% | **B+** |
| Client Area | 75% | 70% | 70% | **B** |
| SuperAdmin | 70% | 85% | 60% | **B–** |
| CMS Shell | 70% | 55% | 65% | **C+** |
| Content Editor | 60% | 55% | 50% | **C** |
| Research App | 5% | 40% | 5% | **F** |

Target after Phase 3: all shells at B+ or higher.

---

### 🔲 Phase 3A — Component Extraction

**File to change:** `src/styles/primitives.css`
**Shell CSS files to clean:** `src/multitenant/multitenant.css`, `src/multitenant/company-cms.css`, `src/multitenant/company-admin.css`, `src/styles.css`

**What to add to primitives.css:**

`.ds-topbar-pill` — replaces `.cms-nav-pill`, `.ca-topbar-tab`, `.client-topbar-item`:
```css
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
.ds-topbar-pill.active, .ds-topbar-pill[aria-current="page"] {
  background: var(--ds-bg-surface-tint);
  color: var(--ds-accent-secondary);
}
```

`.ds-empty-state`:
```css
.ds-empty-state {
  display: grid;
  place-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-16) var(--ds-space-8);
  text-align: center;
}
.ds-empty-state-icon { font-size: 32px; opacity: 0.35; }
.ds-empty-state-title { font-family: var(--ds-font-display); font-size: var(--ds-text-lg); font-weight: var(--ds-font-weight-bold); color: var(--ds-text-primary); }
.ds-empty-state-body { font-size: var(--ds-text-md); color: var(--ds-text-secondary); max-width: 380px; }
```

`.ds-page-header`:
```css
.ds-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);
  padding: var(--ds-space-6) 0 var(--ds-space-5);
  flex-wrap: wrap;
}
.ds-page-header-title { font-family: var(--ds-font-display); font-size: var(--ds-text-2xl); font-weight: var(--ds-font-weight-heavy); color: var(--ds-text-primary); }
.ds-page-header-sub { font-size: var(--ds-text-sm); color: var(--ds-text-secondary); margin-top: 2px; }
.ds-page-header-actions { display: flex; align-items: center; gap: var(--ds-space-2); flex-shrink: 0; }
```

`.ds-dialog`:
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
.ds-dialog-body { padding: var(--ds-space-5) var(--ds-space-6); }
.ds-dialog-footer { padding: var(--ds-space-4) var(--ds-space-6); border-top: 1px solid var(--ds-border-subtle); display: flex; justify-content: flex-end; gap: var(--ds-space-2); }
```

`.ds-status-approved`, `.ds-status-staged`, `.ds-status-rolled-back`:
```css
.ds-status-approved {
  background: var(--ds-status-info-bg);
  color: var(--ds-status-info-fg);
}
.ds-status-staged {
  background: var(--ds-amber-50);
  color: var(--ds-amber-800);
}
.ds-status-rolled-back {
  background: var(--ds-status-neutral-bg);
  color: var(--ds-status-neutral-fg);
}
```

**After adding:** replace all shell-local duplicates with the new utility classes.

---

### 🔲 Phase 3B — Token Completion Pass

**Target files in order of priority:**

1. `src/multitenant/multitenant.css` — most historical layers, most hardcoded values
2. `src/styles.css` — largest file, ~60–80 replacements
3. `src/multitenant/research.css` — full rework, currently 5% compliance

**Grep commands to find violations:**

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

**Replacement map:**

| Raw value | Token |
|-----------|-------|
| `#ff1b23` | `var(--ds-accent-primary)` |
| `#63cdff` | `var(--ds-blue-400)` |
| `#191919` | `var(--ds-slate-900)` |
| `#f8f5ef` | `var(--ds-bg-canvas)` |
| `#f8fafc` | `var(--ds-slate-50)` |
| `#2d3748` | `var(--ds-slate-800)` |
| `#e3e8ed` | `var(--ds-border-subtle)` |
| `'Sansation', ...` | `var(--ds-font-display)` |
| `'Roboto', ...` | `var(--ds-font-body)` |
| `border-radius: 6px` | `var(--ds-radius-sm)` |
| `border-radius: 8px` | `var(--ds-radius-md)` |
| `border-radius: 10px` | `var(--ds-radius-lg)` |
| `border-radius: 14px` | `var(--ds-radius-xl)` |
| `border-radius: 999px` | `var(--ds-radius-pill)` |
| `0.18s ease` | `var(--ds-transition-base)` |
| `0 8px 18px rgba(17,25,35,0.07)` | `var(--ds-shadow-sm)` |

---

### 🔲 Phase 3C — Responsive Audit

**Five breakpoints:** 1440 / 1280 / 1024 / 768 / 480px

**Per-shell checklist:**

| Shell | 1440 | 1280 | 1024 | 768 | 480 | Known issues |
|-------|:----:|:----:|:----:|:---:|:---:|-------------|
| Company Admin | ✅ | ✅ | ✅ | ⚠️ | ❌ | Users table clips, actions overlap |
| CMS Shell | ✅ | ✅ | ⚠️ | ❌ | ❌ | No topbar collapse, sidebar overflow |
| Content Editor | ✅ | ✅ | ⚠️ | ❌ | ❌ | 2-col layout needs 1024px collapse |
| Client Area | ✅ | ✅ | ✅ | ⚠️ | ❌ | Doc grid stacks but spacing breaks |
| Research App | ✅ | ⚠️ | ❌ | ❌ | ❌ | No responsive rules at all |
| SuperAdmin | ✅ | ✅ | ✅ | ✅ | ⚠️ | Company list wraps awkwardly |

**Priority fixes:**

1. CMS Shell topbar — collapse to icon-only or hamburger at 768px
2. Content Editor — single column layout at 1024px:
   ```css
   @media (max-width: 1024px) {
     .editor-frame { grid-template-columns: 1fr; }
     .editor-tree { display: none; }  /* or collapsible drawer */
   }
   ```
3. Company Admin users table — card stack at 768px:
   ```css
   @media (max-width: 768px) {
     .ds-table thead { display: none; }
     .ds-table tr { display: grid; padding: var(--ds-space-3); border-bottom: 1px solid var(--ds-border-subtle); }
     .ds-table td { border: none; padding: 2px 0; }
   }
   ```
4. Research App sidebar — collapse to bottom nav at 1024px

**Enforcement rules (from checklist.md):**
- No `overflow: hidden` + inner scroll trap unless intentional
- No `height: 100vh` without compensating for topbar height
- No horizontal overflow at any breakpoint
- `min-width: 0` on flex/grid children to prevent overflow
- Controls wrap before clipping, never clip

---

### 🔲 Phase 3D — ResearchApp Design System Integration

**File to change:** `src/multitenant/research.css`
**File to change:** `src/multitenant/ResearchApp.tsx` (className updates)

ResearchApp currently has 0% token compliance. Full rework:

**Step 1 — Map current custom classes to `.ds-*` equivalents:**

| Current class | Replace with |
|---------------|-------------|
| `.research-sidebar-nav a` | `.ds-nav-item` |
| `.research-source-card` | `.ds-card.ds-card-interactive` |
| `.research-btn-primary` | `.ds-btn.ds-btn-primary` |
| `.research-btn-ghost` | `.ds-btn.ds-btn-ghost` |
| `.research-input` | `.ds-input` |
| `.research-badge-pending` | `.ds-status-neutral` |
| `.research-badge-ready` | `.ds-status-published` |
| `.research-badge-failed` | `.ds-status-danger` |
| `.research-badge-analyzing` | `.ds-status-warning` |
| `.research-job-row` | `.ds-table tr` |
| `.research-empty` | `.ds-empty-state` |

**Step 2 — Keep only layout rules in research.css:**
```css
/* research.css after cleanup — layout only */
.research-shell { display: grid; grid-template-columns: var(--ds-sidebar-width) 1fr; min-height: 100vh; }
.research-topbar { height: var(--ds-topbar-height); ... }
.research-content { padding: var(--ds-space-6); max-width: var(--ds-content-max); }
@media (max-width: 1024px) { .research-shell { grid-template-columns: 1fr; } }
```

---

## Phase 4 — Feature Completion

### 🔲 Phase 4A — Comments System

**Backend (already has schema from Phase 2A):**

New API routes in `server/api-v2.mjs`:
```
GET  /api/v2/companies/:cid/sections/:sid/comments
POST /api/v2/companies/:cid/sections/:sid/comments         — requires section.comment
PUT  /api/v2/companies/:cid/comments/:coid/resolve         — requires section.approve
```

Comment create payload:
```json
{ "body": "...", "isBlocking": true, "parentId": null }
```

Resolve endpoint sets `resolved = 1`, `resolved_by = actorId`, `resolved_at = now`.

Blocking check integration in workflow engine:
```js
// workflow.mjs checkBlockingRules — already specified in Phase 2E
const blocking = db.prepare(
  'SELECT count(*) as n FROM comments WHERE section_id = ? AND is_blocking = 1 AND resolved = 0'
).get(entityId);
if (blocking.n > 0) issues.push(`${blocking.n} unresolved blocking comment(s)`);
```

**Frontend (src/App.tsx section editor):**
- Comment thread panel in the section properties sidebar (right column)
- `.ds-section-comment` list with author, timestamp, body
- Blocking comment = amber left border
- Resolved comment = muted/strikethrough
- Blocking comment count badge on section card (red pill)
- Unresolved blocking comments disable the "Submit for Review" button

---

### 🔲 Phase 4B — Workflow Transition UI

**Replace:** per-entity status dropdowns

**With:** explicit transition buttons showing only allowed next states

```tsx
// Example: section workflow controls
{canTransitionTo('review') && (
  <button className="ds-btn ds-btn-sm" onClick={() => transition('review')}>
    Submit for Review
  </button>
)}
{canTransitionTo('approved') && (
  <button className="ds-btn ds-btn-sm ds-btn-primary" onClick={() => transition('approved')}>
    Approve
  </button>
)}
{canTransitionTo('draft') && (
  <button className="ds-btn ds-btn-sm ds-btn-ghost" onClick={() => transition('draft')}>
    Request Changes
  </button>
)}
```

**Blocking rules pre-check UI:**
- Before transition, fetch `GET /sections/:sid` or check locally
- If blocking issues exist, show them as a checklist before the confirm button
- Each issue: icon + message, resolved = strikethrough

**Workflow history panel:**
- Read from `workflow_transitions` via `GET /documents/:did/transitions` (or section-level)
- Timeline: actor avatar + "moved from draft to review" + timestamp

---

### 🔲 Phase 4C — Translation Locale Management

**Frontend (translation tab in CMS):**

Current state: single key-value table with generic state column.

Target state:
- Locale switcher: list of locales with status badge and completion % bar
- Per-locale status follows: `not-started → in-progress → review → published`
- Completion % shown as progress bar (from `translation_locales.completion_pct`)
- Strings editor: section-level rows with `dirty / saved / review` state per cell
- Threshold indicator: warn when completion < policy (default 90%) before release

**Release readiness integration:**
- `GET /releases/:rid/readiness` returns `translationThresholdPassed: true/false`
- Translation tab shows "Release Blocked: Georgian translation at 72% (min 90%)"

---

### 🔲 Phase 4D — Product Members

**New UI tab in Company Admin or CMS sidebar: "Team"**

- List current product members (from `product_members` table)
- Each member: avatar + name + role + granted by + granted at
- Add member: select user from company, assign role (editor / reviewer / viewer)
- Role scoped to this product only — does not affect other products or tenant-wide role

**Backend routes:**
```
GET    /api/v2/companies/:cid/products/:pid/members
POST   /api/v2/companies/:cid/products/:pid/members       — requires product.manage
DELETE /api/v2/companies/:cid/products/:pid/members/:uid  — requires product.manage
```

---

### 🔲 Phase 4E — Release Full Lifecycle UI

**Target:** replace the current 2-state release UI (draft / published) with the full 6-state flow.

**Release status stepper component:**
```
draft → review → approved → staged → published
                                           ↓
                                     rolled-back
```

Each step shows:
- Step label + status icon
- Actor who made the transition
- Timestamp
- Next action button (if current user `can` do it)

**Readiness panel** (`GET /releases/:rid/readiness`):
```
Document readiness: 3/4 sections approved       ✅
Translation threshold: Georgian 94% (min 90%)   ✅
Release notes: present                          ✅
Snapshot: not yet generated                     ⚠️
Unsafe HTML: none found                         ✅
```

**Rollback flow:**
- Confirm dialog: "This will mark the release as rolled-back and create a new rollback event."
- Does NOT delete the release — creates a new `workflow_transitions` entry
- Does NOT mutate the snapshot

**Environment label on each release:**
`draft` → `staging` → `production` — shown as badge, not editable via UI (controlled by transition)

---

## Phase 5 — AI Research Center

### 🔲 Phase 5A — Research Backend

**Files to create:**
```
server/research/sources.mjs   — source CRUD + URL fetch + content extraction
server/research/jobs.mjs      — async job queue + status tracking
server/research/drafts.mjs    — AI-assisted draft generation from source content
```

**API routes:**
```
GET    /api/v2/companies/:cid/research/sources
POST   /api/v2/companies/:cid/research/sources         — add URL or docs link
GET    /api/v2/companies/:cid/research/sources/:sid
DELETE /api/v2/companies/:cid/research/sources/:sid
POST   /api/v2/companies/:cid/research/sources/:sid/analyze  — trigger job
GET    /api/v2/companies/:cid/research/jobs
GET    /api/v2/companies/:cid/research/drafts
POST   /api/v2/companies/:cid/research/drafts/:did/send-to-cms
```

**Job lifecycle:** `pending → running → completed / failed`

Each completed job writes to `kv_store` under `research_sources_<cid>` and `research_drafts_<cid>`.

Drafts store:
```json
{
  "id": "draft_xxx",
  "title": "...",
  "sourceId": "src_xxx",
  "status": "pending-review",
  "content": "... HTML or markdown ..."
}
```

### 🔲 Phase 5B — CMS Bridge

**Frontend (ResearchApp draft detail page):**
- "Send to CMS" button — calls `POST /research/drafts/:did/send-to-cms`
- Creates a new document draft in the CMS (via `documentAdapter.save()`)
- Sets `metadata.researchSourceId` on the new document
- Navigates to the new document in the CMS editor

**CMS document detail:**
- If `metadata.researchSourceId` is set, show a "Research source" badge with link back to the research app

---

## Phase 6 — Public Reader & Integrations

### 🔲 Phase 6A — Reader Modernization

**File to change:** `src/reader/DocReader.tsx`, `src/reader/reader.css`, `src/reader/theme.ts`

Current reader uses a legacy `theme.ts` color system (not token-based).

Target:
- Replace `theme.ts` raw color values with `var(--ds-*)` tokens
- Sticky table of contents (scroll-spy on section headings)
- Section jump: clicking TOC item scrolls smoothly to section
- Language switcher: shows available locales from `translation_locales` with `published` status
- Version switcher: shows available published releases
- Accessible at `/c/:slug/docs/:docSlug` with auth gate (DocAuthGate already exists)

**Theming:**
- Reader currently has light/dark/system modes via `theme.ts`
- Wire dark mode to `color-scheme: dark` on `:root` + define dark token overrides in `tokens.css`

### 🔲 Phase 6B — API Keys + Webhooks

**Current state:** API keys and webhook endpoints stored in `kv_store`.

Target:
- Migrate to dedicated SQLite table: `api_keys` and `webhook_endpoints`
- Tenant API key management UI: list / create / revoke
- Webhook management UI: list / add URL / toggle active / show last delivery
- Delivery log table: `webhook_deliveries` — payload, status, response code, timestamp
- Auth: `Bearer <api-key>` header support in `api-v2.mjs`

---

## UI/UX Enforcement Rules

Apply these rules in every code review or audit pass.

### Red flags — flag immediately

- Same component redefined 3+ times in different shell CSS files
- `height: 100vh` with `overflow: hidden` and inner scroll container
- `outline: none` with no `focus-visible` replacement
- Raw hex color in any shell CSS file
- Raw `'Sansation'` or `'Roboto'` font stack anywhere in CSS (must use `var(--ds-font-*)`)
- Topbar that clips content instead of wrapping or collapsing
- Status badge using `style={{ background: ... }}` inline in TSX

### Grep targets for audit pass

```bash
# Hex colors
rg -n '#[0-9a-fA-F]{3,8}' src/

# Raw font stacks
rg -n "font-family:" src/ --include="*.css"

# Inline styles with color
rg -n "style=\{" src/multitenant/ src/App.tsx | grep -E "color|background|border"

# Overflow traps
rg -n "overflow: hidden" src/ --include="*.css"

# Button / pill duplicates
rg -n "btn|pill|badge|status" src/ --include="*.css" | grep -v "ds-"

# Hardcoded media breakpoints outside standard values
rg -n "@media" src/ --include="*.css" | grep -v "1440\|1280\|1024\|768\|480"
```

### File ownership rules

| What | Where it lives | NOT in |
|------|---------------|--------|
| Color tokens | `src/styles/tokens.css` | Any shell file |
| Button/input/card primitives | `src/styles/primitives.css` | Any shell file |
| Surface/shell-level tokens | `src/styles/surfaces.css` | tokens.css |
| Cross-shell contracts | `src/styles.css` | Shell-specific files |
| Shell-specific layout only | `src/multitenant/*.css` | tokens or primitives |

### Responsive minimums

Every shell must be checked at:
- `1440px` — no oversized empty gaps
- `1280px` — desktop grids still balanced
- `1024px` — sidebars/tables/actions still usable
- `768px` — header actions wrap cleanly
- `480px` — actions and filters can stack without clipping

---

## Priority Order (implementation sequence)

```
DONE  Phase 1    — Planning
DONE  Phase 2A   — Schema completion

NOW   Phase 2B   — Storage adapter layer
      Phase 2C   — Permission system refactor
      Phase 2D   — API v2 content expansion
      Phase 2E   — Workflow engine

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

---

## What Not To Build Until Phase 4 Is Complete

- Heavy analytics dashboards
- Jira / GitHub bidirectional sync
- Dedicated search platform (Elasticsearch)
- Multi-language AI translation (automated, not human-reviewed)
- Complex public reader redesign beyond Phase 6A scope
- SSO / SAML enterprise auth
- Real-time collaboration (WebSocket presence)
