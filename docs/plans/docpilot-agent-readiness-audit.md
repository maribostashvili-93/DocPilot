# DocPilot Agent Readiness Audit

Date: 2026-05-23
Product: `prod-1776919051784` / `aviatordocs`
Feature: `docpilot-cms-platform`
Active sprint: `avi-sprint-1` - AviatorDocs End-to-End Cook 1
Parent intake: `bat-1054`

## Gate Result

Ready to start.

BatCave project guardrails passed before sprint movement:

- `project.id`: `prod-1776919051784`
- `project.slug`: `aviatordocs`
- `worktree_root`: `/Users/nukritusishvili/Desktop/Claude Projects/AviatorDocs`
- Active sprint: `avi-sprint-1`

## Artifact Audit

Required repo artifacts exist and were checked:

- `docs/plans/docpilot-ux-system-audit/01-action-map.md`
- `docs/plans/docpilot-ux-system-audit/02-ui-element-inventory.md`
- `docs/plans/docpilot-ux-system-audit/03-ux-pattern-inventory.md`
- `docs/plans/docpilot-ux-system-audit/04-scored-matrix.md`
- `docs/plans/docpilot-ux-system-audit/05-issue-to-fix-table.md`
- `docs/plans/docpilot-pm-discovery-outcome.md`
- `docs/plans/docpilot-pm-backlog-traceability.md`
- `docs/plans/docpilot-pm-handoff-to-ba.md`

Artifact line-count check: 575 total lines across the audit, discovery, traceability, and handoff docs.

## Sprint Movement

Moved the full DocPilot ticket set under `docpilot-cms-platform` into `avi-sprint-1` with `status=todo`.

Current DocPilot sprint status:

| Type | Count | Status | Sprint |
| --- | ---: | --- | --- |
| Epic | 7 | `todo` | `avi-sprint-1` |
| User story | 23 | `todo` | `avi-sprint-1` |
| Task | 22 | `todo` | `avi-sprint-1` |

## Agent-Startable Units

BatCave agents can start executable ticket types only: `task`, `sub_task`, and `bug`. The PM backlog used `epic` and `user_story`, so executable child tasks were created for the 22 milestone stories.

| Parent story | Agent task | Title |
| --- | --- | --- |
| `bat-1062` | `bat-1084` | AGENT: M1-01: Persist DocPilot CMS entities server-side |
| `bat-1063` | `bat-1085` | AGENT: M1-02: Establish real auth and action-level RBAC baseline |
| `bat-1064` | `bat-1086` | AGENT: M1-03: Define immutable revision and publish snapshot model |
| `bat-1065` | `bat-1087` | AGENT: M1-04: Normalize product/document context across admin |
| `bat-1066` | `bat-1088` | AGENT: M1-05: Refactor marker editor into basic and advanced inspector tiers |
| `bat-1067` | `bat-1089` | AGENT: M1-06: Add accessible marker and section manipulation alternatives |
| `bat-1068` | `bat-1090` | AGENT: M1-07: Add schema validation and safe advanced editing guardrails |
| `bat-1069` | `bat-1091` | AGENT: M2-01: Create document templates with audience, slug, and nav placement |
| `bat-1070` | `bat-1092` | AGENT: M2-02: Strengthen reusable block and component authoring |
| `bat-1071` | `bat-1093` | AGENT: M2-03: Build media library for image upload, tagging, and reuse |
| `bat-1072` | `bat-1094` | AGENT: M2-04: Add navigation manager, taxonomy, and search expansion |
| `bat-1073` | `bat-1095` | AGENT: M2-05: Add guided product onboarding and preview-state clarity |
| `bat-1074` | `bat-1096` | AGENT: M3-01: Add review workflow, comments, assignments, and queues |
| `bat-1075` | `bat-1097` | AGENT: M3-02: Add durable audit trail for content and release actions |
| `bat-1076` | `bat-1098` | AGENT: M3-03: Add managed localization workflow |
| `bat-1077` | `bat-1099` | AGENT: M3-04: Add staged publish environments and rollback controls |
| `bat-1078` | `bat-1100` | AGENT: M3-05: Expand permission matrix across all CMS actions |
| `bat-1079` | `bat-1101` | AGENT: M4-01: Add design tokens, style presets, and theme controls |
| `bat-1080` | `bat-1102` | AGENT: M4-02: Add templates for reusable content families |
| `bat-1081` | `bat-1103` | AGENT: M4-03: Add webhooks, API keys, and external reference integrations |
| `bat-1082` | `bat-1104` | AGENT: M4-04: Add analytics and instrumentation hooks |
| `bat-1083` | `bat-1105` | AGENT: M4-05: Add scale controls for large operational tables |

## BatCave Evidence

Readiness comment and evidence were attached to `bat-1054`:

- `c-1777034306674`: readiness note
- `c-1777034306675`: agent-readiness evidence

## Start Guidance

Recommended execution order is M1 first: `bat-1084` through `bat-1090`.

Agents may then continue through M2, M3, and M4 only after preserving the parent story trace and attaching implementation evidence to the active `AGENT:` task. Parent epics and user stories should remain the planning and acceptance containers.
