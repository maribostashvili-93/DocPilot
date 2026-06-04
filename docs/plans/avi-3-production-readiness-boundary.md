# AviatorDocs Production-Readiness Boundary

Date: 2026-05-25
Ticket: `avi-3`
Scope: auth, persistence, and production-use decision for DocPilot/AviatorDocs.

## Decision

AviatorDocs remains a local DocPilot prototype until the production backend path is completed. It is suitable for local development, demos, and agent-driven product cooking, but it must not be treated as a production docs back office or shared operator CMS.

The selected production path is: server-backed CMS persistence plus real authentication/RBAC before any shared operator or client deployment. Static reader docs can be published independently, but admin authoring must stay behind the local prototype boundary until those controls are complete.

## Current Prototype Boundary

- Admin login uses prototype credentials: `admin` / `admin`.
- The browser session is stored in `sessionStorage`, not a production identity/session provider.
- Browser `localStorage` is a local cache and migration source, not the durable production source of truth.
- The DocPilot persistence API writes CMS state to local `.docpilot-data` files and is not a multi-user hosted backend.
- UI role checks and prototype API guards reduce accidental edits, but they are not a substitute for production authentication, managed secrets, server-side sessions, audit policy, or deployment hardening.

## Production Follow-Up Tickets

The production path is already represented in BatCave planning and sprint backlog:

- `bat-1062` / `bat-1084`: persist DocPilot CMS entities server-side, with local prototype data treated as importable migration input.
- `bat-1063` / `bat-1085`: establish real auth and action-level RBAC, including server/API rejection for unauthorized actions.
- `bat-1075` / `bat-1097`: add durable audit trail for content and release actions.
- `bat-1077` / `bat-1099`: add staged publish environments and rollback controls.
- `bat-1078` / `bat-1100`: expand the permission matrix across all CMS actions.

## Operational Rule

Before AviatorDocs/DocPilot is used by real operators, partners, or clients, the production follow-up tickets above must be completed or replaced by an explicit hosted CMS decision. Until then, admin authoring is local-prototype only.
