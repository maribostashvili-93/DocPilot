# DocPilot M1 Agent Handoff

Date: 2026-05-23
Feature: `docpilot-cms-platform`
Sprint: `avi-sprint-1`

## Handoff Status

M1 agent work is ready to start from the BA package.

Agents should work from the executable tasks and keep parent story trace intact:

- Parent stories: `bat-1062` through `bat-1068`
- Agent tasks: `bat-1084` through `bat-1090`
- BA decomposition: `docs/plans/docpilot-ba-flow/01-m1-ba-decomposition.md`

## Recommended Start Sequence

| Order | Agent task | Parent story | Why first |
| ---: | --- | --- | --- |
| 1 | `bat-1084` | `bat-1062` | Persistence is the foundation for durable auth, revisions, validation, and publish snapshots. |
| 2 | `bat-1085` | `bat-1063` | RBAC must guard all later mutation paths. |
| 3 | `bat-1086` | `bat-1064` | Publish snapshots need persistent entities and actor attribution. |
| 4 | `bat-1087` | `bat-1065` | Context clarity reduces wrong-scope edits before broader authoring work. |
| 5 | `bat-1090` | `bat-1068` | Validation becomes the shared safety layer for save and publish readiness. |
| 6 | `bat-1088` | `bat-1066` | Marker editor refactor should use validated marker targets and presets. |
| 7 | `bat-1089` | `bat-1067` | Accessibility alternatives should use the unified marker/section manipulation model. |

## Agent Evidence Requirements

For each M1 task, implementation evidence must include:

1. Source parent story ID.
2. Relevant BA section from `01-m1-ba-decomposition.md`.
3. Commands run or explicit reason a command could not be run.
4. Screenshots or route smoke evidence for UI-facing changes when applicable.
5. Security/accessibility notes for RBAC, publish, validation, marker, and keyboard behavior.

## Task-Specific Ready Notes

### `bat-1084` Persistence

Use BA entities and mutation metadata as the minimum contract. Do not treat local storage as durable after the server-backed path exists.

### `bat-1085` Auth/RBAC

Implement or define backend rejection behavior for restricted actions. UI-only hiding is not acceptable.

### `bat-1086` Revision/Publish Snapshot

Snapshots must be immutable and should not be represented as metadata-only releases.

### `bat-1087` Context

Normalize DocPilot/Aviator terminology and add dirty-switch protection wherever context can change.

### `bat-1090` Validation

Validation must separate draft warnings from publish blockers and must preserve imported invalid content for correction.

### `bat-1088` Marker Inspector

Default marker flow should expose basic fields only. Advanced styling/control density must be collapsed by default.

### `bat-1089` Accessibility

Keyboard and numeric alternatives are required for marker manipulation and section reorder. Pointer drag cannot be the only path.

## BA Handoff Decision

M1 is BA-started and agent-ready. M2-M4 should remain sequenced behind M1 foundation unless PM/BA explicitly reprioritizes.

