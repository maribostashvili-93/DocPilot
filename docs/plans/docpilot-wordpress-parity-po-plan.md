# DocPilot PO Plan: WordPress-Level CMS Client Area

Last updated: 2026-05-23  
Batcave intake: `bat-1054`

## Product Goal
Turn DocPilot into an all-in-one CMS client area for software product clients: authoring, approvals, publishing, localization, integrations, and analytics in one workspace.

## Target Users
1. Product Admin: configures structure, roles, releases, and integrations.
2. Content Editor: writes and updates docs/pages with reusable components.
3. Reviewer/QA: validates content quality and readiness before publish.
4. Client Viewer: consumes published docs with search and clear navigation.

## North-Star Outcomes
1. Teams can ship documentation updates without engineering intervention.
2. Enterprise clients can enforce workflow and audit controls.
3. Content operations scale across products, versions, and locales.

## Scope Boundaries (V1)
In scope:
1. CMS authoring parity features (core set, not full plugin marketplace).
2. Role-based workflows and staged publishing.
3. Localization and revision management.
4. Better UX for screenshot/marker editing.

Out of scope (V1):
1. Third-party plugin marketplace with arbitrary code install.
2. Headless multi-channel delivery beyond web docs.
3. Billing/subscription management.

## Epic Map
## EPIC 1 — Authoring Core (WordPress-like editing experience)
1. Page/section builder with reusable blocks/components.
2. Media library with tagging and reuse.
3. Drafts, scheduled publish, revision history, rollback.

## EPIC 2 — Workflow + Governance
1. Roles/permissions: admin, editor, reviewer, viewer.
2. Review/approval states and assignment.
3. Full audit trail on content and release actions.

## EPIC 3 — Information Architecture + Discovery
1. Navigation/menu manager and ordering controls.
2. Taxonomy (categories/tags) and content grouping.
3. Search improvements (title, body, metadata, filters).

## EPIC 4 — Themes + Templates
1. Global design tokens and style presets.
2. Template controls for content families.
3. Consistent reader + editor visual language.

## EPIC 5 — Integrations + Extensibility
1. Webhooks for publish/update lifecycle.
2. External links/reference integrations.
3. Analytics/instrumentation hooks.

## EPIC 6 — Localization + Release Ops
1. Translation workflow by locale with status tracking.
2. Environment-aware publish (draft/staging/prod).
3. Release snapshots and rollback safety.

## EPIC 7 — Marker/Annotation UX Refactor
1. Compact “Figma-style” controllers.
2. Clear basic vs advanced style controls.
3. Smooth, predictable drag/resize/rotate behavior.

## Milestone Plan
## M1 (Foundation)
EPIC 7 + critical workflow plumbing from EPIC 2/6.  
Outcome: strong editing UX and reliable save/publish foundations.

## M2 (Authoring + IA)
EPIC 1 + EPIC 3 core path.  
Outcome: editors can create and organize content end-to-end.

## M3 (Governance + Localization)
EPIC 2 + EPIC 6 completion.  
Outcome: enterprise-ready controls for review and release.

## M4 (Scale + Extensibility)
EPIC 4 + EPIC 5.  
Outcome: configurable, brandable, integration-ready platform.

## Acceptance Criteria (Program Level)
1. Authoring throughput: create/edit/review/publish flow can be completed by non-engineering users.
2. Governance: every publish action is attributable and reversible.
3. Discoverability: users can find target content via navigation + search in <= 3 interactions.
4. Localization: each locale has explicit workflow state and release visibility.
5. UX quality: marker editor default flow shows only essential controls and no style cross-coupling.

## Initial Ticket Decomposition (PO Backlog Seed)
1. Program setup:
   - `EPIC` ticket per epic above.
   - `MILESTONE` ticket per M1-M4.
2. M1 sprint-ready candidates:
   - Marker controller IA + compact component system.
   - Marker interaction reliability polish (drag/resize/rotate).
   - Save/publish guardrails + revision integrity checks.
   - Workflow state model normalization.
3. Cross-cutting:
   - QA strategy + regression checklist.
   - Security review checkpoints on role/publish/integration paths.

## Delivery Protocol
1. PO/BA finalizes epic definitions and success metrics.
2. Dev executes ticket batches with evidence on each ticket.
3. QA and Security gates run before milestone close.
4. DM signs off milestone health before moving to next milestone.
