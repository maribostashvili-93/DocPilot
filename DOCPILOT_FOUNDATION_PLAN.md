# DocPilot Foundation Plan

## Goal

Stabilize the DocPilot platform spine before adding heavier features such as AI, advanced analytics, or deep integrations.

Core workflow target:

`Product -> Document -> Section -> Review -> Translate -> Release -> Publish`

---

## Phase 1 — Planning (COMPLETE ✅)

### Deliverables

| File | Status |
|------|--------|
| WORKFLOW_MATRIX.md | ✅ Done |
| PERMISSION_MATRIX.md | ✅ Done |
| DB_SCHEMA_DRAFT.md | ✅ Done |

### What Phase 1 defined

1. Canonical entity map: Tenant, User, Product, Document, Section, Translation, Release, MediaAsset, Comment, ActivityEvent, PermissionGrant
2. Workflow states and transition rules for all entities
3. Granular permission model: `can(user, action, resource, scope)`
4. 5-step persistence migration plan (JSON → PostgreSQL/SQLite)
5. Activity/audit event normalization

---

## Phase 2 — Foundation Implementation

### Current state before Phase 2

The codebase has a working but incomplete foundation:

- **Database**: SQLite with basic tables. 8 tables from the schema draft are missing.
- **API**: `/api/v2/` covers only auth + tenant management. Content APIs (products, documents, sections, translations, releases) still run through the legacy JSON kv_store.
- **Permissions**: Flat role strings. No scoped `can()` check. Same permission map duplicated in `server/docpilot-server.mjs` and `src/storage.ts`.
- **Release states**: Only `draft | published | rolled-back`. Missing `review | approved | staged`.
- **Storage**: Two parallel systems: `src/storage.ts` (localStorage + kv_store) and SQLite v2. No adapter layer connects them.
- **Translation**: Key-value blob table. Not per document×locale as the workflow matrix requires.

---

### Phase 2A — Schema Completion

**Files to change:** `server/schema.sql`, `server/migrate.mjs`

**Missing tables to add:**

```
permission_grants       — scoped action grants replacing flat roles
translation_locales     — per document × locale status tracking
translation_strings     — per section × locale string with state
release_items           — content bundled inside a release
release_snapshots       — immutable snapshot at publish time (separate from releases row)
product_members         — per-product user role delegation
comments                — section-level threaded comments with blocking flag
workflow_transitions    — auditable state change log
```

**Fixes to existing tables:**

- `releases.status` — add `review | approved | staged` to allowed values
- `audit_events` — add `document_id`, `section_id`, `release_id` columns for FK context
- `translations` — keep as legacy, but create `translation_locales` and `translation_strings` alongside it

**Deliverable:** Updated `server/schema.sql` with all tables + `server/migrate.mjs` updated migration runner.

---

### Phase 2B — Storage Adapter Layer

**Files to create:** `server/adapter/index.mjs`, `server/adapter/documents.mjs`, `server/adapter/sections.mjs`, `server/adapter/products.mjs`, `server/adapter/translations.mjs`, `server/adapter/releases.mjs`

**What it does:**

Each adapter module exports:
- `get(id)` — reads from SQLite (falls back to kv_store if record not migrated yet)
- `save(entity)` — writes to SQLite AND kv_store (dual-write phase)
- `list(tenantId, filters)` — queries SQLite

This is the Phase 2 Step 1 → Step 2 bridge from DB_SCHEMA_DRAFT.md.

Dual-write continues until Phase 2D removes the kv_store as primary.

**Deliverable:** Adapter interface + implementations for all 5 entity types.

---

### Phase 2C — Permission System Refactor

**Files to create:** `server/authz.mjs`
**Files to change:** `server/api-v2.mjs`, `server/docpilot-server.mjs`, `src/storage.ts`

**Action catalog** (replaces flat `documents:write` map):

```
product.view        product.create      product.edit        product.archive
document.view       document.create     document.edit       document.review     document.approve    document.archive
section.view        section.create      section.edit        section.comment     section.review      section.approve     section.delete
translation.view    translation.edit    translation.review  translation.publish
release.view        release.create      release.review      release.approve     release.stage       release.publish     release.rollback
media.view          media.upload        media.edit          media.delete
user.view           user.invite         user.edit           user.deactivate
settings.view       settings.edit
integration.view    integration.manage
```

**`can(user, action, resource, scope)` function:**

```js
// server/authz.mjs
export function can(user, action, resourceType, scopeId = null) {
  // 1. Check platform grants
  // 2. Check role-based default grants
  // 3. Check explicit permission_grants row
  // 4. Check product_members if scopeId is a productId
}
```

**Role default baseline map** (replaces WRITE_PERMISSIONS in both server and client):

```
admin           → all actions
company-admin   → product.* document.* section.* media.* user.view user.invite user.edit settings.*
editor          → document.view/create/edit section.view/create/edit/comment media.view/upload/edit translation.view
reviewer        → document.view/review/approve section.view/comment/review/approve translation.view/review
viewer          → *.view only
partner         → document.view section.view/comment translation.view (+ optional edit per grant)
tam             → document.view/edit/review section.view/edit/comment/review release.view/create
developer       → document.view/edit section.view/edit media.view settings.view integration.*
```

**Deliverable:** `server/authz.mjs` with action catalog, role baseline map, and `can()` function. Old flat checks replaced across server + client.

---

### Phase 2D — API v2 Content Expansion

**File to change:** `server/api-v2.mjs`

**New endpoint groups to implement:**

#### Products

```
GET    /api/v2/companies/:cid/products
POST   /api/v2/companies/:cid/products
PUT    /api/v2/companies/:cid/products/:pid
DELETE /api/v2/companies/:cid/products/:pid
PUT    /api/v2/companies/:cid/products/:pid/status
```

#### Documents

```
GET    /api/v2/companies/:cid/products/:pid/documents
POST   /api/v2/companies/:cid/products/:pid/documents
PUT    /api/v2/companies/:cid/documents/:did
DELETE /api/v2/companies/:cid/documents/:did
POST   /api/v2/companies/:cid/documents/:did/transition   — workflow state change
```

#### Sections

```
GET    /api/v2/companies/:cid/documents/:did/sections
POST   /api/v2/companies/:cid/documents/:did/sections
PUT    /api/v2/companies/:cid/sections/:sid
DELETE /api/v2/companies/:cid/sections/:sid
POST   /api/v2/companies/:cid/sections/:sid/transition
GET    /api/v2/companies/:cid/sections/:sid/comments
POST   /api/v2/companies/:cid/sections/:sid/comments
PUT    /api/v2/companies/:cid/comments/:cid/resolve
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
PUT    /api/v2/companies/:cid/releases/:rid
POST   /api/v2/companies/:cid/releases/:rid/transition   — draft→review→approved→staged→published
POST   /api/v2/companies/:cid/releases/:rid/rollback
GET    /api/v2/companies/:cid/releases/:rid/readiness    — readiness score check
```

#### Media

```
POST   /api/v2/companies/:cid/media          — upload (multipart)
GET    /api/v2/companies/:cid/media
PUT    /api/v2/companies/:cid/media/:mid
DELETE /api/v2/companies/:cid/media/:mid
```

**Deliverable:** All endpoint groups wired in api-v2.mjs, using storage adapter + authz.

---

### Phase 2E — Workflow Engine

**File to create:** `server/workflow.mjs`

**What it does:**

- `validateTransition(entityType, fromStatus, toStatus)` — allowed transition check
- `checkBlockingRules(entityType, entityId)` — pre-condition enforcement
- `recordTransition(entityType, entityId, from, to, actorId)` — writes to `workflow_transitions`
- `releaseReadiness(releaseId)` — returns readiness score + blocking issues

Enforces rules from WORKFLOW_MATRIX.md sections 1–5 at API layer.

**Deliverable:** `server/workflow.mjs` wired into all transition endpoints.

---

## Phase 3 — UI Polish & Design System

### Current UI state (post Phase 2 CSS work)

**What's already done:**
- Design token system: `src/styles/tokens.css`, `primitives.css`, `surfaces.css`
- Primitive components: `.ds-btn`, `.ds-input`, `.ds-card`, `.ds-badge`, `.ds-table`, `.ds-nav-item`, `.ds-stat`
- CMS scroll conflict resolved
- Company Admin shell — strongest token usage
- Client Area — unified login, CTA, and surface language

**What still needs work:**
- `src/multitenant/multitenant.css` — historical layers with hardcoded hex values
- `src/styles.css` — main CMS, large file, partial hardcoded values remain
- ResearchApp — not integrated into design system
- Tables across management panels — inconsistent row spacing and header style
- Form fields in CMS edit modes — some page-specific treatments remain
- Responsive: CMS not audited at tablet/mobile breakpoints

---

### Phase 3A — Component Extraction

**Files to change:** `src/styles/primitives.css`, `src/multitenant/multitenant.css`, `src/styles.css`

Extract repeated patterns into shared utility classes:

| Pattern | Currently | Target |
|---------|-----------|--------|
| Topbar action pills | duplicated in 3 shells | `.ds-topbar-pill` |
| Sidebar nav groups | custom per shell | `.ds-nav-group` + `.ds-nav-item` (already in primitives) |
| Status transition pill | inline per page | `.ds-status-{draft,review,approved,published,archived}` |
| Empty state block | inline per page | `.ds-empty-state` |
| Page header | duplicated | `.ds-page-header` |
| Data table action row | duplicated | `.ds-table-actions` |
| Section card | custom per page | `.ds-section-card` |
| Inline edit overlay | inline per page | `.ds-inline-editor` |

**Deliverable:** Shared utility classes added to primitives.css. Shell-local duplicates replaced with utility references.

---

### Phase 3B — Token Completion Pass

**Files to change:** `src/multitenant/multitenant.css`, `src/styles.css`, `src/multitenant/research.css`

Hunt and replace all remaining:

- Hardcoded hex colors (`#ff1b23`, `#63cdff`, `#191919`, `rgba(...)`) → `var(--ds-*)` tokens
- Raw `'Sansation'` / `'Roboto'` font stacks → `var(--ds-font-display)` / `var(--ds-font-body)`
- Raw `border-radius: 6px` / `8px` / `10px` → `var(--ds-radius-*)`
- Raw `box-shadow: 0 ...` → `var(--ds-shadow-*)`
- Raw `transition: 0.18s ease` → `var(--ds-transition-base)`

**Deliverable:** No raw primitive values in shell CSS files. Only token references.

---

### Phase 3C — Responsive Audit

**Breakpoints:** 1440 / 1280 / 1024 / 768 / 480px

**Pages to audit:**

| Page | Known issues |
|------|-------------|
| Company Admin (users tab) | Table clips at 768px |
| CMS Shell topbar | Nav pills may wrap without gap control |
| Content Editor | 2-column layout needs 1024px collapse rule |
| Client Area | Welcome block + doc grid needs 768px pass |
| ResearchApp | Source list + job queue need mobile layout |
| Release panel | Multi-step flow needs narrow viewport check |

**Deliverable:** Each page passes at all 5 breakpoints without horizontal overflow or clipping.

---

### Phase 3D — ResearchApp Design System Integration

**File to change:** `src/multitenant/research.css`

Currently uses its own CSS without token references. Needs:

- Replace all hardcoded values with `var(--ds-*)` tokens
- Replace custom button/input/card styles with `.ds-btn`, `.ds-input`, `.ds-card`
- Align sidebar nav with `.ds-nav-item` / `.ds-nav-group`
- Status badges → `.ds-status-{pending,ready,failed}`

**Deliverable:** `research.css` reduced to layout-only rules. Component styles delegated to primitives.

---

## Phase 4 — Feature Completion

### Phase 4A — Comments System

**Backend:**
- `comments` table (in schema.sql after Phase 2A)
- Section comment CRUD endpoints (in Phase 2D above)
- `is_blocking` + `resolved` flags

**Frontend (`src/App.tsx` section editor):**
- Comment thread panel in section editor sidebar
- Blocking comment indicator in section status
- Resolve/reopen controls
- Comment count badge on section card

**Workflow integration:**
- Section cannot move to `approved` if unresolved blocking comments exist
- Blocking rules check queries `comments` table

---

### Phase 4B — Workflow Transition UI

**Frontend:**

- Per-entity status dropdown replaced with explicit transition buttons
  - `Submit for Review`, `Approve`, `Request Changes`, `Archive`
- Transition buttons show/hide based on `can()` result from server
- Blocking rules displayed as a pre-check list before transition
- `workflow_transitions` log shown in section/document detail view

---

### Phase 4C — Translation Locale Management

**Frontend (`src/App.tsx` translation tab):**

- Per-locale progress bar (completion_pct from `translation_locales`)
- Locale status badges matching WORKFLOW_MATRIX.md states
- Release readiness indicator per locale
- Threshold warning when completion_pct < policy

---

### Phase 4D — Product Members

**Frontend (Company Admin):**

- Product-level member management tab
- Invite user to product with specific role
- Role scopes visible to company-admin
- product_members table backed

---

### Phase 4E — Release Full Lifecycle UI

**Frontend:**

- Release status stepper: `draft → review → approved → staged → published`
- Readiness score panel (from `/releases/:id/readiness`)
- Rollback confirmation with new release creation
- Environment labels: `draft | staging | production`
- Snapshot viewer (read-only published content)

---

## Phase 5 — AI Research Center

### Phase 5A — Backend Integration

**Files to create:** `server/research/sources.mjs`, `server/research/jobs.mjs`, `server/research/drafts.mjs`

- Source ingestion: URL fetch + content extraction
- Job queue: async processing per source
- Draft generation: AI-assisted section drafts from source content
- API routes: `/api/v2/companies/:cid/research/*`

### Phase 5B — CMS Bridge

**Frontend:**

- "Send to CMS" from ResearchApp draft detail page
- Creates a document draft in the CMS with research source attribution
- Research source linked to document via metadata field
- Source URL visible in document detail

---

## Phase 6 — Public Reader & Integrations

### Phase 6A — Reader Modernization

- Token-based theming (reader currently uses legacy theme.ts color system)
- Improved section navigation (sticky TOC, scroll-spy)
- Search within document
- Reader accessible at `/c/:slug/docs/:docSlug` with auth gate

### Phase 6B — API Keys + Webhooks

- Tenant API key management UI (backed by kv_store currently, migrate to SQLite)
- Webhook management UI
- Delivery log
- Auth: `Bearer <api-key>` header support in api-v2.mjs

---

## What Not To Build Until Phase 4 Is Complete

- Heavy analytics dashboards
- Jira / GitHub bidirectional sync
- Dedicated search platform (Elasticsearch, etc.)
- Complex public reader redesign beyond 6A
- Multi-language AI translation (automated, not human-reviewed)

---

## Implementation Priority Order

```
Phase 2A  Schema completion                     ← start here
Phase 2B  Storage adapter layer
Phase 2C  Permission system refactor
Phase 2D  API v2 content expansion
Phase 2E  Workflow engine

Phase 3A  Component extraction
Phase 3B  Token completion pass
Phase 3C  Responsive audit
Phase 3D  ResearchApp design system integration

Phase 4A  Comments system
Phase 4B  Workflow transition UI
Phase 4C  Translation locale management
Phase 4D  Product members
Phase 4E  Release full lifecycle UI

Phase 5A  Research backend
Phase 5B  CMS bridge

Phase 6A  Reader modernization
Phase 6B  API keys + webhooks
```
