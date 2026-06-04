# DocPilot PM Handoff To BA

Date: 2026-05-23
Feature: `docpilot-cms-platform`
Parent intake: `bat-1054`
Handoff status: Ready for BA decomposition and agent task start

BA flow update: M1 BA decomposition has started and the first BA package is available under `docs/plans/docpilot-ba-flow/`.

PM review update: M1 BA package is approved in `docs/plans/docpilot-ba-flow/03-pm-review-m1-ba.md`. Dev is unlocked for M1 execution in the recommended order.

## Handoff Summary

PM planning is complete for the DocPilot CMS platform backlog. The work followed the required audit-first protocol:

1. BatCave project guardrails passed.
2. Phase 1 UX audit was completed and documented.
3. Phase 2 PM discovery was completed from `bat-1054`, the PO plan, and audit findings.
4. Phase 3 PM backlog was created in BatCave for DocPilot only under feature `docpilot-cms-platform`.

BA should now use the PM-level epics and stories as the business-rule source of truth. Agent execution can start from the sprinted `AGENT:` child tasks while preserving the parent story trace.

## Required Reading For BA

1. `docs/plans/docpilot-wordpress-parity-po-plan.md`
2. `docs/plans/docpilot-pm-discovery-outcome.md`
3. `docs/plans/docpilot-pm-backlog-traceability.md`
4. `docs/plans/docpilot-ux-system-audit/01-action-map.md`
5. `docs/plans/docpilot-ux-system-audit/02-ui-element-inventory.md`
6. `docs/plans/docpilot-ux-system-audit/03-ux-pattern-inventory.md`
7. `docs/plans/docpilot-ux-system-audit/04-scored-matrix.md`
8. `docs/plans/docpilot-ux-system-audit/05-issue-to-fix-table.md`

## BatCave Ticket Scope

Epics:

- `bat-1055` - EPIC 1: Authoring Core
- `bat-1056` - EPIC 2: Workflow + Governance
- `bat-1057` - EPIC 3: Information Architecture + Discovery
- `bat-1058` - EPIC 4: Themes + Templates
- `bat-1059` - EPIC 5: Integrations + Extensibility
- `bat-1060` - EPIC 6: Localization + Release Ops
- `bat-1061` - EPIC 7: Marker/Annotation UX Refactor

Stories:

- M1 foundation: `bat-1062` through `bat-1068`
- M2 authoring/IA/media: `bat-1069` through `bat-1073`
- M3 governance/localization/release ops: `bat-1074` through `bat-1078`
- M4 scale/theme/integrations: `bat-1079` through `bat-1083`

Agent-startable tasks:

- M1 foundation: `bat-1084` through `bat-1090`
- M2 authoring/IA/media: `bat-1091` through `bat-1095`
- M3 governance/localization/release ops: `bat-1096` through `bat-1100`
- M4 scale/theme/integrations: `bat-1101` through `bat-1105`

## BA Decomposition Priorities

1. Start with M1 only: `bat-1062` to `bat-1068`.
2. Decompose persistence, auth/RBAC, publish snapshots, product/document context, marker UX, accessibility, and validation before M2 authoring expansion.
3. For each story, preserve the `UX-*` and `DSC-*` trace in BA artifacts.
4. Convert PM acceptance criteria into business rules, edge cases, and testable BA acceptance criteria.
5. Identify open questions that require PM/PO decision before implementation.

## BA Flow Artifacts

M1 BA flow artifacts:

1. `docs/plans/docpilot-ba-flow/00-ba-flow-start.md`
2. `docs/plans/docpilot-ba-flow/01-m1-ba-decomposition.md`
3. `docs/plans/docpilot-ba-flow/02-m1-agent-handoff.md`
4. `docs/plans/docpilot-ba-flow/03-pm-review-m1-ba.md`

BA decision: M1 is decomposed enough for agent execution of `bat-1084` through `bat-1090`.
PM decision: M1 BA package is approved and build-unlocked.

## BA Constraints

1. Do not create non-DocPilot or BatCave-internal work from these tickets.
2. Do not broaden M1 into theme marketplace, billing, AI, or arbitrary plugin scope.
3. Every BA artifact must reference the source ticket ID and at least one trace source.
4. Agent work must attach evidence to the `AGENT:` task and preserve the parent story ID in the handoff.
5. If BA finds a missing business rule, capture it on the parent story before expanding implementation scope.

## Quality Gates BA Should Add

1. Accessibility: keyboard access for marker manipulation, section reorder, inline editing, modals, and dense icon actions.
2. Security: RBAC enforcement for backend and UI, API key handling, publish permission checks, and audit event integrity.
3. Data integrity: local-storage migration, snapshot immutability, rollback safety, translation key regeneration, and validation rules.
4. UX: global context clarity, dirty-state protection, visible publish/preview state, and simplified marker control hierarchy.
5. QA: regression coverage for reader routes, admin routes, authoring flows, publish workflow, localization workflow, and marker editor.

## PM Acceptance For BA Intake

BA intake is acceptable when:

1. Every M1 ticket has a BA decomposition artifact or named open questions.
2. All P0/P1 UX findings from Phase 1 are either covered by M1/M2 stories or explicitly deferred with rationale.
3. Permission, persistence, publishing, and revision requirements are represented as business rules, not only UI tasks.
4. The BA package keeps parent stories traceable while implementation proceeds through the `AGENT:` child tasks.
