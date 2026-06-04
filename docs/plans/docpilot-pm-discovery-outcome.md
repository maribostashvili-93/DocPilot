# DocPilot PM Discovery Outcome Package

Date: 2026-05-23
BatCave intake: `bat-1054`
Feature: `docpilot-cms-platform`
Product: DocPilot only
Phase: 2 - PM product discovery

## Phase 1 Gate Result

Phase 1 UX audit is complete and documented under `docs/plans/docpilot-ux-system-audit/`.

Required artifacts:

1. `01-action-map.md`
2. `02-ui-element-inventory.md`
3. `03-ux-pattern-inventory.md`
4. `04-scored-matrix.md`
5. `05-issue-to-fix-table.md`

Gate decision: proceed to PM discovery. No backlog item should be created unless it traces to a Phase 1 UX finding or a discovery objective below.

## Inputs Used

1. BatCave intake `bat-1054`: WordPress-level CMS client area for DocPilot.
2. PO plan: `docs/plans/docpilot-wordpress-parity-po-plan.md`.
3. UX audit findings: `UX-01` through `UX-30`.
4. Current product handoff: `docs/plans/docpilot-product-handoff.md`.

## Product Thesis

DocPilot should become a general-purpose documentation CMS and client area for software product teams. The platform must let non-engineering users author, review, localize, publish, and govern documentation with enough control for enterprise clients and enough usability for daily content operations.

The current prototype proves the core direction: public docs, admin workspace, content editing, marker annotations, translations, publishing metadata, and user management. The next PM scope must convert that prototype into a safe CMS platform: persistent data, role-based workflows, durable versions, governed publishing, stronger authoring, and a lower-friction marker/media experience.

## In Scope

| Scope ID | Scope objective | Why now | Trace source |
| --- | --- | --- | --- |
| DSC-01 | Backend persistence and audit foundation for products, docs, sections, translations, releases, users, revisions, and media metadata. | Local storage is the largest production blocker. | `UX-02`, `UX-04`, `UX-30`, intake group 1/2/6 |
| DSC-02 | Real authentication, roles, and action-level permissions for admin, editor, reviewer, viewer, partner/TAM/developer users. | Client-area governance requires real access control. | `UX-03`, `UX-29`, intake group 2 |
| DSC-03 | Governed publish model with immutable snapshots, readiness gates, staged environments, actor attribution, rollback, and preview-state clarity. | Publishing is currently metadata-only and not auditable. | `UX-01`, `UX-04`, `UX-19`, `UX-22`, intake group 6 |
| DSC-04 | Product/document IA model: workspace/product/document/section hierarchy, templates, navigation manager, taxonomy/tags/categories, ordering, and search. | WordPress-level parity requires content organization, not only editing. | `UX-05`, `UX-06`, `UX-18`, `UX-30`, intake group 3 |
| DSC-05 | Authoring core: reusable blocks/components, rich editor validation, safe HTML advanced mode, draft handling, revision restore, and reusable templates. | Current editing is strong but fragmented and risky. | `UX-07`, `UX-21`, `UX-26`, `UX-27`, PO Epic 1 |
| DSC-06 | Media library and screenshot/marker UX refactor with compact basic controls, presets, direct manipulation, keyboard alternatives, validation, and one unified annotation path. | Marker editor is high value and currently high complexity. | `UX-09`, `UX-10`, `UX-11`, `UX-12`, `UX-13`, `UX-28`, intake group 7 |
| DSC-07 | Localization workflow with locale setup, ownership, reviewer states, missing-string triage, comments, and status feedback. | Existing translations are useful but not workflow-ready. | `UX-16`, `UX-17`, `UX-24`, intake group 6 |
| DSC-08 | Workflow/governance collaboration: comments, assignments, review states, audit evidence, and role-specific queues. | Multi-role client area requires task ownership and approvals. | `UX-03`, `UX-18`, `UX-22`, PO Epic 2 |
| DSC-09 | Themes/templates and design-token system for branded docs and reusable content families. | Needed after foundation and IA stabilize. | `UX-11`, `UX-25`, PO Epic 4 |
| DSC-10 | Integration/extensibility layer: webhooks, API keys, external docs links, analytics snippets, and instrumentation. | Required for platform scale, but lower priority than safe authoring/publish. | intake group 5, PO Epic 5 |

## Out Of Scope For This Backlog

1. Arbitrary plugin marketplace or third-party code installation.
2. Billing, subscriptions, pricing, invoicing, or account plans.
3. Headless multi-channel delivery outside web docs.
4. AI-assisted documentation helpers.
5. Full import/export suite beyond what is needed to validate media/docs platform foundations.
6. Rebuilding BatCave workflows inside DocPilot as the development system.
7. Native mobile applications.
8. Custom enterprise SSO variants beyond a generic auth/RBAC foundation.

## Non-Goals

1. Do not treat Aviator as the product identity. Aviator remains sample/demo content.
2. Do not create implementation-ready engineering subtasks in this PM pass. BA decomposition comes next.
3. Do not prioritize visual theme customization before persistence, access control, publishing, and IA foundations.
4. Do not ship publish controls that imply audit-grade release without immutable content snapshots.
5. Do not keep duplicate marker editors or duplicate product/document creation paths.
6. Do not create backlog outside feature `docpilot-cms-platform`.

## Priority Outcomes

| Priority | Outcome | Discovery objectives | Milestone |
| --- | --- | --- | --- |
| Must | Safe CMS foundation: persistence, auth/RBAC, global context, validation, governed publish model, durable revisions. | `DSC-01`, `DSC-02`, `DSC-03`, `DSC-05` | M1 |
| Must | Marker/media UX becomes usable for nontechnical editors without losing power. | `DSC-06` | M1/M2 |
| Must | Authoring and IA support WordPress-like document creation, organization, reusable blocks, and navigation. | `DSC-04`, `DSC-05` | M2 |
| Should | Localization becomes a managed workflow with ownership, status, review, and missing-string triage. | `DSC-07` | M3 |
| Should | Governance collaboration adds comments, assignments, approval queues, and audit evidence. | `DSC-08` | M3 |
| Could | Theme/token/template controls allow branded content families. | `DSC-09` | M4 |
| Could | Integration and analytics hooks support platform extensibility. | `DSC-10` | M4 |

## Milestone Intent

| Milestone | Intent | Included objectives | Notable UX findings |
| --- | --- | --- | --- |
| M1 | Foundation and critical UX safety. | `DSC-01`, `DSC-02`, `DSC-03`, core `DSC-05`, core `DSC-06` | `UX-01`, `UX-02`, `UX-03`, `UX-04`, `UX-05`, `UX-07`, `UX-09`, `UX-11`, `UX-13`, `UX-26`, `UX-29` |
| M2 | Authoring, media, and information architecture. | `DSC-04`, `DSC-05`, `DSC-06` | `UX-06`, `UX-10`, `UX-18`, `UX-19`, `UX-27`, `UX-30` |
| M3 | Governance, localization, release operations. | `DSC-03`, `DSC-07`, `DSC-08` | `UX-01`, `UX-16`, `UX-17`, `UX-22`, `UX-24` |
| M4 | Scale, brandability, integrations. | `DSC-09`, `DSC-10` | `UX-11`, `UX-23`, `UX-25` |

## BA Handoff Guidance

BA should decompose each PM backlog item into business rules, acceptance criteria, edge cases, permission rules, data entities, and release constraints. BA should preserve these constraints:

1. Every backlog item must trace to at least one `UX-*` finding or `DSC-*` objective.
2. M1 items must not assume WordPress-level theme/integration scope before persistence, RBAC, and publish safety exist.
3. Publish, revision, user, permission, and localization stories require security and QA acceptance criteria.
4. Marker UX stories require keyboard/accessibility acceptance criteria.
5. Persistence stories require migration/backward-compatibility criteria for local-storage prototype data.

