# DocPilot — Master Implementation Plan

> **Single source of truth.** Every phase, every gap, every skill, every method.  
> Last updated: 2026-06-09 | Status tracker embedded in each phase header.

---

## Quick Reference — What Exists vs What's Missing

### Exists and Working

| Layer | File(s) | Quality |
|-------|---------|---------|
| SQLite schema | `server/schema.sql` + `server/db.mjs` | ✅ 23 tables, all Phase 2A columns |
| Authentication | `server/auth.mjs` | ✅ bcrypt, sessions, rate-limit, secure cookies |
| Authorization (legacy) | `server/docpilot-server.mjs` `WRITE_PERMISSIONS` | ⚠️ flat role map — Phase 2C replaces this |
| Legacy CMS server | `server/docpilot-server.mjs` | ⚠️ all content still here — Phase 2D migrates |
| API v2 (partial) | `server/api-v2.mjs` | ⚠️ auth + tenant + users only, no content routes |
| Design token system | `src/styles/tokens.css` | ✅ complete |
| Primitive components | `src/styles/primitives.css` | ⚠️ 80% — missing 8 components |
| Surface/shell tokens | `src/styles/surfaces.css` | ✅ complete |
| Company Admin UI | `src/multitenant/company-admin.css` + `CompanyAdmin.tsx` | B+ |
| CMS Shell | `src/multitenant/company-cms.css` + `CompanyCMSShell.tsx` | C+ |
| Client Area | `src/multitenant/CompanyClientArea.tsx` | B |
| SuperAdmin | `src/multitenant/SuperAdminShell.tsx` | B– |
| ResearchApp | `src/multitenant/ResearchApp.tsx` + `research.css` | F (mock only) |
| Reader | `src/reader/DocReader.tsx` | C (legacy theme.ts, no scroll-spy, no switchers) |
| Content Editor | `src/App.tsx` (large) | C (client-side only, no server validation) |

### Critical Missing Pieces

| # | Missing | Blocks |
|---|---------|--------|
| 1 | `server/adapter/*.mjs` — Storage Adapter Layer | Everything in Phase 2D+ |
| 2 | `server/authz.mjs` — `can()` function | Phase 2D routes, Phase 2C refactor |
| 3 | `server/workflow.mjs` — transition engine | Phase 4B UI, server-side safety |
| 4 | API v2 content routes | Frontend cannot call v2 for products/docs/sections |
| 5 | Comments backend + UI | Section review flow incomplete |
| 6 | Translation locale management | Release readiness cannot be computed |
| 7 | Release full lifecycle (6 states) | Only draft/published in current UI |
| 8 | Research backend | ResearchApp is dead mock |
| 9 | Responsive CSS at 768px/480px | CMS + Editor broken on mobile |
| 10 | primitives.css: 8 missing components | Shell CSS files redefine them 3+ times each |
| 11 | Reader: token migration + scroll-spy + switchers | Reader feels legacy |
| 12 | API keys + webhooks in SQLite | Still in kv_store JSON |

---

---

# Phase 1 — Planning ✅ COMPLETE

**Produced:**
- `WORKFLOW_MATRIX.md` — canonical status/transition rules
- `PERMISSION_MATRIX.md` — role baselines + scope model
- `DB_SCHEMA_DRAFT.md` — target schema

**Nothing to do. Proceed to Phase 2.**

---

---

# Phase 2A — Schema Completion ✅ COMPLETE

**Files changed:** `server/schema.sql`, `server/db.mjs`

**8 tables added** (all `CREATE TABLE IF NOT EXISTS` — safe on existing DBs):

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `permission_grants` | Scoped `can(user,action,scope)` | `user_id`, `role`, `action`, `scope`, `scope_id`, `expires_at` |
| `translation_locales` | doc×locale status + completion % | `document_id`, `locale`, `status`, `completion_pct` |
| `translation_strings` | section×locale body + row state | `section_id`, `locale`, `body`, `state` (dirty/saved/review) |
| `release_snapshots` | Immutable publish-time snapshot | `release_id`, `payload` (JSON) |
| `release_items` | Documents/sections inside a release | `release_id`, `document_id`, `section_id`, `readiness_score` |
| `product_members` | Per-product role delegation | `product_id`, `user_id`, `role` |
| `comments` | Section-level threaded comments | `section_id`, `is_blocking`, `resolved` |
| `workflow_transitions` | Audit trail of every status change | `entity_type`, `entity_id`, `from_status`, `to_status`, `actor_id` |

**10 columns added** via `ensureColumn()` in `server/db.mjs`:

```
sections.reviewer         sections.has_unsafe_html
documents.has_unsafe_html
releases.product_id       releases.snapshot_id      releases.reviewer
audit_events.product_id   audit_events.document_id
audit_events.section_id   audit_events.release_id
```

---

---

# Phase 2B — Storage Adapter Layer 🔲

**Status:** Not started  
**Estimated effort:** ~4 hours  
**Depends on:** Phase 2A ✅  
**Independent of:** Phase 2C  
**Blocks:** Phase 2D (adapter must exist before content routes)

## Problem Being Solved

The codebase has two parallel persistence systems:
1. **Legacy:** `cms-state.json` file + `kv_store` SQLite table — used by `docpilot-server.mjs`
2. **New:** Direct SQLite tables — used by `api-v2.mjs`

Without an adapter layer, Phase 2D routes would need to either break the legacy server or duplicate persistence logic. The adapter provides a single `save()` that writes to **both** during the transition period.

## Dual-Write Strategy

```
Phase 2B  →  save() writes SQLite (primary) + kv_store (backwards-compat)
Phase 2D  →  after all content routes are on v2, drop kv_store write
Phase 5   →  remove kv_store entirely
```

## Files to Create

```
server/adapter/index.mjs          ← factory: getAdapter('products')
server/adapter/products.mjs       ← get / list / save / remove
server/adapter/documents.mjs      ← get / getBySlug / list / save / remove
server/adapter/sections.mjs       ← get / listByDocument / list / save / remove
server/adapter/translations.mjs   ← getLocales / saveLocale / getStrings / saveString
server/adapter/releases.mjs       ← get / list / save / snapshot / remove
```

## Interface Contract (every adapter)

```js
export async function get(id)                        // SQLite first, kv fallback
export async function list(companyId, filters = {})  // query SQLite
export async function save(entity, actorId)          // writes SQLite + kv_store
export async function remove(id, actorId)            // soft-delete: status = 'archived'
```

## Key Implementation Rules

- `get()` tries SQLite first; if not found (unmigrated row), falls back to `kv_store`
- `save()` wraps BOTH writes in a `db.transaction()` — SQLite must succeed before kv
- All `save()` and `remove()` calls `appendAudit()` from `auth.mjs` with entity FK context
- All adapters use `makeId(prefix)` from `db.mjs` for new IDs
- ID prefixes: `prod_`, `doc_`, `sec_`, `tl_` (translation_locale), `ts_` (translation_string), `rel_`, `snap_`

## kv_store Key Format

| Adapter | kv_store key |
|---------|-------------|
| products | `products_<companyId>` |
| documents | `documents_<companyId>` |
| sections | `sections_<companyId>` |
| translations | `translation_strings_<companyId>` |
| releases | `releases_<companyId>` |

## Skills Required

- SQLite `better-sqlite3` — synchronous prepared statements, transactions
- `ON CONFLICT(id) DO UPDATE SET ...` — upsert pattern
- `db.transaction(fn)()` — atomic multi-table write
- `appendAudit({ companyId, userId, action, entityType, entityId, ...context })` — from `auth.mjs`

## Acceptance Criteria

- [ ] `productAdapter.save({ company_id, name, status: 'draft' }, userId)` → row in `products` table AND entry in `kv_store`
- [ ] `productAdapter.get(id)` returns from SQLite; if row deleted from SQLite manually, returns from kv_store
- [ ] `productAdapter.remove(id)` sets `status = 'archived'` (does NOT delete row)
- [ ] All adapters write audit events with correct entity FK columns
- [ ] No adapter throws on duplicate `save()` call (upsert semantics)

---

---

# Phase 2C — Permission System Refactor 🔲

**Status:** Not started  
**Estimated effort:** ~3 hours  
**Depends on:** Phase 2A ✅ (`permission_grants` table)  
**Independent of:** Phase 2B  
**Blocks:** Phase 2D route-level authorization

## Problem Being Solved

`server/docpilot-server.mjs` has:
```js
const WRITE_PERMISSIONS = {
  admin: new Set(['documents:write', 'sections:write', ...]),
  editor: new Set(['documents:write', ...]),
  ...
};
if (!WRITE_PERMISSIONS[role]?.has('documents:write')) return send(res, 403, ...);
```

This is a flat, coarse-grained map. It cannot express:
- "This user can approve documents but not publish them"
- "This user can edit product X but not product Y"
- "This role grant expires in 30 days"
- "This is a product-scoped permission, not tenant-wide"

## File to Create: `server/authz.mjs`

### Full Action Catalog

```
product.view      product.create    product.edit
product.archive   product.manage

document.view     document.create   document.edit
document.review   document.approve  document.archive

section.view      section.create    section.edit
section.comment   section.review    section.approve   section.delete

translation.view  translation.edit  translation.review  translation.publish

release.view      release.create    release.review
release.approve   release.stage     release.publish     release.rollback

media.view        media.upload      media.edit          media.delete   media.replace

user.view         user.invite       user.edit           user.deactivate
access.manage

settings.view     settings.edit
integration.view  integration.manage
webhook.manage    api-key.manage
```

### Role Default Baseline (ROLE_DEFAULTS)

| Role | Default permissions |
|------|-------------------|
| `superadmin` | `['*']` (all) |
| `company-admin` | `product.*`, `document.*`, `section.*`, `media.*`, `user.view/invite/edit`, `settings.*` |
| `editor` | `product.view`, `document.view/create/edit`, `section.view/create/edit/comment`, `translation.view`, `media.view/upload/edit` |
| `reviewer` | `document.view/review/approve`, `section.view/comment/review/approve`, `translation.view/review` |
| `viewer` | `*.view` (read-only) |
| `partner` | `document.view`, `section.view/comment`, `translation.view` |
| `tam` | `product.view`, `document.view/edit/review`, `section.view/edit/comment/review`, `translation.view/edit`, `release.view/create` |
| `developer` | `document.view/edit`, `section.view/edit`, `media.*`, `settings.view`, `integration.*` |
| `account-manager` | `product.view`, `document.view`, `section.view` |

### `can()` Function Logic

```
1. If roles includes 'superadmin' → true (bypass all)
2. For each role: check ROLE_DEFAULTS[role]
   - if grants includes '*' → true
   - if grants includes exact action → true
   - if grants includes 'resource.*' → true (e.g. 'document.*' covers 'document.edit')
3. Query permission_grants table for explicit scoped grants
   - WHERE company_id = ? AND (user_id = ? OR role IN (...))
   - AND action = ? AND (scope_id IS NULL OR scope_id = ?)
   - AND (expires_at IS NULL OR expires_at > now())
4. Return false
```

### `requireCan()` Middleware

```js
export function requireCan(action, scopeType, getScopeId) {
  return (req, res, next) => {
    const { user, roles } = req.auth;
    if (!user) return send403(res, 'Not authenticated');
    if (!can(user, roles, action, scopeType, getScopeId?.(req)))
      return send403(res, `Missing permission: ${action}`);
    next?.();
  };
}
```

## Files to Modify

### `server/docpilot-server.mjs`

Replace every `WRITE_PERMISSIONS[role]?.has(...)` check:

```js
// BEFORE:
if (!WRITE_PERMISSIONS[role]?.has('documents:write'))
  return send(res, 403, { error: 'Forbidden' });

// AFTER:
import { can } from './authz.mjs';
const { user, roles } = req.auth;  // set by loadAuthFromRequest()
if (!can(user, roles, 'document.edit'))
  return send(res, 403, { error: 'Forbidden' });
```

### `src/storage.ts`

`canRoleWrite()` stays as a UI hint (button enable/disable) — **server is the authority**.  
No breaking change needed for Phase 2C. Just add a comment that it's hint-only.

## Skills Required

- SQLite parameterized queries with variable-length IN clauses (`roles.map(() => '?').join(',')`)
- Understanding of permission scope hierarchy: tenant → product → document → section
- `db.prepare().get()` for single-row reads in synchronous SQLite

## Acceptance Criteria

- [ ] `can(user, ['editor'], 'document.edit')` → true
- [ ] `can(user, ['editor'], 'release.publish')` → false
- [ ] `can(user, ['superadmin'], 'anything')` → true
- [ ] `can(user, ['viewer'], 'document.create')` → false
- [ ] Explicit `permission_grants` row overrides role default
- [ ] Expired grants (`expires_at < now()`) are ignored
- [ ] All existing docpilot-server.mjs permission checks replaced

---

---

# Phase 2D — API v2 Content Expansion 🔲

**Status:** Not started  
**Estimated effort:** ~8 hours  
**Depends on:** Phase 2B ✅ + Phase 2C ✅  
**Blocks:** Frontend can use v2 API for content; Phase 4 features

## Problem Being Solved

Currently `api-v2.mjs` only handles:
- `POST /api/v2/auth/*` — login, logout, me, password, invite
- `GET/PUT /api/v2/tenant/*` — company + branding
- `GET/POST/PUT/DELETE /api/v2/companies/:cid/users/*`

**All content** (products, documents, sections, translations, releases, media) still goes through `docpilot-server.mjs` (legacy JSON-based server).

This phase moves all content CRUD to `/api/v2/` with proper auth, tenant isolation, and workflow integration.

## Complete Route List

### Products
```
GET    /api/v2/companies/:cid/products                    → productAdapter.list()
POST   /api/v2/companies/:cid/products                    → productAdapter.save() [product.create]
GET    /api/v2/companies/:cid/products/:pid               → productAdapter.get()  [product.view]
PUT    /api/v2/companies/:cid/products/:pid               → productAdapter.save() [product.edit]
DELETE /api/v2/companies/:cid/products/:pid               → productAdapter.remove() [product.archive]
POST   /api/v2/companies/:cid/products/:pid/transition    → workflow.applyTransition() [product.edit]
```

### Documents
```
GET    /api/v2/companies/:cid/products/:pid/documents     → documentAdapter.list({productId})
POST   /api/v2/companies/:cid/products/:pid/documents     → documentAdapter.save() [document.create]
GET    /api/v2/companies/:cid/documents/:did              → documentAdapter.get()
PUT    /api/v2/companies/:cid/documents/:did              → documentAdapter.save() [document.edit]
DELETE /api/v2/companies/:cid/documents/:did              → documentAdapter.remove() [document.archive]
POST   /api/v2/companies/:cid/documents/:did/transition   → workflow.applyTransition() [document.review/approve]
GET    /api/v2/companies/:cid/documents/:did/transitions  → SELECT * FROM workflow_transitions WHERE entity_id=?
```

### Sections
```
GET    /api/v2/companies/:cid/documents/:did/sections     → sectionAdapter.listByDocument()
POST   /api/v2/companies/:cid/documents/:did/sections     → sectionAdapter.save() [section.create]
GET    /api/v2/companies/:cid/sections/:sid               → sectionAdapter.get()
PUT    /api/v2/companies/:cid/sections/:sid               → sectionAdapter.save() [section.edit]
DELETE /api/v2/companies/:cid/sections/:sid               → sectionAdapter.remove() [section.delete]
POST   /api/v2/companies/:cid/sections/:sid/transition    → workflow.applyTransition()
GET    /api/v2/companies/:cid/sections/:sid/comments      → SELECT FROM comments WHERE section_id=?
POST   /api/v2/companies/:cid/sections/:sid/comments      → INSERT INTO comments [section.comment]
PUT    /api/v2/companies/:cid/comments/:coid/resolve      → UPDATE comments SET resolved=1 [section.approve]
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
POST   /api/v2/companies/:cid/products/:pid/releases      [release.create]
GET    /api/v2/companies/:cid/releases/:rid
PUT    /api/v2/companies/:cid/releases/:rid               [release.create]
POST   /api/v2/companies/:cid/releases/:rid/transition    [release.review/approve/stage/publish]
POST   /api/v2/companies/:cid/releases/:rid/rollback      [release.rollback]
GET    /api/v2/companies/:cid/releases/:rid/readiness     → compute readiness score
```

### Media
```
POST   /api/v2/companies/:cid/media                       → multipart upload [media.upload]
GET    /api/v2/companies/:cid/media                       [media.view]
GET    /api/v2/companies/:cid/media/:mid                  [media.view]
PUT    /api/v2/companies/:cid/media/:mid                  [media.edit]
DELETE /api/v2/companies/:cid/media/:mid                  [media.delete]
```

## Route Handler Pattern (all routes follow this)

```js
// Every route:
// 1. Load auth
const { user, roles } = await loadAuthFromRequest(req);
if (!user) return send(res, 401, { error: 'Unauthorized' });

// 2. Permission check
if (!can(user, roles, 'product.create')) return send(res, 403, { error: 'Forbidden' });

// 3. Tenant boundary — user can only access their own company
if (user.company_id !== pathParams.cid && !roles.includes('superadmin'))
  return send(res, 403, { error: 'Tenant mismatch' });

// 4. Validate input
const body = await readBody(req);
if (!body.name?.trim()) return send(res, 400, { error: 'name is required' });

// 5. Execute via adapter
const product = productAdapter.save({ company_id: cid, ...body }, user.id);

// 6. Return
return send(res, 201, { product });
```

## Readiness Endpoint Logic

`GET /releases/:rid/readiness` returns a structured readiness object:

```js
{
  readiness: {
    sectionsApproved:     { total: N, approved: N, ok: bool },
    translationThreshold: { ok: bool, locales: [{ locale, pct }] },
    releaseNotes:         { ok: bool },
    snapshot:             { ok: bool },
    unsafeHtml:           { ok: bool },
    reviewer:             { ok: bool },
    overallReady:         bool       // AND of all ok values
  }
}
```

Threshold for translation: 90% completion per locale (future: configurable per company).

## Skills Required

- URL path matching with named params (`/api/v2/companies/:cid/products/:pid`)
- `readBody(req)` Promise for JSON body parsing (already in `api-v2.mjs`)
- `better-sqlite3` prepared statements
- Multipart file upload with `busboy` (for media route — copy pattern from legacy server)
- HTTP 400 / 401 / 403 / 404 / 422 error shape consistency

## Acceptance Criteria

- [ ] `POST /api/v2/companies/:cid/products` creates product in SQLite AND kv_store
- [ ] Editor role: can create/edit products, cannot publish releases
- [ ] Viewer role: GET returns 200, POST returns 403
- [ ] Wrong company: returns 403 even if authenticated
- [ ] `GET /releases/:rid/readiness` reflects actual blocking sections, translation state
- [ ] All routes append audit events with correct entity FK context

---

---

# Phase 2E — Workflow Engine 🔲

**Status:** Not started  
**Estimated effort:** ~2 hours  
**Depends on:** Phase 2A ✅  
**Used by:** Phase 2D transition routes + Phase 4B UI

## Problem Being Solved

Currently status changes happen client-side via `PUT /section/:id` with `{ status: 'approved' }`.  
There is no server-side check that:
- The transition is actually allowed (e.g. `archived → review` should be invalid)
- Blocking conditions are met before approving (e.g. unresolved blocking comments)
- The transition is recorded in `workflow_transitions` for audit history

## File to Create: `server/workflow.mjs`

### Allowed Transitions Map

```
product:              draft → review → published/archived
document:             draft → review ↔ approved → published/archived | archived → draft
section:              draft → review ↔ approved → published/archived
translation-locale:   not-started → in-progress → review ↔ published
release:              draft → review ↔ approved → staged ↔ published → rolled-back
```

### Three Exported Functions

**`validateTransition(entityType, from, to)`**  
Throws `{ message, code: 'INVALID_TRANSITION', statusCode: 422 }` if transition not in map.

**`checkBlockingRules(entityType, entityId)`**  
Returns `string[]` of human-readable blocking issues. Empty = no blocks.

Rules per entity type:

| Type | Checks before `approved`/`published` |
|------|-------------------------------------|
| `section` | title not empty, no `has_unsafe_html`, reviewer assigned, zero unresolved `is_blocking` comments |
| `document` | no `has_unsafe_html`, reviewer assigned, zero sections in `draft` or `review` status |
| `release` | notes not empty, reviewer assigned, all locales ≥ 90% completion |

**`applyTransition(entityType, entityId, to, actorId, note?)`**  
Calls `validateTransition` → `checkBlockingRules` (if going to approved/published/staged) → `UPDATE status` → `recordTransition`. All in one `db.transaction()`.

Returns: `{ from, to, entityId, entityType }`  
Throws on invalid transition or blocking rules.

### `recordTransition()` — Internal

```sql
INSERT INTO workflow_transitions(
  id, company_id, entity_type, entity_id,
  from_status, to_status, actor_id, note, created_at
)
```

Gets `company_id` from the entity's own table dynamically.

## Skills Required

- SQLite `db.transaction(fn)()` — atomic multi-step operations
- `throw Object.assign(new Error(...), { code, statusCode, issues })` — structured errors
- Pattern: validate-then-write (no partial state)

## Acceptance Criteria

- [ ] `applyTransition('section', id, 'approved', userId)` with unresolved blocking comment → throws, status unchanged
- [ ] `applyTransition('section', id, 'review', userId)` from `draft` → status updated + `workflow_transitions` row inserted
- [ ] `applyTransition('document', id, 'published', userId)` with sections in `draft` → throws with message listing count
- [ ] `applyTransition('release', id, 'rolled-back', userId)` from `staged` → throws (not a valid transition from staged)
- [ ] All transitions recorded in `workflow_transitions` with actor_id + timestamp

---

---

# Phase 3A — Component Extraction 🔲

**Status:** Not started  
**Estimated effort:** ~3 hours  
**Depends on:** Phase 2A (can be done independently)  
**Blocks:** Phase 3B, 3D (token pass and ResearchApp integration build on this)

## Problem Being Solved

The same visual components are defined 2–4 times across shell CSS files:

| Component | Duplicate locations |
|-----------|-------------------|
| Navigation pill/tab | `multitenant.css` `.cms-nav-pill`, `company-admin.css` `.ca-topbar-tab`, `company-cms.css` nav link styles |
| Empty state placeholder | inline in 3+ shells |
| Page header (title + actions row) | inline everywhere |
| Modal/dialog shell | locally in company-admin and CMS |
| Status badge variants | only partial in primitives.css |

This causes: visual inconsistency across shells, double maintenance, token violations creeping back in.

## File to Modify: `src/styles/primitives.css`

### Components to Add

**`.ds-topbar-pill`** — replaces all nav pill variants

```css
.ds-topbar-pill {
  display: inline-flex; align-items: center; gap: var(--ds-space-2);
  min-height: 36px; padding: 0 14px;
  border-radius: var(--ds-radius-pill);
  font-family: var(--ds-font-display); font-size: var(--ds-text-sm);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-text-secondary);
  border: 1px solid transparent;
  transition: background var(--ds-transition-fast), color var(--ds-transition-fast);
  white-space: nowrap; cursor: pointer; text-decoration: none;
}
.ds-topbar-pill:hover { background: var(--ds-bg-surface-soft); color: var(--ds-text-primary); }
.ds-topbar-pill.active, .ds-topbar-pill[aria-current="page"] {
  background: var(--ds-bg-surface-tint); color: var(--ds-accent-secondary);
}
```

**`.ds-empty-state`** — placeholder for empty lists

```css
.ds-empty-state { display: grid; place-items: center; gap: var(--ds-space-3); padding: var(--ds-space-16) var(--ds-space-8); text-align: center; }
.ds-empty-state-icon { font-size: 32px; opacity: 0.35; }
.ds-empty-state-title { font-family: var(--ds-font-display); font-size: var(--ds-text-lg); font-weight: var(--ds-font-weight-bold); color: var(--ds-text-primary); }
.ds-empty-state-body { font-size: var(--ds-text-md); color: var(--ds-text-secondary); max-width: 380px; }
```

**`.ds-page-header`** — title + subtitle + actions row

```css
.ds-page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ds-space-4); padding: var(--ds-space-6) 0 var(--ds-space-5); flex-wrap: wrap; }
.ds-page-header-title { font-family: var(--ds-font-display); font-size: var(--ds-text-2xl); font-weight: var(--ds-font-weight-heavy); color: var(--ds-text-primary); }
.ds-page-header-sub { font-size: var(--ds-text-sm); color: var(--ds-text-secondary); margin-top: 2px; }
.ds-page-header-actions { display: flex; align-items: center; gap: var(--ds-space-2); flex-shrink: 0; }
```

**`.ds-table-actions`** — row-level action group (hover-reveal)

```css
.ds-table-actions { display: flex; align-items: center; gap: var(--ds-space-1); opacity: 0; transition: opacity var(--ds-transition-fast); }
.ds-table tr:hover .ds-table-actions, .ds-table tr:focus-within .ds-table-actions { opacity: 1; }
```

**`.ds-dialog`** — modal shell

```css
.ds-dialog-backdrop { position: fixed; inset: 0; background: var(--ds-bg-overlay); z-index: var(--ds-z-modal-backdrop); display: grid; place-items: center; padding: var(--ds-space-6); }
.ds-dialog { background: var(--ds-bg-surface); border: 1px solid var(--ds-border-subtle); border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-lg); width: 100%; max-width: 520px; z-index: var(--ds-z-modal); }
.ds-dialog-header { padding: var(--ds-space-5) var(--ds-space-6); border-bottom: 1px solid var(--ds-border-subtle); display: flex; align-items: center; justify-content: space-between; }
.ds-dialog-title { font-family: var(--ds-font-display); font-size: var(--ds-text-lg); font-weight: var(--ds-font-weight-bold); color: var(--ds-text-primary); }
.ds-dialog-body { padding: var(--ds-space-5) var(--ds-space-6); }
.ds-dialog-footer { padding: var(--ds-space-4) var(--ds-space-6); border-top: 1px solid var(--ds-border-subtle); display: flex; justify-content: flex-end; gap: var(--ds-space-2); }
```

**`.ds-section-card`** — editor section card

```css
.ds-section-card { background: var(--ds-bg-surface); border: 1px solid var(--ds-border-subtle); border-radius: var(--ds-radius-lg); padding: var(--ds-space-4) var(--ds-space-5); transition: border-color var(--ds-transition-fast), box-shadow var(--ds-transition-fast); }
.ds-section-card:hover { border-color: var(--ds-border-strong); box-shadow: var(--ds-shadow-sm); }
.ds-section-card-header { display: flex; align-items: center; justify-content: space-between; gap: var(--ds-space-3); margin-bottom: var(--ds-space-2); }
```

**Missing status variants:**

```css
.ds-status-approved    { background: var(--ds-status-info-bg);    color: var(--ds-status-info-fg); }
.ds-status-staged      { background: var(--ds-amber-50);          color: var(--ds-amber-800); }
.ds-status-rolled-back { background: var(--ds-status-neutral-bg); color: var(--ds-status-neutral-fg); }
.ds-status-not-started { background: var(--ds-bg-surface-soft);   color: var(--ds-text-muted); }
.ds-status-in-progress { background: var(--ds-blue-50);           color: var(--ds-blue-700); }
```

## Cleanup (after adding to primitives.css)

For each shell file, run the grep below, then delete the local definition and replace usage with `.ds-*`:

```bash
# Find all local pill/nav duplicates
rg -n "nav-pill|topbar-tab|topbar-item" src/multitenant/ --include="*.css"

# Find all local empty-state definitions
rg -n "empty.state\|empty-state\|no-items" src/ --include="*.css"

# Find all local modal/dialog definitions
rg -n "modal\|dialog\|overlay" src/ --include="*.css" | grep -v "ds-"
```

## Skills Required

- CSS custom properties (all values must use `var(--ds-*)`)
- `aria-current="page"` attribute selector for active nav states
- `focus-within` for table row hover reveal of actions
- Z-index token usage: `var(--ds-z-modal)`, `var(--ds-z-modal-backdrop)`

## Acceptance Criteria

- [ ] No component defined in more than one CSS file
- [ ] All new classes pass the grep: zero hardcoded hex colors
- [ ] `.ds-topbar-pill.active` and `[aria-current="page"]` both show active state
- [ ] `.ds-dialog-backdrop` sits above all shell content
- [ ] Status badge variants cover: `draft review approved published archived staged rolled-back not-started in-progress danger warning`

---

---

# Phase 3B — Token Completion Pass 🔲

**Status:** Not started  
**Estimated effort:** ~4 hours  
**Depends on:** Phase 3A (component extraction first)

## Problem Being Solved

Current token compliance by file:

| File | Compliance | Violation count (est.) |
|------|-----------|----------------------|
| `multitenant.css` | 60% | ~45 hex values, 8 font stacks, 12 hardcoded radii |
| `styles.css` | 70% | ~30 hex values, 6 font stacks |
| `research.css` | 5% | nearly everything |
| `superadmin.css` | 70% | ~20 violations |

## Violation-Finding Commands

```bash
# Run these in order, fix the output of each before moving to the next

# 1. Hex colors
rg -n '#[0-9a-fA-F]{3,8}' src/ --include="*.css"

# 2. Raw rgb/rgba
rg -n 'rgba?\(' src/ --include="*.css"

# 3. Hardcoded font stacks
rg -n "font-family\s*:" src/ --include="*.css" | grep -v "var(--ds-font"

# 4. Hardcoded border-radius
rg -n "border-radius\s*:" src/ --include="*.css" | grep -v "var(--ds-radius"

# 5. Hardcoded box-shadow
rg -n "box-shadow\s*:" src/ --include="*.css" | grep -v "var(--ds-shadow"

# 6. Hardcoded transitions
rg -n "transition\s*:" src/ --include="*.css" | grep -v "var(--ds-transition"

# 7. Inline style color/background in TSX
rg -n "style=\{" src/ --include="*.tsx" | grep -E "color|background|border"
```

## Complete Token Replacement Map

| Raw | Token |
|-----|-------|
| `#ff1b23` | `var(--ds-accent-primary)` |
| `#63cdff` | `var(--ds-blue-400)` |
| `#191919` | `var(--ds-slate-900)` |
| `#f8f5ef` | `var(--ds-bg-canvas)` |
| `#f8fafc` | `var(--ds-slate-50)` |
| `#2d3748` | `var(--ds-slate-800)` |
| `#1e293b` | `var(--ds-slate-900)` |
| `#0f172a` | `var(--ds-slate-950)` |
| `#64748b` | `var(--ds-slate-500)` |
| `#e3e8ed` | `var(--ds-border-subtle)` |
| `rgba(0,0,0,0.5)` | `var(--ds-bg-overlay)` |
| `rgba(17,25,35,0.07)` | `var(--ds-shadow-sm)` |
| `rgba(17,25,35,0.14)` | `var(--ds-shadow-md)` |
| `'Sansation', sans-serif` | `var(--ds-font-display)` |
| `'Roboto', sans-serif` | `var(--ds-font-body)` |
| `border-radius: 4px` | `var(--ds-radius-xs)` |
| `border-radius: 6px` | `var(--ds-radius-sm)` |
| `border-radius: 8px` | `var(--ds-radius-md)` |
| `border-radius: 10px` | `var(--ds-radius-lg)` |
| `border-radius: 14px` | `var(--ds-radius-xl)` |
| `border-radius: 20px` | `var(--ds-radius-2xl)` |
| `border-radius: 999px` | `var(--ds-radius-pill)` |
| `0.12s ease` | `var(--ds-transition-fast)` |
| `0.18s ease` | `var(--ds-transition-base)` |
| `0.28s ease` | `var(--ds-transition-slow)` |
| `0 2px 6px rgba(...)` | `var(--ds-shadow-xs)` |
| `0 8px 18px rgba(...)` | `var(--ds-shadow-sm)` |
| `0 16px 32px rgba(...)` | `var(--ds-shadow-md)` |

## File Ownership Rules (hard rules, never break)

| What belongs here | File | Must NOT appear in |
|-------------------|------|-------------------|
| Color/typography/spacing tokens | `src/styles/tokens.css` | any shell file |
| Button, input, card, badge, dialog primitives | `src/styles/primitives.css` | any shell file |
| Shell-level surface tokens | `src/styles/surfaces.css` | tokens.css |
| Cross-shell layout contracts | `src/styles.css` | shell files |
| Shell-specific layout only | `src/multitenant/*.css` | tokens or primitives |

## Acceptance Criteria

- [ ] Zero hex color values in any shell CSS file
- [ ] Zero raw font stacks in any shell CSS file
- [ ] Zero hardcoded border-radius values
- [ ] Zero hardcoded box-shadow values
- [ ] Zero `style={{ color:... }}` or `style={{ background:... }}` in any TSX file

---

---

# Phase 3C — Responsive Audit 🔲

**Status:** Not started  
**Estimated effort:** ~4 hours  
**Depends on:** Phase 3A (use ds-* classes) + Phase 3B (token compliance)

## Breakpoints (always these 5, no others)

```
1440px — no empty gaps on large screens
1280px — desktop grids balanced
1024px — sidebars/tables/actions still usable ← critical
768px  — header actions wrap cleanly ← critical
480px  — stacked layout, no clipping ← critical
```

## Current State Per Shell

| Shell | 1024 | 768 | 480 | Known failures |
|-------|:----:|:---:|:---:|---------------|
| Company Admin | ✅ | ⚠️ | ❌ | Users table clips, action buttons overlap |
| CMS Shell | ⚠️ | ❌ | ❌ | No topbar collapse, sidebar overflows |
| Content Editor | ⚠️ | ❌ | ❌ | 2-col layout needs 1024px collapse |
| Client Area | ✅ | ⚠️ | ❌ | Doc grid stacks but spacing breaks |
| Research App | ❌ | ❌ | ❌ | Zero responsive rules |
| SuperAdmin | ✅ | ✅ | ⚠️ | Company list wraps awkwardly at 480 |

## Priority Fixes (with CSS)

### Fix 1 — Content Editor single-column at 1024px

**File:** `src/multitenant/company-cms.css`

```css
@media (max-width: 1024px) {
  .editor-frame { grid-template-columns: 1fr; }
  .editor-tree  { display: none; }
  .editor-main  { max-width: 100%; padding: var(--ds-space-4); }
}
```

### Fix 2 — Company Admin table → card stack at 768px

**File:** `src/multitenant/company-admin.css`

```css
@media (max-width: 768px) {
  .ds-table thead { display: none; }
  .ds-table tr { display: grid; padding: var(--ds-space-3); border-bottom: 1px solid var(--ds-border-subtle); }
  .ds-table td { border: none; padding: 2px 0; }
  .ds-table td[data-label]::before { content: attr(data-label); font-size: var(--ds-text-xs); color: var(--ds-text-muted); display: block; }
}
```

### Fix 3 — CMS topbar hamburger at 768px

**File:** `src/multitenant/company-cms.css`

```css
@media (max-width: 768px) {
  .cms-topbar-nav { display: none; }
  .cms-topbar-hamburger { display: flex; }
}
```

### Fix 4 — Research App sidebar → bottom nav at 1024px

**File:** `src/multitenant/research.css`

```css
@media (max-width: 1024px) {
  .research-shell { grid-template-columns: 1fr; grid-template-rows: auto 1fr auto; }
  .research-sidebar { order: 3; display: flex; flex-direction: row; overflow-x: auto; border-top: 1px solid var(--ds-border-subtle); border-left: none; }
}
```

## Hard Responsive Rules (enforce in every CSS review)

```
✗ Never: height: 100vh  (use: calc(100vh - var(--ds-topbar-height)))
✗ Never: overflow: hidden on a parent with inner scroll, unless intentional + documented
✗ Never: horizontal overflow at any breakpoint
✗ Never: min-width on flex/grid children without min-width: 0
✗ Never: @media breakpoints other than 1440, 1280, 1024, 768, 480
✓ Always: controls wrap before clipping
✓ Always: tables either stack or scroll horizontally with overflow-x: auto
```

## Skills Required

- CSS Grid `grid-template-columns` responsive collapse
- `@media (max-width: N)` mobile-first breakpoints
- `display: none` + hamburger pattern for nav collapse
- `data-label` attribute + `::before` for table-to-card transform
- `IntersectionObserver` (Phase 6A — scroll-spy)

---

---

# Phase 3D — ResearchApp Design System Integration 🔲

**Status:** Not started  
**Estimated effort:** ~2 hours  
**Depends on:** Phase 3A (ds-* classes must exist first)

## Problem Being Solved

`src/multitenant/research.css` was written from scratch without design tokens.  
Token compliance: ~5%. Every color, font, radius, shadow is hardcoded.  
`ResearchApp.tsx` uses custom class names that duplicate what primitives.css already has.

## Strategy

1. Replace component classes with `ds-*` equivalents (in `ResearchApp.tsx`)
2. Keep only **layout rules** in `research.css` — no component styles
3. After cleanup, `research.css` should be ~40 lines

## Class Migration Map

| Current | Replace with |
|---------|-------------|
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
| `.research-empty` | `.ds-empty-state` (Phase 3A) |
| `.research-page-title` | `.ds-page-header-title` (Phase 3A) |
| `.research-dialog` | `.ds-dialog` (Phase 3A) |

## research.css After Cleanup (target: layout only)

```css
/* Layout skeleton — no component styles, all visual via ds-* */
.research-shell { display: grid; grid-template-columns: var(--ds-sidebar-width) 1fr; min-height: 100vh; }
.research-sidebar { border-right: 1px solid var(--ds-border-subtle); padding: var(--ds-space-4) 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.research-topbar { height: var(--ds-topbar-height); border-bottom: 1px solid var(--ds-border-subtle); display: flex; align-items: center; padding: 0 var(--ds-space-6); }
.research-content { padding: var(--ds-space-6); max-width: var(--ds-content-max); }
@media (max-width: 1024px) { .research-shell { grid-template-columns: 1fr; } }
```

---

---

# Phase 4A — Comments System 🔲

**Status:** Not started  
**Estimated effort:** ~4 hours  
**Depends on:** Phase 2D (section routes) + Phase 2E (workflow blocking rules)

## Backend

Comments table already exists (`Phase 2A`). Backend needs three routes:

```
GET  /api/v2/companies/:cid/sections/:sid/comments    [section.view]
POST /api/v2/companies/:cid/sections/:sid/comments    [section.comment]
PUT  /api/v2/companies/:cid/comments/:coid/resolve    [section.approve]
```

**POST payload:**
```json
{ "body": "...", "isBlocking": true, "parentId": null }
```

**Resolve:** sets `resolved = 1`, `resolved_by = actorId`, `resolved_at = now()`.

**Blocking check** (already in `workflow.mjs` checkBlockingRules):
```sql
SELECT COUNT(*) as n FROM comments
WHERE section_id = ? AND is_blocking = 1 AND resolved = 0
```

## Frontend — Section Editor Right Panel

```tsx
// Component: SectionCommentPanel
// Location: right-column sidebar of section editor in App.tsx

// Visual states:
// Normal comment: white bg, left border ds-border-subtle
// Blocking comment: amber left border (3px), amber-50 background
// Resolved comment: 50% opacity + line-through on body text
// Blocking count badge: red pill on section card header (count of unresolved blocking)
// "Submit for Review" button: disabled when blockingCount > 0
```

**Data flow:**
```
User opens section editor
  ↓
GET /sections/:sid/comments
  ↓
Render thread
  ↓
User clicks "Comment"
  ↓
POST /sections/:sid/comments { body, isBlocking }
  ↓
Re-fetch thread
  ↓
Reviewer clicks "Resolve"
  ↓
PUT /comments/:coid/resolve
  ↓
Re-fetch thread
```

## Skills Required

- `fetch` with `PUT` method for resolve endpoint
- React controlled textarea + checkbox for comment form
- Conditional CSS classes for comment visual states
- Optimistic UI: show comment immediately, refetch on error

---

---

# Phase 4B — Workflow Transition UI 🔲

**Status:** Not started  
**Estimated effort:** ~3 hours  
**Depends on:** Phase 2D + Phase 2E

## Replace Status Dropdowns with Transition Buttons

**Current:** `<select>` with all statuses listed → direct PATCH to status field  
**Target:** buttons showing only valid next transitions for current status

```
If section.status === 'draft':    show "Submit for Review" button
If section.status === 'review':   show "Approve" + "Request Changes" buttons
If section.status === 'approved': show "Publish" (if can release.publish)
```

Buttons are computed from:
```ts
const allowedTransitions = TRANSITIONS[entityType][entity.status] ?? [];
// TRANSITIONS map lives in frontend (mirror of server/workflow.mjs)
```

## Pre-Transition Blocking Check UI

Before confirming any transition to `approved` / `published` / `staged`:
1. Show confirm dialog
2. If any blocking issues exist (from API 422 response with `issues[]`), show as checklist
3. "Confirm" button disabled while there are unresolved issues
4. Issues use: `⚠️ icon + message`, resolved issue = `✅ strikethrough`

## Workflow History Timeline

```
GET /documents/:did/transitions  →  workflow_transitions rows, ordered by created_at ASC
```

Displayed as a vertical timeline:
- Each entry: avatar initial + "Actor moved to **status**" + relative timestamp
- Current status = highlighted with accent border
- Optional: show `note` field beneath the entry

## Skills Required

- React state for `confirming: string | null` (pending transition target)
- `fetch` error handling: catch 422 + parse `{ error, issues }` from response body
- Conditional button rendering from transition map
- Date formatting: `formatRelativeDate(created_at)` utility

---

---

# Phase 4C — Translation Locale Management 🔲

**Status:** Not started  
**Estimated effort:** ~5 hours  
**Depends on:** Phase 2D (translation routes)

## Current State

`translations` table exists but uses generic `language_code / key_id / value` structure (old pattern).  
`translation_locales` and `translation_strings` tables exist (Phase 2A) but are empty — no UI writes to them.

## Target State

### Locale Switcher Panel (CMS document → Translation tab)

```
┌─────────────────────────────────────────────────────────┐
│ Georgian (KA)   ████████████░░░░  72%  [in-progress]   │
│ German (DE)     ████████████████  94%  [review]        │
│ French (FR)     ░░░░░░░░░░░░░░░░   0%  [not-started]   │
└─────────────────────────────────────────────────────────┘
```

Status follows: `not-started → in-progress → review → published`

### Translation Strings Editor (per locale)

Table view:
```
Section title | Original (EN) | Translation (KA) | State
─────────────────────────────────────────────────────────
Introduction  | Hello world   | [textarea]        | dirty
Chapter 1     | Getting start | [textarea]        | saved
```

Row states:
- `dirty` — changed but not saved (amber highlight)
- `saved` — confirmed write to DB
- `review` — flagged for translator review

Auto-saves on blur (debounced 500ms).

### Release Readiness Integration

`GET /releases/:rid/readiness` returns `translationThreshold.ok = false` if any locale < 90%.

UI warning banner in release panel:
```
⚠️ Release Blocked: Georgian 72% (minimum 90% required)
```

## Backend Routes (Phase 2D implements these)

```
GET /documents/:did/translation-locales            → SELECT FROM translation_locales
PUT /documents/:did/translation-locales/:locale/status  → saveLocale()
GET /sections/:sid/translation-strings             → SELECT FROM translation_strings WHERE section_id=?
PUT /sections/:sid/translation-strings/:locale     → saveString()
```

## Skills Required

- CSS `background: linear-gradient(...)` or `width: ${pct}%` for progress bars
- React debounced save with `useEffect` + `setTimeout`/`clearTimeout`
- `IntersectionObserver` or scroll-based virtualization for large string tables (optional, low priority)

---

---

# Phase 4D — Product Members 🔲

**Status:** Not started  
**Estimated effort:** ~2 hours  
**Depends on:** Phase 2D + Phase 2C

## Purpose

Assign users to a specific product with a product-scoped role.  
Does NOT grant tenant-wide power. Does NOT affect other products.

Example: User A is `viewer` at tenant level, but `editor` on Product X only.

## Backend Routes

```
GET    /api/v2/companies/:cid/products/:pid/members           [product.view]
POST   /api/v2/companies/:cid/products/:pid/members           [product.manage]
        body: { userId, role }
DELETE /api/v2/companies/:cid/products/:pid/members/:uid      [product.manage]
```

Storage: `product_members` table (already exists from Phase 2A).

`ON CONFLICT(product_id, user_id) DO UPDATE SET role = excluded.role` — update role if user already member.

## Frontend — "Team" Tab

**Location:** Company Admin → Product detail → Team tab, OR CMS sidebar → Team section

```
Team Members (scoped to this product only)
[Add Member]

Name        Email           Role        Granted By    Since
──────────────────────────────────────────────────────────────
Alice S.    alice@co.com   [editor]    admin         Jan 15
Bob K.      bob@co.com     [reviewer]  admin         Feb 3
                                                    [Remove]
```

Role selector in the add-member form shows only: `editor`, `reviewer`, `viewer`  
(not `company-admin` — that is tenant-wide only)

---

---

# Phase 4E — Release Full Lifecycle UI 🔲

**Status:** Not started  
**Estimated effort:** ~5 hours  
**Depends on:** Phase 2D + Phase 2E (release transitions)

## Current State vs Target

| Current | Target |
|---------|--------|
| 2 states: `draft` / `published` | 6 states: `draft → review → approved → staged → published → rolled-back` |
| No transition history | Stepper with actor + timestamp per step |
| No readiness checklist | Full readiness panel from `/readiness` endpoint |
| No rollback | Rollback button with confirmation dialog |
| No environment labels | `staging` / `production` badges |

## Release Status Stepper Component

```
[draft] ──► [review] ──► [approved] ──► [staged] ──► [published]
                                                          ↓
                                                    [rolled-back]
```

Each completed step shows:
- Status badge (`.ds-status-{status}`)
- Actor name who made the transition
- Timestamp (relative)
- Next action button (only if current user has permission)

## Readiness Panel Items

```
Document sections: 3/4 approved     [✅/⚠️]
Translation (KA): 72% (min 90%)     [✅/⚠️]
Release notes: present              [✅/⚠️]
Snapshot: not created yet           [✅/⚠️]
Unsafe HTML: none found             [✅/⚠️]
Reviewer: assigned                  [✅/⚠️]
──────────────────────────
Overall: NOT READY
```

When all items ✅: "Publish" button becomes enabled.

## Rollback

- Button only visible when `status === 'published'`
- Confirm dialog: explains snapshot is preserved, creates a transition record
- On confirm: `POST /releases/:rid/rollback`
- Server: `applyTransition('release', id, 'rolled-back', actorId)`

## Environment Labels

| Status | Badge |
|--------|-------|
| `draft` / `review` / `approved` | no environment badge |
| `staged` | `staging` (amber) |
| `published` | `production` (green) |
| `rolled-back` | `production (rolled back)` (neutral) |

---

---

# Phase 5A — Research Backend 🔲

**Status:** Not started  
**Estimated effort:** ~5 hours  
**Depends on:** Phase 2D  
**Blocks:** Phase 5B (CMS bridge)

## Problem Being Solved

`ResearchApp.tsx` is 100% mock — all sources, jobs, and drafts live in React state only.  
On page refresh, all data is lost.  
There is no real analysis, no LLM call, no persistence.

## Architecture

```
ResearchApp (frontend)
    ↓  REST API
server/research/ (backend)
    ├── sources.mjs   — CRUD for research sources (URLs or uploaded docs)
    ├── jobs.mjs      — async analysis job queue (pending → running → completed/failed)
    └── drafts.mjs    — AI-generated draft content + send-to-CMS bridge
        ↓
    kv_store (temporary)  →  Phase 5 migrates to proper tables
```

## API Routes (in api-v2.mjs)

```
GET    /api/v2/companies/:cid/research/sources
POST   /api/v2/companies/:cid/research/sources           body: { url, title, type }
GET    /api/v2/companies/:cid/research/sources/:sid
DELETE /api/v2/companies/:cid/research/sources/:sid

POST   /api/v2/companies/:cid/research/sources/:sid/analyze  → triggers async job
GET    /api/v2/companies/:cid/research/jobs              → list all jobs for company

GET    /api/v2/companies/:cid/research/drafts
POST   /api/v2/companies/:cid/research/drafts/:did/send-to-cms   body: { productId }
```

## Job Lifecycle

```
POST /sources/:sid/analyze
    ↓ creates job: { id, status: 'pending' }
    ↓ fires async (no await) runAnalysis()
    ↓ returns { job }  (status: 'pending')

Client polls GET /jobs until job.status === 'completed' or 'failed'
    (Phase 5: replace polling with SSE stream)

runAnalysis():
    1. UPDATE job status → 'running'
    2. Fetch URL content (or read uploaded file)
    3. Call AI API (Claude) for analysis  ← Phase 5 real implementation
    4. Store result in job.result
    5. UPDATE job status → 'completed' / 'failed'
```

## Draft Object Schema

```json
{
  "id": "rdr_xxx",
  "company_id": "comp_xxx",
  "title": "Getting Started Guide",
  "source_id": "src_xxx",
  "content": "<h2>...</h2><p>...</p>",
  "status": "pending-review | sent-to-cms | discarded",
  "cms_document_id": null,
  "created_at": "2026-06-09T..."
}
```

## `send-to-cms` Flow

```
POST /research/drafts/:did/send-to-cms { productId }
    ↓
documentAdapter.save({
    company_id, product_id,
    title: draft.title,
    type: 'guide',
    status: 'draft',
    metadata: JSON.stringify({
        researchSourceId: draft.source_id,
        researchDraftId: draft.id
    })
}, actorId)
    ↓
Returns { documentId }
    ↓
Frontend navigates to /c/:slug/admin/cms/documents/:documentId
```

## Skills Required

- Node.js async fire-and-forget pattern (`runAnalysis().catch(...)`)
- `kv_store` JSON object storage for research entities
- Claude API integration (Phase 5: `@anthropic-ai/sdk`, `client.messages.create()`)
- SSE (Server-Sent Events) for real-time job status streaming (Phase 5 enhancement)

---

---

# Phase 5B — CMS Bridge 🔲

**Status:** Not started  
**Estimated effort:** ~1.5 hours  
**Depends on:** Phase 5A + Phase 2D

## Frontend Changes

### ResearchApp Draft Review page

```tsx
// "Send to CMS" button → POST /research/drafts/:did/send-to-cms
// After success: navigate to CMS editor for the new document
// Show product picker before sending (which product to attach the document to)
```

### CMS Document Detail — Research Badge

```tsx
// If document.metadata?.researchSourceId exists:
<a href={`/c/${slug}/admin/research/sources/${metadata.researchSourceId}`}
   className="ds-badge research-source-badge">
  🔬 From Research
</a>
```

This creates a two-way link: CMS doc → research source, research draft → CMS doc.

---

---

# Phase 6A — Reader Modernization 🔲

**Status:** Not started  
**Estimated effort:** ~4 hours  
**Depends on:** Phase 3B (token system complete)

## Files to Change

```
src/reader/DocReader.tsx   — scroll-spy, language/version switchers
src/reader/reader.css      — token migration from hardcoded values
src/reader/theme.ts        — remove raw color values, delegate to var(--ds-*)
```

## Current Problems

| Problem | Location |
|---------|---------|
| `theme.ts` has raw hex colors | `src/reader/theme.ts` |
| Dark/light mode via inline style injection | `DocReader.tsx` |
| No sticky TOC | missing |
| No scroll-spy | missing |
| No language switcher tied to `translation_locales` | missing |
| No version switcher tied to published `releases` | missing |

## Theme Migration

```ts
// theme.ts BEFORE:
export const readerTheme = {
  light: { bg: '#ffffff', text: '#1e293b', border: '#e3e8ed' }
};

// theme.ts AFTER:
// Theme is controlled entirely by CSS variables.
// Dark mode: add data-theme="dark" to .reader-shell, override tokens.
export const READER_THEMES = ['system', 'light', 'dark'] as const;
```

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

## Sticky TOC + Scroll-Spy

```tsx
// In DocReader.tsx:
useEffect(() => {
  const observer = new IntersectionObserver(
    entries => {
      const visible = entries.find(e => e.isIntersecting);
      if (visible) setActiveId(visible.target.id);
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
  );
  sections.forEach(s => {
    const el = document.getElementById(`section-${s.id}`);
    if (el) observer.observe(el);
  });
  return () => observer.disconnect();
}, [sections]);
```

TOC item with active state:
```tsx
<a href={`#section-${s.id}`}
   className={`toc-item ${activeId === `section-${s.id}` ? 'active' : ''}`}>
  {s.title}
</a>
```

## Language Switcher

```tsx
// Data: GET /api/v2/companies/:cid/documents/:did/translation-locales
// Show only locales with status === 'published'
// On change: reload content with ?locale=ka param
```

## Version Switcher

```tsx
// Data: GET /api/v2/companies/:cid/releases?status=published
// On change: load that release's snapshot content
```

## URL Structure

```
/c/:slug/docs/:docSlug              → current version, default locale
/c/:slug/docs/:docSlug?locale=ka    → Georgian translation
/c/:slug/docs/:docSlug?version=2.1  → specific version
```

Auth gate: `DocAuthGate` component already exists — reader is protected by existing mechanism.

---

---

# Phase 6B — API Keys + Webhooks 🔲

**Status:** Not started  
**Estimated effort:** ~5 hours  
**Depends on:** Phase 2D

## Problem Being Solved

API keys and webhook endpoints are currently stored in `kv_store` JSON (legacy).  
No proper lifecycle: create, last-used tracking, revocation, delivery log.

## Schema Additions (server/schema.sql)

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,    -- SHA-256 of raw token (never store raw)
  key_prefix TEXT NOT NULL,         -- first 8 chars for display: "dk_live_xxxxxxxx..."
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
  secret TEXT NOT NULL,             -- HMAC signing secret
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

## API Routes

```
GET    /api/v2/companies/:cid/api-keys               [api-key.manage]
POST   /api/v2/companies/:cid/api-keys               body: { name, scopes? }
        → generates crypto token, stores hash only, returns raw token ONCE
DELETE /api/v2/companies/:cid/api-keys/:kid          → sets revoked_at

GET    /api/v2/companies/:cid/webhooks               [webhook.manage]
POST   /api/v2/companies/:cid/webhooks               body: { url, events? }
PUT    /api/v2/companies/:cid/webhooks/:wid          body: { url?, events?, active? }
DELETE /api/v2/companies/:cid/webhooks/:wid
GET    /api/v2/companies/:cid/webhooks/:wid/deliveries
```

## Bearer Token Auth Extension (api-v2.mjs)

```js
// In loadAuthFromRequest(), after cookie check:
const authHeader = req.headers['authorization'] ?? '';
if (authHeader.startsWith('Bearer ')) {
  const rawToken = authHeader.slice(7);
  const keyHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const key = db.prepare(`
    SELECT ak.*, c.id as cid FROM api_keys ak
    WHERE ak.key_hash = ? AND ak.revoked_at IS NULL
  `).get(keyHash);

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

## Webhook Delivery

After any significant event (document published, release published, etc.):
```js
// In api-v2.mjs after successful transitions:
await deliverWebhooks(companyId, 'document.published', { documentId, ... });
```

```js
// server/webhooks.mjs
export async function deliverWebhooks(companyId, event, payload) {
  const endpoints = db.prepare(
    "SELECT * FROM webhook_endpoints WHERE company_id = ? AND active = 1"
  ).all(companyId);

  for (const ep of endpoints) {
    const eventsFilter = JSON.parse(ep.events);
    if (!eventsFilter.includes('*') && !eventsFilter.includes(event)) continue;

    const body = JSON.stringify({ event, data: payload, timestamp: nowIso() });
    const sig = crypto.createHmac('sha256', ep.secret).update(body).digest('hex');

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

## Skills Required

- `crypto.createHash('sha256')` — hashing raw API keys before storage
- `crypto.createHmac('sha256')` — signing webhook payloads
- `AbortSignal.timeout(5000)` — fetch timeout for webhook delivery
- Bearer token parsing from `Authorization` header

---

---

# Cross-Cutting Concerns (apply to every phase)

## Security Rules

| Rule | Where enforced |
|------|---------------|
| All HTML stored in sections must be sanitized | Phase 2E: `has_unsafe_html` flag + blocking rule |
| Never store raw API keys | Phase 6B: SHA-256 hash only |
| Tenant isolation: user can only access their `company_id` | Every route: `if (user.company_id !== cid && !superadmin)` |
| Session expiry: 7 days, checked on every request | `auth.mjs` loadAuthFromRequest |
| Password policy: 12+ chars, upper+lower+digit+symbol | `auth.mjs` validatePasswordPolicy |
| Rate limiting: 5 fails per 15min per IP/email | `auth.mjs` isRateLimited |
| CORS: `access-control-allow-credentials: true` | `api-v2.mjs` send() |

## Error Shape (consistent across all routes)

```json
// 400 Bad Request
{ "error": "name is required" }

// 401 Unauthorized
{ "error": "Unauthorized" }

// 403 Forbidden
{ "error": "Missing permission: document.edit" }

// 404 Not Found
{ "error": "Document not found" }

// 422 Unprocessable (workflow block)
{ "error": "Transition blocked: ...", "issues": ["Section title is empty", "..."] }

// 500 Internal
{ "error": "Internal server error" }
```

## Audit Event Shape (consistent across all write operations)

```js
appendAudit({
  companyId:  string,
  userId:     string | null,
  action:     string,           // e.g. 'document.create'
  entityType: string | null,    // e.g. 'document'
  entityId:   string | null,
  productId:  string | null,    // FK context
  documentId: string | null,    // FK context
  sectionId:  string | null,    // FK context
  releaseId:  string | null,    // FK context
  ip:         string | null,
  summary:    string | null,
});
```

## DB Utilities (always use these, never raw random/date)

```js
import { makeId, makeSlug, makeToken, nowIso, db } from './db.mjs';

makeId('prod')   // → 'prod_a1b2c3d4e5f6g7h8'
makeId('doc')    // → 'doc_...'
makeSlug()       // → 16-char base64url (for URL-safe slugs)
makeToken()      // → 256-bit session token
nowIso()         // → '2026-06-09T12:00:00.000Z'
```

---

---

# What NOT to Build Until Phase 4 is Complete

These are explicitly out of scope until all Phase 4 items are done:

| Feature | Reason to wait |
|---------|---------------|
| Analytics dashboards | Need real workflow data first |
| Jira / GitHub sync | Complex bidirectional state — too early |
| Elasticsearch | No search index needed until content is normalized |
| Automated AI translation | Must have human review workflow first (Phase 4C) |
| SSO / SAML | Auth system is stable — add this only when enterprise customers arrive |
| Real-time collaboration (WebSocket) | Concurrent editing requires CRDT/OT — separate project |
| Complex public reader redesign beyond Phase 6A | Reader is a reader, not a product |

---

---

# Dependency Graph (visual)

```
Phase 2A (complete)
  ├──► Phase 2B (adapter)
  │      └──► Phase 2D (API v2 content)
  │              └──► Phase 4A (comments)
  │              └──► Phase 4C (translations)
  │              └──► Phase 4D (members)
  │              └──► Phase 4E (release UI)
  │              └──► Phase 5A (research backend)
  │                      └──► Phase 5B (CMS bridge)
  └──► Phase 2C (authz)
  │      └──► Phase 2D (routes need can())
  └──► Phase 2E (workflow engine)
         └──► Phase 4B (transition UI)
         └──► Phase 4A (blocking comments)

Phase 3A (primitives)
  └──► Phase 3B (token pass)
  └──► Phase 3D (research design system)

Phase 3C (responsive) — independent, parallel with Phase 2

Phase 6A (reader) — after Phase 3B
Phase 6B (API keys) — after Phase 2D
```

---

# Priority Order (canonical sequence)

```
✅ DONE     Phase 1    — Planning
✅ DONE     Phase 2A   — Schema completion

🔲 NOW      Phase 2B   — Storage adapter layer
🔲 NOW      Phase 2C   — Permission system refactor     (parallel with 2B)
🔲 THEN     Phase 2D   — API v2 content expansion       (needs 2B + 2C)
🔲 THEN     Phase 2E   — Workflow engine                (parallel with 2D)

🔲 NEXT     Phase 3A   — Primitive component extraction
🔲 NEXT     Phase 3B   — Token completion pass
🔲 NEXT     Phase 3C   — Responsive audit
🔲 NEXT     Phase 3D   — ResearchApp design system

🔲 AFTER    Phase 4A   — Comments system
🔲 AFTER    Phase 4B   — Workflow transition UI
🔲 AFTER    Phase 4C   — Translation locale management
🔲 AFTER    Phase 4D   — Product members
🔲 AFTER    Phase 4E   — Release full lifecycle UI

🔲 LATER    Phase 5A   — Research backend
🔲 LATER    Phase 5B   — CMS bridge
🔲 LATER    Phase 6A   — Reader modernization
🔲 LATER    Phase 6B   — API keys + webhooks
```
