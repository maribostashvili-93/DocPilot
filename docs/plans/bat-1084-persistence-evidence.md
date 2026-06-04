# bat-1084 Persistence Evidence

Date: 2026-05-24
Task: `bat-1084` - AGENT: M1-01: Persist DocPilot CMS entities server-side
Parent story: `bat-1062` - US M1-01: Persist DocPilot CMS entities server-side

## BA Contract Covered

Source: `docs/plans/docpilot-ba-flow/01-m1-ba-decomposition.md`

- Products, documents, sections, translations, releases, users/role metadata, media metadata, and revision metadata must persist outside browser storage.
- Saved mutations must record actor, timestamp, target entity, operation, and revision references where applicable.
- Browser local-storage content is importable prototype data, not the source of truth after migration.
- Server unavailability must block editing instead of claiming a durable save.

## Implementation

- Added `server/docpilot-server.mjs`, a local JSON-backed persistence API.
- Added API endpoints:
  - `GET /api/docpilot/health`
  - `GET /api/docpilot/state/:key`
  - `PUT /api/docpilot/state/:key`
  - `POST /api/docpilot/import-local`
- Added mutation logging to `.docpilot-data/mutations.jsonl`.
- Added server state storage in `.docpilot-data/cms-state.json`.
- Updated the CMS state helper to hydrate from the server first, import local prototype data only when no server value exists, and send writes through the API.
- Added an admin persistence gate that blocks editing when the server API is unavailable.
- Added Vite proxy and `npm run dev:full` / `npm run dev:server` scripts.

## Verification

Commands run:

```bash
node --check server/docpilot-server.mjs
npm run build
node server/docpilot-server.mjs
curl -sS http://127.0.0.1:4179/api/docpilot/health
curl -sS -X PUT http://127.0.0.1:4179/api/docpilot/state/smoke_test -H 'content-type: application/json' --data '{"value":{"ok":true},"operation":"smoke_test","actor":"codex"}'
```

Results:

- Node syntax check passed.
- TypeScript and Vite production build passed.
- Health endpoint returned `ok: true`.
- Smoke mutation returned a server revision and previous revision metadata.
- Runtime smoke data was removed after verification because `.docpilot-data/` is an ignored runtime artifact.

## Residual Notes

- Demo login/users still use prototype browser storage until `bat-1085` implements real auth/RBAC.
- Publish snapshots and immutable revision semantics are still owned by `bat-1086`.
- This task establishes the durable entity/mutation substrate needed by those next stories.
