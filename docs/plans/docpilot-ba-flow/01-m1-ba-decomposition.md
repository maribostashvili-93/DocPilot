# DocPilot M1 BA Decomposition

Date: 2026-05-23
Feature: `docpilot-cms-platform`
Scope: M1 foundation stories `bat-1062` through `bat-1068`

## BA Gate

M1 is ready for agent execution after this decomposition. Each M1 story below includes business rules, edge cases, data/permission considerations, and BA acceptance checks. Parent stories remain the business containers; `AGENT:` child tasks are the executable units.

## `bat-1062` - Persist DocPilot CMS Entities Server-Side

Agent task: `bat-1084`
Trace: `UX-02`, `UX-04`, `DSC-01`

### Business Rules

1. Products, documents, sections, translations, releases, users, revision metadata, and media metadata must persist outside browser storage.
2. A saved mutation must record actor, timestamp, target entity, operation type, and previous/current revision reference where applicable.
3. Browser local-storage content must be treated as importable prototype data, not the source of truth after migration.
4. Document sections must preserve ordering, stable IDs, locale relationships, and marker references.
5. Persistence must support later audit, rollback, localization, and publish snapshot stories without redesigning entity identity.

### Data Requirements

Required entities:

- Product: id, slug, name, status, created/updated metadata.
- Document: id, product id, slug, title, visibility/audience, status, ordering/navigation metadata.
- Section: id, document id, stable order, title, content/body, component payloads, marker references.
- Locale/translation: locale, source entity, translated fields, status, updated metadata.
- Release/snapshot metadata: release id, source draft references, actor, readiness state, environment.
- User/role metadata: user id, role assignments, status.
- Media metadata: id, source, alt text, tags, owner, usage references.
- Revision metadata: entity id, revision number/hash, actor, timestamp, diff/summary.

### Edge Cases

1. Local storage contains malformed or older seed content.
2. Two browser tabs edit the same document before server persistence is enabled.
3. Section IDs referenced by markers no longer exist after import.
4. Imported data has duplicate slugs or missing locale references.
5. A save succeeds server-side but client state still contains old local values.

### BA Acceptance Checks

1. Given a new document is saved, when the browser is cleared or a new device opens the app, then the document remains available from server-backed data.
2. Given an editor changes a section, when the mutation completes, then the mutation has actor and timestamp metadata.
3. Given prototype local-storage data exists, when import/migration runs, then unsupported rows are reported and valid rows are migrated without silent loss.
4. Given a marker references a section, when the section persists, then marker-target integrity remains valid.
5. Given persistence is unavailable, when an editor attempts save, then the UI shows a blocking state and does not claim durable save.

## `bat-1063` - Establish Real Auth And Action-Level RBAC Baseline

Agent task: `bat-1085`
Trace: `UX-03`, `UX-29`, `DSC-02`

### Business Rules

1. Roles must include admin, editor, reviewer, viewer, and partner/TAM/developer or approved equivalents.
2. Role permissions must be action-level, not only route-level.
3. UI hiding is not sufficient; unauthorized server/API mutations must be rejected.
4. Permission checks must cover documents, sections, media, translations, releases, users, settings, and publish actions.
5. Permission denial must explain the blocked action without exposing restricted content.

### Permission Matrix Minimum

| Capability | Admin | Editor | Reviewer | Viewer | Partner/TAM/Developer |
| --- | --- | --- | --- | --- | --- |
| Manage users/roles | yes | no | no | no | no |
| Create/edit documents | yes | yes | no | no | limited by assignment |
| Review/comment | yes | yes | yes | no | limited by assignment |
| Publish/rollback | yes | limited if approved | no | no | no |
| Manage media | yes | yes | no | no | limited by assignment |
| View published docs | yes | yes | yes | yes | yes if entitled |
| View drafts | yes | yes | assigned only | no | assigned only |

### Edge Cases

1. User has multiple roles with conflicting permissions.
2. User permission changes while they have an editor screen open.
3. Direct API call attempts a restricted action hidden in the UI.
4. Reviewer attempts to approve their own changes.
5. Viewer opens a draft URL directly.

### BA Acceptance Checks

1. Given a viewer attempts document edit, when the request reaches the backend, then it is rejected.
2. Given an editor lacks publish rights, when they open publishing controls, then the action is unavailable with reason text.
3. Given a user role changes during a session, when the next restricted action occurs, then permissions are rechecked.
4. Given a reviewer has an assigned document, when they access unrelated drafts, then they are blocked.
5. Given admin manages users, when a role changes, then an audit event records actor, target user, old role, and new role.

## `bat-1064` - Define Immutable Revision And Publish Snapshot Model

Agent task: `bat-1086`
Trace: `UX-01`, `UX-04`, `UX-19`, `DSC-03`

### Business Rules

1. A publish snapshot must be immutable after creation.
2. A snapshot must capture content, section order, marker data, locale state, actor, timestamp, readiness result, and target environment.
3. Draft preview and published reader state must be visually distinct.
4. Rollback must create a new restorative action, not mutate historical snapshots.
5. Readiness blockers must prevent publish unless a governed override path exists.

### Snapshot Contents

Minimum snapshot payload:

- Snapshot id and release label.
- Product/document IDs and immutable versions of included sections.
- Locale completeness and translation status at publish time.
- Marker payloads and media references.
- Actor, timestamp, environment, and readiness result.
- Prior snapshot reference for rollback.

### Edge Cases

1. Publish is requested while a document has unsaved draft changes.
2. Translation is incomplete for a required locale.
3. Media referenced by a section is missing.
4. Rollback target has an old schema version.
5. A user opens preview after a newer publish has happened.

### BA Acceptance Checks

1. Given publish succeeds, when the draft changes later, then the published snapshot remains unchanged.
2. Given a draft preview is open, then the UI states draft, environment, audience, and unpublished status.
3. Given readiness blockers exist, when publish is attempted, then publish is blocked and each blocker links to remediation.
4. Given rollback is selected, then the target snapshot, actor, reason, and resulting new state are recorded.
5. Given a snapshot is viewed later, then it can be traced to actor, source revision, and readiness outcome.

## `bat-1065` - Normalize Product/Document Context Across Admin

Agent task: `bat-1087`
Trace: `UX-05`, `UX-14`, `UX-25`, `DSC-04`

### Business Rules

1. Admin screens must show the active DocPilot platform context and selected product/document context.
2. Aviator must appear as sample product content, not as the platform brand.
3. Context switching must warn when there are dirty edits or unsaved workflow state.
4. Document, section, locale, and release screens must use the same hierarchy language.
5. Navigation should expose real surfaces only; stale settings/workflow references must be implemented or removed.

### Standard Hierarchy Terms

1. Workspace
2. Product
3. Documentation space/document
4. Section
5. Locale
6. Release/snapshot

### Edge Cases

1. User deep-links to admin without a selected product.
2. User changes product while a section editor has unsaved changes.
3. Product has no documents.
4. Multiple documents share similar names.
5. Demo content appears in production shell copy.

### BA Acceptance Checks

1. Given any admin page is open, then the active product/document context is visible.
2. Given dirty edits exist, when user switches product/document, then a confirmation path appears.
3. Given DocPilot shell loads, then DocPilot is the product identity and Aviator is sample content.
4. Given user follows dashboard attention link, then target context opens directly.
5. Given no product is selected, then the app offers a guided selection/setup path.

## `bat-1066` - Refactor Marker Editor Into Basic And Advanced Inspector Tiers

Agent task: `bat-1088`
Trace: `UX-09`, `UX-11`, `UX-13`, `UX-28`, `DSC-06`

### Business Rules

1. Default marker creation exposes only type, label/CTA, description, target, position, and preset.
2. Advanced controls for color, opacity, dialog behavior, and CTA details are collapsed by default.
3. Screenshot and annotated-image paths must use one marker model and one editor behavior.
4. Marker type changes must preserve compatible content and warn before destructive layout changes.
5. Marker style defaults must come from approved presets before freeform styling.

### Basic Fields

- Marker type.
- Label or CTA text.
- Short description.
- Target section, URL, or anchor.
- Position and size.
- Visual preset.

### Advanced Fields

- Color and opacity.
- Dialog/tooltip behavior.
- CTA variant and destination behavior.
- Fine-grained position/size values.
- Optional analytics or tracking metadata when available later.

### Edge Cases

1. User changes marker type after entering content.
2. Marker target points to deleted section.
3. Imported marker lacks preset data.
4. Advanced fields produce inaccessible contrast.
5. Screenshot editor and full section editor create different marker payloads.

### BA Acceptance Checks

1. Given a user creates a marker, then only basic fields are required in the default inspector.
2. Given advanced controls are needed, when expanded, then changes are visible in preview and remain reversible.
3. Given marker type changes, then compatible values are preserved and incompatible values require confirmation.
4. Given legacy annotated-image path is used, then it writes the same marker model as screenshot editor.
5. Given a preset is selected, then contrast and minimum label requirements are enforced.

## `bat-1067` - Add Accessible Marker And Section Manipulation Alternatives

Agent task: `bat-1089`
Trace: `UX-09`, `UX-29`, `DSC-06`

### Business Rules

1. Marker movement, resize, and nudge must work without pointer dragging.
2. Section reorder must work without drag-and-drop.
3. Focus states, labels, and control names must be available for all manipulation controls.
4. Keyboard shortcuts must not trap focus or conflict with text editing.
5. Numeric controls must support precise position and size edits.

### Accessibility Requirements

- Keyboard path to select marker.
- Numeric X/Y/width/height controls.
- Nudge controls with predictable step size.
- Section move up/down actions.
- Visible focus indicator.
- Screen-reader labels for marker and section controls.
- Reduced-motion friendly feedback.

### Edge Cases

1. Marker is selected while user is typing in description field.
2. Browser scroll keys conflict with marker nudge shortcuts.
3. Section reorder changes active editor focus.
4. Marker moves outside image bounds.
5. Very small markers become impossible to select.

### BA Acceptance Checks

1. Given keyboard-only user selects a marker, then they can move and resize it with controls.
2. Given a section list exists, then a keyboard-only user can move a section up/down.
3. Given marker bounds would exceed image limits, then the app prevents or clamps the value.
4. Given a control receives focus, then the focus state is visible and named.
5. Given reduced motion is enabled, then manipulation feedback does not depend on animation.

## `bat-1068` - Add Schema Validation And Safe Advanced Editing Guardrails

Agent task: `bat-1090`
Trace: `UX-07`, `UX-12`, `UX-26`, `DSC-05`

### Business Rules

1. Slugs, URLs, versions, release labels, marker targets, and required metadata must validate before save/publish.
2. Advanced HTML edit mode must be gated and must validate sanitized output before save.
3. Invalid fields must show remediation copy near the field.
4. Validation must distinguish draft-save warnings from publish-blocking errors.
5. Existing prototype content must be migrated or flagged without silent deletion.

### Validation Minimums

- Slug uniqueness per product/document scope.
- URL scheme allowlist and anchor existence.
- Required title, section order, and document visibility values.
- Release label format and uniqueness.
- Marker target validity.
- HTML sanitizer output diff or warning for removed content.

### Edge Cases

1. Existing seed content violates new schema.
2. User pastes HTML with unsafe scripts or inline event handlers.
3. External link uses unsupported protocol.
4. Release label duplicates an old snapshot.
5. Marker target is valid in draft but invalid in publish snapshot.

### BA Acceptance Checks

1. Given an invalid slug is entered, then save/publish shows inline error and remediation.
2. Given unsafe HTML is pasted, then sanitized preview shows what will be removed before save.
3. Given marker target is broken, then publish readiness blocks or flags the marker.
4. Given validation warnings are non-blocking for draft, then publish still enforces required blockers.
5. Given migrated content has invalid fields, then the import report names each issue and preserves source data for correction.

## M1 Cross-Story Gates

1. Persistence must exist before auth, revisions, publish snapshots, and validation can be considered durable.
2. RBAC must protect backend mutation paths, not only UI controls.
3. Revision/snapshot rules must use persistent entity IDs and mutation metadata.
4. Context switching must respect dirty state and server-backed drafts.
5. Marker editor refactor and accessibility alternatives must share one marker model.
6. Validation must feed publish readiness blockers.

## BA Decision

M1 BA decomposition is complete enough for agent execution of `bat-1084` through `bat-1090`.

