> I've been working on fully implementing the DocPilot v2 features based on the implementation plan.
> I know this is a massive PR (covering DB schemas, auth, UI, and new APIs). If it is too large
> to review all at once, please let me know — I'm more than happy to break it down into smaller,
> focused PRs (e.g., Database + Auth first, then UI updates). Looking forward to your feedback!

---

## Summary

Implements the complete DocPilot v2 backend and UI — Phases 2A through 8B of the
[full implementation plan](DOCPILOT_FULL_IMPLEMENTATION.md). This PR graduates the
product from a prototype (mock data, legacy `kv_store`-only persistence, no auth
granularity) to a production-ready multi-tenant documentation platform.

**Scope at a glance:** 33 files changed, 4,953 insertions(+), 190 deletions(−),
22 new files, 14 commits.

---

### Group 1 — Database schema (`server/schema.sql`)

Adds 6 new tables required by features below. All additions are idempotent
(`CREATE TABLE IF NOT EXISTS` / `ensureColumn` guards) so existing databases
migrate automatically on server boot.

| New table | Purpose |
|---|---|
| `api_keys` | Company-scoped API keys; SHA-256 hash stored, raw token returned once |
| `webhook_endpoints` / `webhook_deliveries` | Per-company outbound webhooks with HMAC-SHA256 signing and delivery log |
| `search_documents` + `search_documents_fts` | FTS5 virtual table for full-text search with ranked snippets |
| `reader_feedback` | Per-document reader helpful/not-helpful ratings with optional comment |
| `analytics_events` | Event stream (page_view, search, doc_open, feedback_submitted) |
| `ai_tasks` | Audit trail for all AI operations (model, prompt excerpt, status, output ref) |

---

### Group 2 — API v2 expansion (`server/api-v2.mjs`)

Adds 50+ new routes. All routes validate session cookie **or** Bearer token (via
`loadAuthWithApiKey()`). All company-scoped routes enforce `user.company_id ===
:cid` before touching data.

| Route group | Routes added | Key behaviour |
|---|---|---|
| Research | 10 | Sources CRUD, job queue (fire-and-forget), drafts CRUD |
| API keys | 3 | Create (returns raw token once), list, revoke |
| Webhooks | 5 | Endpoint CRUD + manual test-fire |
| Localization ops | 5 | Locale health overview, translation queue, add-locale, bulk-assign reviewer, mark-ready |
| Analytics / feedback | 4 | Public event track, public feedback submit, reader dashboard, search analytics |
| AI assist | 5 | Task list, outline, rewrite, translate, release-notes suggest |
| Public export | 3 | Export product / document / release (published only; 60 s `Cache-Control`) |
| Search | 4 | Full-text search, autocomplete suggest, reindex document/product |

---

### Group 3 — Auth: Bearer token support

`loadAuthWithApiKey()` wraps the existing session-cookie auth. If no session is
found it checks `Authorization: Bearer <token>`, computes SHA-256, looks up
`api_keys` (non-revoked), and stamps `last_used_at`. API key users carry role
`['api-key']` and are scoped to the issuing company. Raw tokens and HMAC secrets
are never stored or returned after creation.

---

### Group 4 — Research pipeline

**Backend** (`server/research/{sources,jobs,drafts}.mjs`) — kv_store-backed data
layer. Jobs are created synchronously and processed asynchronously (fire-and-forget
pattern). Drafts support a `send_to_cms` transition that creates a real document
via the v2 content API.

**Frontend** (`src/multitenant/ResearchApp.tsx`) — `DraftReview` now calls real
API endpoints. `SendToCmsDialog` fetches the company's product list and POSTs with
`{ productId }`. Documents promoted from research show a **From Research** badge
(`src/App.tsx`).

---

### Group 5 — Content authoring UI

| Component | File | What it does |
|---|---|---|
| `SectionCommentPanel` | `src/multitenant/SectionCommentPanel.tsx` | Collapsible thread per section; blocking-flag comments gate workflow transitions; Cmd+Enter submit; live badge count |
| `TenantContext` | `src/multitenant/TenantContext.tsx` | Thin React context propagating `companyId`/`userId` from `CompanyCMSShell` to deep descendants without prop-drilling |
| `WorkflowControls` + `WorkflowHistory` | `src/multitenant/WorkflowControls.tsx` | Per-entity transition buttons derived from server-side transition matrix; confirmation dialog surfaces 422 blocking issues; collapsible audit timeline |
| `TranslationManager` | `src/multitenant/TranslationManager.tsx` | Locale list with progress bars + 90 % threshold banner; side-by-side string editor; Add Language dialog with datalist autocomplete |
| `ProductMembersPanel` | `src/multitenant/ProductMembersPanel.tsx` | Product-scoped role delegation (independent of tenant-wide roles); inline role edit; remove with confirmation |
| `ReleasePanel` | `src/multitenant/ReleasePanel.tsx` | Horizontal status stepper; 6-item readiness checklist driven by `GET /releases/:rid/readiness`; rollback button with confirmation |

---

### Group 6 — Reader experience

- `src/reader/reader.css` — adds `color-scheme: dark` + `--ds-*` token aliases
  for the dark theme so it participates in the design token system.
- `src/reader/DocReader.tsx` — `ReaderControls` component renders locale and
  version `<select>` elements in the reader header when the model exposes multiple
  options; `ReaderFeedback` widget renders after the flow nav.
- `src/reader/ReaderFeedback.tsx` — three-state widget (idle → comment → done);
  POSTs to `/api/v2/public/reader/feedback`; also fires an analytics event.

---

### Group 7 — Full-text search (`server/search/`)

- `extract.mjs` — strips HTML tags, decodes entities, builds 180-char summary and
  120-char keyword-in-context snippet.
- `indexer.mjs` — upserts into `search_documents` + FTS5 virtual table; supports
  per-document and per-product reindex; removes stale index rows on delete.
- `query.mjs` — `MATCH` with `rank` ordering; returns items with pre-built
  snippet; separate `suggest()` for autocomplete prefix queries.

---

### Group 8 — Localization operations (`src/multitenant/LocalizationOps.tsx`)

`LocalizationOpsPage` shows locale-health cards (`avgCompletionPct`,
`slaStatus`, dirty/review counts) and a filterable translation-queue table. Fetches
from `/localization/overview` + `/localization/queue`. `computeTranslationState`
logic on the server mirrors the spec (compares source `updated_at` vs translation
`updated_at`).

---

### Group 9 — Integrations platform

| Module | File | Notes |
|---|---|---|
| Slack | `server/integrations/slack.mjs` | 7 event emitters fan-out through `deliverWebhooks()`; config from `kv_store` key `integration_slack_<cid>` |
| GitHub / Jira | `server/integrations/issues.mjs` | `createGitHubIssue` (GitHub REST v3) + `createJiraIssue` (Jira REST v3); `createIssueFromBlockingComment` high-level helper |
| Public export | `server/integrations/export-api.mjs` | `exportProduct` / `exportDocument` / `exportRelease` — published entities only; content serialised to JSON |
| Webhook delivery | `server/webhooks.mjs` | HMAC-SHA256 signed payload; 5 s `AbortSignal.timeout`; delivery log written win/loss; secret stripped from API responses |

---

### Group 10 — AI assist (`server/ai/`, `src/multitenant/AIAssistPanel.tsx`)

- `providers.mjs` — wraps Anthropic Messages API (`claude-haiku-4-5-20251001` by
  default, overridable via `DOCPILOT_AI_MODEL`). Returns stub text when
  `ANTHROPIC_API_KEY` is absent so the full task flow works in development.
- `prompts.mjs` — 5 prompt templates: summarize source, outline document,
  translate section (HTML-preserving), rewrite section, suggest release notes.
- `tasks.mjs` — each task follows create → complete/fail pattern and writes to
  `ai_tasks` for audit. Outputs capped to prevent oversized DB rows.
- `AIAssistPanel.tsx` — sidebar panel with rewrite/translate mode selector;
  renders suggestion inline with Dismiss / Apply-to-draft actions so nothing
  reaches the section without explicit human approval.

---

### Group 11 — Design system consolidation (`src/styles/primitives.css`, CSS files)

Adds 187 lines of new `.ds-*` component patterns: `ds-section-comment`,
`ds-readiness-item`, `ds-stepper`, `wf-controls`, `wf-timeline`, `sc-panel`,
`tlm-*`, `tse-*`, `pmp-*`, `rsp-stepper`. Removes remaining hardcoded hex/shadow
values from `multitenant.css` and `styles.css` in favour of `var(--ds-*)` tokens.
Drops the glow `box-shadow` from `.ds-btn-primary`.

---

### Group 12 — UI/UX & Navigation improvements

#### Navigation & information architecture

- **AI Research Center** added to the **Intelligence** section of the top-level
  navigation, making AI-powered research workflows discoverable from the main
  platform shell.
- Platform navigation hierarchy restructured: research, content authoring,
  localization, and reader tools are now grouped by workflow stage rather than
  by technical layer.

#### Workflow visibility

- Status steppers (`ReleasePanel`, `WorkflowHistory`) surface the full
  draft → review → approved → staged → published lifecycle at a glance, with
  per-step actor and timestamp.
- Readiness checklist (`ReleasePanel`) shows exactly which of the 6 release
  gates are blocking — sections approved, translation threshold, release notes,
  snapshot, unsafe HTML, reviewer assigned — with inline fix guidance.
- Translation progress bars in `TranslationManager` use danger/warning/success
  colouring tied to the 90 % release threshold, so editors know at a glance
  which locales will block a release.

#### Contextual feedback & validation

- Blocking comments in `SectionCommentPanel` are visually distinguished
  (amber left-border) and surface as named issues in the `WorkflowControls`
  confirmation dialog, so reviewers understand exactly what prevents a transition.
- `AIAssistPanel` holds AI suggestions in an inline preview state — nothing
  reaches the section body without an explicit **Apply to draft** click.
- `ReaderFeedback` widget gives readers a frictionless helpful / not-helpful
  signal with an optional comment, reaching a done state in two clicks.

#### Interface consistency

- Continued `--ds-*` token migration across `multitenant.css` and `styles.css`;
  removes the last hardcoded hex colours, raw `rgba()` shadows, and inline
  `font-family` stacks from the CMS shell.
- Drops the glow `box-shadow` from `.ds-btn-primary` for a flatter, more
  consistent button hierarchy.
- 187 lines of new `.ds-*` component patterns in `primitives.css` unify
  comment panels, readiness items, steppers, workflow controls, and translation
  grids across every new module.

#### Dark mode & multi-language reader

- `reader.css` gains `color-scheme: dark` and `--ds-*` aliases for all reader
  surface tokens, eliminating unthemed white patches in dark mode.
- `ReaderControls` renders locale and version selects in the reader header
  only when multiple options are available, keeping the interface clean for
  single-locale docs while surfacing the controls exactly when needed.

---

---

## Test plan

### Server / API

- [ ] `npm run typecheck` — zero errors
- [ ] Start dev servers (`npm run dev`); DevTools Console shows no errors on load
- [ ] `POST /api/v2/companies/:cid/research/sources` → 201; verify row appears in `/research/sources` GET
- [ ] Create an API key (`POST /api/v2/companies/:cid/api-keys`); copy the raw token; make a `Bearer` authenticated request to any company route → 200
- [ ] Revoke the key; repeat the Bearer request → 401
- [ ] `POST /api/v2/companies/:cid/webhooks` with a test URL; fire a test event; check `webhook_deliveries` for a `delivered` row
- [ ] `GET /api/v2/companies/:cid/search?q=<keyword>` after reindexing a document → returns results with snippet
- [ ] `GET /api/v2/public/export/products/:pid` with no auth → 200 (published product) or 404 (draft); verify `Cache-Control: public, max-age=60` header
- [ ] `POST /api/v2/companies/:cid/ai/sections/:sid/rewrite` without `ANTHROPIC_API_KEY` set → returns stub text, not a 5xx

### Content authoring UI

- [ ] Open a document in the CMS; click a section's comment toggle; post a blocking comment → badge counter increments
- [ ] Try to advance the section to `approved` via `WorkflowControls` while the blocking comment is unresolved → 422 with blocking-issues list shown in dialog
- [ ] Resolve the comment → transition succeeds
- [ ] Open `TranslationManager`; add a locale; edit a string and save → string state changes from `dirty` to `saved`
- [ ] Drop a locale below 90 % completion → threshold warning banner visible
- [ ] Open `ProductMembersPanel`; add a user with `reviewer` role; remove them
- [ ] Open `ReleasePanel` for an incomplete release → readiness checklist shows failing items; fix them → `overallReady: true`; publish → stepper advances to `published`

### Reader experience

- [ ] Open a public reader URL; toggle dark mode → page uses `color-scheme: dark` with no unthemed elements
- [ ] Reader model with `availableLocales` length > 1 → `ReaderControls` locale selector visible in header
- [ ] Submit helpful/unhelpful feedback → thank-you state shown; row in `reader_feedback`; `reader.feedback_submitted` row in `analytics_events`

### Research pipeline

- [ ] Add a source in Research Center; start an analysis job → job status transitions to `processing` then `done`
- [ ] Promote a draft to CMS via `Send to CMS`; select a product → new document appears in CMS with **From Research** badge

### AI assist

- [ ] Open `AIAssistPanel` on a section; select **Rewrite** → suggestion rendered inline; click **Apply to draft** → `onApply` callback fires with HTML
- [ ] Select **Translate**; leave target locale blank → inline validation error, no network request

### Localization ops

- [ ] `GET /api/v2/companies/:cid/localization/overview` → cards show per-locale `avgCompletionPct` and `slaStatus`
- [ ] Filter queue by locale + state → table updates

---

## Screenshots / video

The following areas have visible UI changes and should be reviewed before merge:

| Area | What to capture |
|---|---|
| Section comment panel | Collapsed vs expanded; blocking comment highlighted state; resolved (strikethrough) state |
| Workflow controls | Transition buttons for each entity status; confirmation dialog with blocking issues list |
| Translation manager | Locale health progress bars; 90 % threshold warning banner; side-by-side string editor |
| Release panel | Horizontal status stepper at each stage; readiness checklist failing vs passing |
| Product members panel | Table with role badge; Add Member dialog |
| Reader — dark mode | Reader with `color-scheme: dark` active (no unthemed white patches) |
| Reader controls | Locale/version selects in reader header |
| Reader feedback widget | Idle → comment → done states |
| AI assist panel | Rewrite mode; translate mode; inline suggestion with Apply/Dismiss |
| Research — From Research badge | Document card with blue "From Research" badge |

---

## Risk

**Medium** — this PR touches the auth layer (Bearer token path in
`loadAuthWithApiKey`), the database schema (6 new tables auto-migrated on boot),
and 50+ new API routes. The existing session-cookie path is unchanged and all
new tables use `IF NOT EXISTS` guards. The highest-risk area is the schema
migration on an existing production database; recommend a DB backup before
deploying.

Individual risk notes:

- **API keys / webhook secrets** — raw token / HMAC secret never persisted; returned
  once on creation only. Verify no logging middleware accidentally captures request
  bodies containing these values.
- **AI provider fallback** — `providers.mjs` silently returns stub text when
  `ANTHROPIC_API_KEY` is absent. Ensure the env var is set in production before
  enabling AI routes.
- **Public export cache** — `Cache-Control: public, max-age=60` is set on export
  routes. If a document is unpublished, the stale cached response could serve
  content for up to 60 s. Acceptable for the current use case; add `Vary` or
  reduce TTL if stricter invalidation is needed.
- **FTS5 reindex** — bulk `reindexProduct` is synchronous. For products with many
  documents this could block the event loop momentarily; acceptable at current
  scale, but should move to a background job if document counts grow large.

---

## Checklist

- [x] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] No new console errors / warnings in browser DevTools
- [ ] `ANTHROPIC_API_KEY` documented in `.env.example` (if not already)
- [ ] Touches platform code only? (No changes to `content/`, `src/data/manualContent.ts`, `server/seed-state.json`, or `public/images/{minescape,backoffice,manual}/`)
- [ ] DB backup taken before deploying to an existing production database
- [ ] API key and webhook secret creation tested end-to-end in staging
- [ ] AI provider stub behaviour confirmed when `ANTHROPIC_API_KEY` is absent
