# Aviator Docs

React + TypeScript prototype for Aviator Studio documentation and operator tooling.

## Run

```bash
npm install
npm run dev:full
```

The app runs at `http://localhost:5173`. `dev:full` starts both Vite and the DocPilot persistence API.

For split terminals:

```bash
npm run dev:server
npm run dev
```

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
npm run smoke
```

`npm run smoke` starts the DocPilot persistence API and Vite app with an isolated `.docpilot-smoke-data` store, then runs the browser UAT path:

1. Reader routes: `/`, `/manual/overview`, `/games/aviator-crash`, `/docs/doc-integration`
2. Protected admin redirect: `/admin/dashboard` redirects to `/admin/login`
3. Prototype login: `admin` / `admin`
4. Core admin routes: `/admin/dashboard`, `/admin/documents`, `/admin/sections`, `/admin/translations`, `/admin/publishing`, `/admin/users`

The smoke records browser console warnings/errors. It fails on unexpected console errors or page errors.
Unexpected console warnings also fail the smoke. The only named warning allowlist is for React Router v7 future-flag upgrade messages (`v7_startTransition`, `v7_relativeSplatPath`); the app opts into those flags in `src/main.tsx`, so the expected clean result is zero repeated router warnings.

## Routes

- `/` — landing page
- `/manual/overview` — Aviator Game User Manual
- `/admin/login` — operator login
- `/admin/dashboard` — protected docs CMS dashboard
- `/admin/documents` — document library
- `/admin/sections` — manual section metadata workflow
- `/admin/translations` — 37-language documentation localization workspace
- `/admin/publishing` — publish snapshots

## Prototype Auth

Docs back-office credentials:

- Username: `admin`
- Password: `admin`

Auth is stored in `sessionStorage` for the prototype session. Editable CMS actions are guarded by action-level permissions in both the UI and the persistence API.

Baseline roles:

- `admin` — full CMS, publishing, settings, and user management.
- `editor` — content, translation, and release edits.
- `reviewer` — translation/review edits only.
- `viewer` — read-only.
- `partner`, `tam`, `developer` — transitional prototype roles mapped to scoped write permissions.

This is still prototype authentication and must not be used with production credentials.

Production-readiness boundary: [docs/plans/avi-3-production-readiness-boundary.md](docs/plans/avi-3-production-readiness-boundary.md) is the project-plan source of truth. It keeps DocPilot admin authoring local-prototype only until server-backed persistence, real auth/RBAC, durable audit, staged publishing, and the expanded permission matrix are completed or replaced by an explicit hosted CMS decision.

## Server-Backed CMS State

The docs CMS now persists editable entities through the DocPilot persistence API instead of treating browser storage as durable. Runtime state is stored in `.docpilot-data/cms-state.json` and mutation metadata is appended to `.docpilot-data/mutations.jsonl`; both are ignored git artifacts.

The persistence API records actor, timestamp, target key, operation, previous revision, and current revision for each saved mutation. If server persistence is unavailable, admin editing is blocked rather than claiming a local-only save.

The first run imports valid prototype browser data into the server store when a key is not already present. Malformed browser data is reported in `aviator_admin_migration_report_v1` and ignored.

Publishing creates immutable snapshot payloads for release records. A snapshot captures cloned document/section content, locale progress, marker targets, actor, readiness outcome, environment, and prior snapshot reference. Rollback is recorded as a new restorative snapshot rather than mutating historical release records.

Validation now separates draft warnings from publish blockers. Draft forms show errors/warnings for required metadata, semantic versions, duplicate labels/titles, slug format, and unsafe HTML patterns. Publish readiness additionally blocks broken marker targets and unsafe HTML while preserving source content for correction.

Marker editing defaults to a basic inspector with type, label/CTA, target, position, and approved presets. Freeform color, opacity, dialog, CTA, pointer, and custom preset controls are collapsed behind an advanced inspector.

Marker placement now has accessible alternatives to pointer dragging. Authors can use numeric X/Y/width/height fields, labeled nudge buttons, and the existing section move up/down controls to manipulate markers and sections without drag-drop.

Seeded CMS entities include:

- 2 document records
- 18 manual section workflow records
- 37 documentation translation workflow rows
- 1 publish snapshot

Browser storage remains a local cache using the `aviator_admin_` key prefix.

## Manual Assets

The Claude source manual embedded screenshots as base64 images. They have been extracted into `public/images/manual` as 26 figure files and are referenced by the manual route.
