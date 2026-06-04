# AviatorDocs Sprint 1 Pre-Sprint Planning Review

Date: 2026-05-24
Product: `prod-1776919051784` / `aviatordocs`
Sprint: `avi-sprint-1` / `AviatorDocs End-to-End Cook 1`
Gate: Pre-sprint planning review
Verdict: `approved_for_sprint_planning`

## Scope Reviewed

This review applies the BatCave SDLC planning gate added on 2026-05-24. The gate checks the active sprint before implementation continues.

Sprint contents reviewed from BatCave SQLite:

| Type | Count |
| --- | ---: |
| Epics | 8 |
| User stories | 27 |
| Tasks | 22 |
| Bugs | 1 |

Primary evidence:

- `docs/plans/docpilot-agent-readiness-audit.md`
- `docs/plans/docpilot-ba-flow/01-m1-ba-decomposition.md`
- `docs/plans/docpilot-ba-flow/03-pm-review-m1-ba.md`
- `docs/plans/docpilot-pm-handoff-to-ba.md`
- `docs/plans/docpilot-pm-backlog-traceability.md`

## Planning Gate Decision

Approved with sequencing constraints.

M1 DocPilot execution is approved for the agent-startable task set:

1. `bat-1084` - Persist DocPilot CMS entities server-side.
2. `bat-1085` - Establish real auth and action-level RBAC baseline.
3. `bat-1086` - Define immutable revision and publish snapshot model.
4. `bat-1087` - Normalize product/document context across admin.
5. `bat-1090` - Add schema validation and safe advanced editing guardrails.
6. `bat-1088` - Refactor marker editor into basic and advanced inspector tiers.
7. `bat-1089` - Add accessible marker and section manipulation alternatives.

M2-M4 stories and child tasks remain planned and visible in the sprint, but implementation should not jump ahead of M1 foundation unless PM explicitly reprioritizes.

## Story Task Matrix

| Story | Priority | Work item state | Planning verdict |
| --- | --- | --- | --- |
| `avi-2` | must | `story_direct_implementation` | Approved. Small test/docs slice; no child task needed. |
| `avi-3` | should | `story_direct_implementation` | Approved. Planning/documentation boundary slice; no child task needed. |
| `avi-4` | could | 1 bug: `avi-6` | Approved. Work is represented by runtime warning bug. |
| `avi-5` | should | `story_direct_implementation` | Approved. Small config marker slice; no child task needed. |
| `bat-1054` | high | container epic/intake | Reclassified in BatCave as an epic/container, not an executable user story. |
| `bat-1062` | must | 1 task: `bat-1084` | Approved. |
| `bat-1063` | must | 1 task: `bat-1085` | Approved. |
| `bat-1064` | must | 1 task: `bat-1086` | Approved. |
| `bat-1065` | must | 1 task: `bat-1087` | Approved. |
| `bat-1066` | must | 1 task: `bat-1088` | Approved. |
| `bat-1067` | must | 1 task: `bat-1089` | Approved. |
| `bat-1068` | must | 1 task: `bat-1090` | Approved. |
| `bat-1069`..`bat-1083` | must/should/could | 1 task each: `bat-1091`..`bat-1105` | Planned. Do not implement ahead of M1 without PM reprioritization. |

## Direct-Implementation Rationales

### `avi-2`

Desired outcome: a repeatable browser smoke command exercises reader routes, admin redirect/login, and core admin pages, records console output, fails on unexpected runtime errors, and is documented in README.

Rationale: this is a contained QA/dev-tooling slice with clear ACs and no product ambiguity. The implementation can be done directly from the story.

Verification expectation:

- run the new smoke command,
- confirm unexpected console errors fail,
- confirm README lists exact route path.

### `avi-3`

Desired outcome: production-readiness boundary for auth and persistence is explicit in project planning docs and follow-up implementation tickets exist if the product moves beyond local prototype behavior.

Rationale: this is a planning/security-boundary documentation slice. Creating a separate implementation task would add tracking overhead without improving clarity.

Verification expectation:

- documented decision exists,
- local `admin/admin` and localStorage limitations are visible outside README prose,
- production-path follow-up work is represented if production is selected.

Decision recorded on 2026-05-25: AviatorDocs remains a local DocPilot prototype until the production backend path is completed. The project-plan source of truth is `docs/plans/avi-3-production-readiness-boundary.md`.

Production path: complete server-backed CMS persistence, real authentication/RBAC, durable audit trail, staged publishing/rollback, and expanded permission matrix before shared operator or client use. The follow-up implementation tickets are `bat-1062`/`bat-1084`, `bat-1063`/`bat-1085`, `bat-1075`/`bat-1097`, `bat-1077`/`bat-1099`, and `bat-1078`/`bat-1100`.

### `avi-5`

Desired outcome: `.batcave.json` exists at the AviatorDocs repo root and records project name, product id, worktree root, commands, and primary UAT routes so BatCave reports `hasConfig=true`.

Rationale: this is a small config-marker slice with direct ACs and no decomposition dependency.

Verification expectation:

- config file exists and is valid JSON,
- build/typecheck/lint/UAT commands are recorded,
- BatCave project refresh reports configuration presence.

## Dev Review

Dev review result: approved with M1 sequencing constraints.

Findings:

- M1 tasks are large but startable because each maps to one parent story and the BA package provides business rules, edge cases, data/permission concerns, and acceptance checks.
- The one-task-per-story structure is acceptable for M1 because the tasks are agent-startable units and parent stories remain the acceptance containers.
- M2-M4 tasks should not be executed before M1 persistence/auth/revision/context foundations unless PM reprioritizes.
- `avi-2`, `avi-3`, and `avi-5` are direct implementation stories; their direct rationales are now explicit in this artifact and BatCave comments.

No remaining Dev assumption blocks M1 start.

## Architecture Review

Architecture review result: approved with constraints.

Constraints:

- Persistence (`bat-1084`) should establish the source-of-truth pattern before auth/RBAC, revision snapshots, localization, publish, or integrations rely on durable entities.
- Auth/RBAC (`bat-1085`) must enforce permissions server-side/API-side; UI hiding cannot be treated as authorization.
- Revision/publish model (`bat-1086`) must be immutable-by-design and rollback must create a new action instead of mutating historical snapshots.
- Product/document context (`bat-1087`) should normalize platform identity before later templates/navigation/workflow work.
- Schema validation (`bat-1090`) should land before marker/editor expansion where possible.
- Marker refactor and accessibility work (`bat-1088`, `bat-1089`) can proceed after the data/context foundations are clear.

No unresolved architecture blocker prevents M1 start.

## PM/BA Clarification Closure

Closed:

- PM approval for M1 BA package exists in `docs/plans/docpilot-ba-flow/03-pm-review-m1-ba.md`.
- BA decomposition for M1 exists in `docs/plans/docpilot-ba-flow/01-m1-ba-decomposition.md`.
- One executable task per DocPilot story is explicitly accepted.
- The three AviatorDocs onboarding stories without child tasks now have direct-implementation rationale.
- `bat-1054` is treated as a DocPilot container epic/intake, not as a sprint-executable user story.

Open blockers: none for M1 start.

## Final Receipt

Receipt status: `approved_for_sprint_planning`

Next route:

1. Start Dev execution at `bat-1084`.
2. Attach implementation evidence to each `AGENT:` task.
3. Preserve parent story trace during implementation.
4. Do not jump to M2-M4 tasks before M1 unless PM records reprioritization.
