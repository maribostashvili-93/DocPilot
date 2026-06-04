# DocPilot PM Backlog Traceability Matrix

Date: 2026-05-23
Feature: `docpilot-cms-platform`
Product: DocPilot only
Phase: 3 - PM backlog generation plus agent-readiness addendum

## BatCave Context

Guardrail commands passed before backlog creation:

1. `batcave project discover`
2. `batcave project status`

Verified project:

- `project.id`: `prod-1776919051784`
- `project.slug`: `aviatordocs`
- `worktree_root`: `/Users/nukritusishvili/Desktop/Claude Projects/AviatorDocs`

Parent intake: `bat-1054` - DocPilot: WordPress-level CMS client area.

## Current Sprint Readiness

Updated after agent-readiness audit on 2026-05-23:

- Active sprint: `avi-sprint-1` - AviatorDocs End-to-End Cook 1.
- DocPilot sprinted records: 52 total.
- Sprint status by type: 7 epics, 23 user stories, and 22 executable tasks, all `todo`.
- Agent-startable DocPilot tasks: `bat-1084` through `bat-1105`.
- BatCave evidence on parent intake: `c-1777034306674` and `c-1777034306675`.

Epics and user stories remain planning/story containers. The `AGENT:` child tasks are the BatCave-startable execution units.

## Epic Tickets

| Ticket ID | Epic | PO plan alignment | Milestone | Priority | Trace |
| --- | --- | --- | --- | --- | --- |
| `bat-1055` | EPIC 1: Authoring Core | Authoring Core | M2 | must | `PO-EPIC-1`, `DSC-05` |
| `bat-1056` | EPIC 2: Workflow + Governance | Workflow + Governance | M1/M3 | must | `PO-EPIC-2`, `DSC-02`, `DSC-08` |
| `bat-1057` | EPIC 3: Information Architecture + Discovery | IA + Discovery | M2 | must | `PO-EPIC-3`, `DSC-04` |
| `bat-1058` | EPIC 4: Themes + Templates | Themes + Templates | M4 | could | `PO-EPIC-4`, `DSC-09` |
| `bat-1059` | EPIC 5: Integrations + Extensibility | Integrations + Extensibility | M4 | could | `PO-EPIC-5`, `DSC-10` |
| `bat-1060` | EPIC 6: Localization + Release Ops | Localization + Release Ops | M1/M3 | must | `PO-EPIC-6`, `DSC-03`, `DSC-07` |
| `bat-1061` | EPIC 7: Marker/Annotation UX Refactor | Marker/Annotation UX Refactor | M1 | must | `PO-EPIC-7`, `DSC-06` |

## Story Tickets

| Ticket ID | Parent Epic | Milestone | Priority | PM story | Trace | BA focus |
| --- | --- | --- | --- | --- | --- | --- |
| `bat-1062` | `bat-1055` | M1 | must | Persist DocPilot CMS entities server-side | `UX-02`, `UX-04`, `DSC-01` | Entity model, migration rules, audit metadata |
| `bat-1063` | `bat-1056` | M1 | must | Establish real auth and action-level RBAC baseline | `UX-03`, `UX-29`, `DSC-02` | Roles, permission matrix, denial behavior |
| `bat-1064` | `bat-1060` | M1 | must | Define immutable revision and publish snapshot model | `UX-01`, `UX-04`, `UX-19`, `DSC-03` | Snapshot contract, rollback, preview state |
| `bat-1065` | `bat-1057` | M1 | must | Normalize product/document context across admin | `UX-05`, `UX-14`, `UX-25`, `DSC-04` | Hierarchy naming, dirty-switch guard |
| `bat-1066` | `bat-1061` | M1 | must | Refactor marker editor into basic and advanced inspector tiers | `UX-09`, `UX-11`, `UX-13`, `UX-28`, `DSC-06` | Marker workflows, basic/advanced fields |
| `bat-1067` | `bat-1061` | M1 | must | Add accessible marker and section manipulation alternatives | `UX-09`, `UX-29`, `DSC-06` | Keyboard controls, focus, numeric positioning |
| `bat-1068` | `bat-1055` | M1 | must | Add schema validation and safe advanced editing guardrails | `UX-07`, `UX-12`, `UX-26`, `DSC-05` | Validation rules, unsafe HTML handling |
| `bat-1069` | `bat-1055` | M2 | must | Create document templates with audience, slug, and nav placement | `UX-06`, `UX-30`, `DSC-04`, `DSC-05` | Template model, audience/visibility, IA |
| `bat-1070` | `bat-1055` | M2 | must | Strengthen reusable block and component authoring | `UX-27`, `DSC-05` | Component rules, preview, undo behavior |
| `bat-1071` | `bat-1055` | M2 | must | Build media library for image upload, tagging, and reuse | `UX-10`, `DSC-06` | Asset model, usage refs, alt text |
| `bat-1072` | `bat-1057` | M2 | must | Add navigation manager, taxonomy, and search expansion | `UX-06`, `UX-18`, `DSC-04` | Menu/taxonomy/search rules |
| `bat-1073` | `bat-1057` | M2 | should | Add guided product onboarding and preview-state clarity | `UX-19`, `UX-30`, `DSC-04` | Onboarding flow, preview banners |
| `bat-1074` | `bat-1056` | M3 | must | Add review workflow, comments, assignments, and queues | `UX-03`, `UX-18`, `UX-22`, `DSC-08` | Workflow states, comments, queues |
| `bat-1075` | `bat-1056` | M3 | must | Add durable audit trail for content and release actions | `UX-01`, `UX-04`, `DSC-08` | Event taxonomy, evidence filters |
| `bat-1076` | `bat-1060` | M3 | must | Add managed localization workflow | `UX-16`, `UX-17`, `UX-24`, `DSC-07` | Locale ownership, review states, missing triage |
| `bat-1077` | `bat-1060` | M3 | must | Add staged publish environments and rollback controls | `UX-01`, `DSC-03` | Environment model, rollback rules |
| `bat-1078` | `bat-1056` | M3 | must | Expand permission matrix across all CMS actions | `UX-03`, `UX-29`, `DSC-02`, `DSC-08` | Action-level permission coverage |
| `bat-1079` | `bat-1058` | M4 | could | Add design tokens, style presets, and theme controls | `UX-11`, `UX-25`, `DSC-09` | Token model, preset governance |
| `bat-1080` | `bat-1058` | M4 | could | Add templates for reusable content families | `DSC-09`, `PO-EPIC-4` | Template inheritance and scope |
| `bat-1081` | `bat-1059` | M4 | could | Add webhooks, API keys, and external reference integrations | `DSC-10`, `PO-EPIC-5` | Integration security and lifecycle |
| `bat-1082` | `bat-1059` | M4 | could | Add analytics and instrumentation hooks | `DSC-10`, `PO-EPIC-5` | Privacy-safe event model |
| `bat-1083` | `bat-1057` | M4 | could | Add scale controls for large operational tables | `UX-23`, `DSC-04` | Sort/filter/saved view rules |

## Milestone Rollup

| Milestone | Tickets | Outcome |
| --- | --- | --- |
| M1 | `bat-1062`, `bat-1063`, `bat-1064`, `bat-1065`, `bat-1066`, `bat-1067`, `bat-1068` | Safe CMS foundation and critical marker UX safety. |
| M2 | `bat-1069`, `bat-1070`, `bat-1071`, `bat-1072`, `bat-1073` | Authoring, media, IA, discovery, and onboarding. |
| M3 | `bat-1074`, `bat-1075`, `bat-1076`, `bat-1077`, `bat-1078` | Governance, localization, audit, release operations. |
| M4 | `bat-1079`, `bat-1080`, `bat-1081`, `bat-1082`, `bat-1083` | Theme/template scale, integrations, analytics, table scale. |

## Agent Execution Task Mapping

| Story | Agent task | Milestone | Start status |
| --- | --- | --- | --- |
| `bat-1062` | `bat-1084` | M1 | `todo` in `avi-sprint-1` |
| `bat-1063` | `bat-1085` | M1 | `todo` in `avi-sprint-1` |
| `bat-1064` | `bat-1086` | M1 | `todo` in `avi-sprint-1` |
| `bat-1065` | `bat-1087` | M1 | `todo` in `avi-sprint-1` |
| `bat-1066` | `bat-1088` | M1 | `todo` in `avi-sprint-1` |
| `bat-1067` | `bat-1089` | M1 | `todo` in `avi-sprint-1` |
| `bat-1068` | `bat-1090` | M1 | `todo` in `avi-sprint-1` |
| `bat-1069` | `bat-1091` | M2 | `todo` in `avi-sprint-1` |
| `bat-1070` | `bat-1092` | M2 | `todo` in `avi-sprint-1` |
| `bat-1071` | `bat-1093` | M2 | `todo` in `avi-sprint-1` |
| `bat-1072` | `bat-1094` | M2 | `todo` in `avi-sprint-1` |
| `bat-1073` | `bat-1095` | M2 | `todo` in `avi-sprint-1` |
| `bat-1074` | `bat-1096` | M3 | `todo` in `avi-sprint-1` |
| `bat-1075` | `bat-1097` | M3 | `todo` in `avi-sprint-1` |
| `bat-1076` | `bat-1098` | M3 | `todo` in `avi-sprint-1` |
| `bat-1077` | `bat-1099` | M3 | `todo` in `avi-sprint-1` |
| `bat-1078` | `bat-1100` | M3 | `todo` in `avi-sprint-1` |
| `bat-1079` | `bat-1101` | M4 | `todo` in `avi-sprint-1` |
| `bat-1080` | `bat-1102` | M4 | `todo` in `avi-sprint-1` |
| `bat-1081` | `bat-1103` | M4 | `todo` in `avi-sprint-1` |
| `bat-1082` | `bat-1104` | M4 | `todo` in `avi-sprint-1` |
| `bat-1083` | `bat-1105` | M4 | `todo` in `avi-sprint-1` |

## Traceability Rules Applied

1. Every ticket is in BatCave product `prod-1776919051784`.
2. Every ticket uses feature `docpilot-cms-platform`.
3. PM epics and user stories are sprinted as `todo` planning/story containers.
4. Executable `AGENT:` child tasks are sprinted as `todo` and are the startable agent units.
5. Every story description includes milestone, dependencies, risk notes, and trace.
6. Every story has acceptance criteria stored in BatCave.
7. Every story traces to one or more `UX-*`, `DSC-*`, or PO epic references.
