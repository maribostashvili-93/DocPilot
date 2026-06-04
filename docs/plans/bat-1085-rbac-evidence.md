# bat-1085 RBAC Evidence

Date: 2026-05-24
Task: `bat-1085` - AGENT: M1-02: Establish real auth and action-level RBAC baseline
Parent story: `bat-1063` - US M1-02: Establish real auth and action-level RBAC baseline

## BA Contract Covered

Source: `docs/plans/docpilot-ba-flow/01-m1-ba-decomposition.md`

- Roles include admin, editor, reviewer, viewer, partner, TAM, and developer.
- Permissions are action-level, not only route-level.
- UI hiding is not sufficient; server/API mutations must reject unauthorized requests.
- Denied actions must explain which permission is required.

## Implementation

- Added write permission mapping for:
  - `content:write`
  - `translations:write`
  - `releases:write`
  - `users:manage`
  - `settings:write`
- Added server-side permission enforcement to `server/docpilot-server.mjs`.
- Added `x-docpilot-role` and `x-docpilot-user` mutation headers from the active session actor.
- Expanded CMS roles to `admin`, `editor`, `reviewer`, `viewer`, `partner`, `tam`, and `developer`.
- Added client-side action-gate checks before admin mutation pages render.
- Added direct auth/user mutation guards so user management requires `users:manage`.
- Kept server rejection as the authoritative control even when UI is bypassed.

## Verification

Commands run:

```bash
node --check server/docpilot-server.mjs
npm run build
npm run lint
node server/docpilot-server.mjs
curl -sS -i -X PUT http://127.0.0.1:4179/api/docpilot/state/cms_docs_v2 -H 'content-type: application/json' -H 'x-docpilot-role: viewer' --data '{"value":[],"operation":"rbac_denied_smoke","actor":"viewer-smoke"}'
curl -sS -i -X PUT http://127.0.0.1:4179/api/docpilot/state/cms_docs_v2 -H 'content-type: application/json' -H 'x-docpilot-role: editor' --data '{"value":[],"operation":"rbac_allowed_smoke","actor":"editor-smoke"}'
curl -sS -i -X PUT http://127.0.0.1:4179/api/docpilot/state/users_v1 -H 'content-type: application/json' -H 'x-docpilot-role: editor' --data '{"value":[],"operation":"rbac_users_denied_smoke","actor":"editor-smoke"}'
```

Results:

- Syntax check passed.
- TypeScript/Vite build passed.
- ESLint passed.
- Viewer write to documents returned `403` with `content:write`.
- Editor write to documents returned `200`.
- Editor write to users returned `403` with `users:manage`.
- Runtime smoke data was removed after verification because `.docpilot-data/` is an ignored runtime artifact.

## Residual Notes

- Password handling remains prototype-grade and should be replaced by real identity/session infrastructure outside this milestone slice.
- Reviewer self-approval rules need the publish/review workflow from later stories to become enforceable.
- This task establishes the baseline action-level control model needed by persistence, revisions, and publishing.
