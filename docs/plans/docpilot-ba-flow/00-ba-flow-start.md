# DocPilot BA Flow Start

Date: 2026-05-23
Product: `prod-1776919051784` / `aviatordocs`
Feature: `docpilot-cms-platform`
Sprint: `avi-sprint-1`
Parent intake: `bat-1054`

## Start Decision

BA flow is started for M1.

The PM handoff is accepted as complete enough for BA decomposition because:

1. BatCave project guardrails pass for `prod-1776919051784` and worktree `/Users/nukritusishvili/Desktop/Claude Projects/AviatorDocs`.
2. UX audit artifacts exist and cover actions, elements, patterns, score matrix, and issue-to-fix table.
3. PM discovery and backlog traceability artifacts exist.
4. All DocPilot `docpilot-cms-platform` tickets are in `avi-sprint-1` with `status=todo`.
5. M1 has parent stories `bat-1062` through `bat-1068` and executable agent tasks `bat-1084` through `bat-1090`.

## BA Scope For This Pass

This BA pass covers M1 only:

| Story | Agent task | BA focus |
| --- | --- | --- |
| `bat-1062` | `bat-1084` | Persistence, entity model, migration, mutation audit |
| `bat-1063` | `bat-1085` | Auth, roles, action-level permissions |
| `bat-1064` | `bat-1086` | Immutable revision and publish snapshot model |
| `bat-1065` | `bat-1087` | Product/document context and dirty-switch behavior |
| `bat-1066` | `bat-1088` | Marker editor basic/advanced tiers |
| `bat-1067` | `bat-1089` | Accessible marker and section manipulation |
| `bat-1068` | `bat-1090` | Schema validation and safe advanced editing |

M2-M4 remain available in the sprint but should not be implemented ahead of unresolved M1 dependencies.

## BA Outputs Created

1. `docs/plans/docpilot-ba-flow/00-ba-flow-start.md`
2. `docs/plans/docpilot-ba-flow/01-m1-ba-decomposition.md`
3. `docs/plans/docpilot-ba-flow/02-m1-agent-handoff.md`

## Dependency Order

Recommended M1 execution order:

1. `bat-1084` persistence foundation.
2. `bat-1085` auth/RBAC baseline.
3. `bat-1086` revision and publish snapshot model.
4. `bat-1087` product/document context.
5. `bat-1090` schema validation and safe editing guardrails.
6. `bat-1088` marker editor tiering.
7. `bat-1089` accessible manipulation alternatives.

Marker tiering and accessibility can be designed in parallel, but implementation should share the same marker model and focus behavior.

## Non-Blocking Assumptions

1. DocPilot is the platform identity; Aviator remains sample product content.
2. M1 persistence can start with an internal service or local backend as long as the data contracts, mutation audit, and migration rules are explicit.
3. Auth/RBAC must define server-side rejection behavior even if the first implementation uses a simplified auth provider.
4. Publish snapshots must store immutable content state, not only metadata.
5. Advanced HTML editing is allowed only as a gated expert path with validation and sanitized preview.

No blocking PM/PO questions are raised by this BA start package.

