# DocPilot Workflow Matrix

## Purpose

Define the canonical workflow spine for DocPilot so product, document, section, translation, and release behavior follow one coherent operational model.

Target spine:

`Product -> Document -> Section -> Review -> Translate -> Release -> Publish`

## Current State In Code

Current workflow-related states already present in the codebase:

- `WorkflowStatus`: `draft | review | approved | published | archived`
- `TranslationStatus`: `not-started | in-progress | review | published`
- `TranslationRowState`: `dirty | saved | review`
- `ReleaseEntry.status`: `draft | published | rolled-back`
- `ReleaseEntry.environment`: `draft | staging | production`

This file defines how those states should behave as one system.

## Workflow Principles

1. Every content object must have a clear owner and next step.
2. No object should jump to `published` without reviewable readiness rules.
3. Release workflow must be stricter than section/document workflow.
4. Translation progress must affect release readiness, not just exist as side data.
5. Published content may still become stale, but stale is not the same as draft.

## 1. Product Workflow

Products are containers, not publishable content objects. Their status reflects operational readiness, not publication state.

### Product States

- `draft`
- `review`
- `published`
- `archived`

### Meaning

- `draft`: product shell exists, setup incomplete
- `review`: docs structure exists, internal review ongoing
- `published`: product has at least one active documentation stream ready for reader delivery
- `archived`: product no longer active for authoring or public delivery

### Allowed Transitions

- `draft -> review`
- `review -> published`
- `published -> review`
- `published -> archived`
- `review -> archived`

### Blocking Rules

A product must not move to `published` unless:

- at least one document exists
- at least one document is publishable
- required ownership metadata is present

## 2. Document Workflow

Documents are authoring and delivery units such as manuals, back-office guides, integration references, and operations docs.

### Document States

- `draft`
- `review`
- `approved`
- `published`
- `archived`

### Meaning

- `draft`: active authoring in progress
- `review`: ready for reviewer attention, but not yet approved
- `approved`: content approved for release packaging
- `published`: currently represented in a published release/snapshot
- `archived`: no longer active in navigation or delivery

### Allowed Transitions

- `draft -> review`
- `review -> draft`
- `review -> approved`
- `approved -> draft`
- `approved -> published`
- `published -> review`
- `published -> archived`
- `archived -> draft`

### Entry Conditions

Move a document to `review` when:

- required metadata is filled
- its primary sections are no longer rough drafts
- owner/reviewer are assigned

Move a document to `approved` when:

- blocking sections are resolved
- reviewer acceptance is complete
- unsafe HTML warnings are resolved

Move a document to `published` when:

- an approved release has been published for the document

### Blocking Rules

A document must not move to `approved` or `published` if:

- required sections are still `draft` or `review`
- unsafe HTML remains
- required reviewer is missing
- release readiness checks fail

## 3. Section Workflow

Sections are the smallest publishable editorial units and should drive most operational workflow.

### Section States

- `draft`
- `review`
- `approved`
- `published`
- `archived`

### Meaning

- `draft`: actively being written or edited
- `review`: submitted for editorial/reviewer feedback
- `approved`: accepted for inclusion in next release
- `published`: represented in currently published content
- `archived`: intentionally retired from active content

### Allowed Transitions

- `draft -> review`
- `review -> draft`
- `review -> approved`
- `approved -> draft`
- `approved -> published`
- `published -> draft`
- `published -> archived`

### Required Metadata

Each section should eventually have:

- owner
- reviewer
- updatedAt
- summary
- stable slug/number

### Blocking Rules

A section must not move to `approved` or `published` if:

- title or body is incomplete
- unsafe HTML is present
- reviewer is missing
- content comments requiring change are unresolved

## 4. Translation Workflow

Translations are not just locale labels; they are release-governed deliverables.

### Translation Language States

- `not-started`
- `in-progress`
- `review`
- `published`

### Meaning

- `not-started`: locale exists but has not begun translation work
- `in-progress`: strings are being translated
- `review`: translation is ready for localization QA/reviewer
- `published`: locale is acceptable for release use

### Allowed Transitions

- `not-started -> in-progress`
- `in-progress -> review`
- `review -> in-progress`
- `review -> published`
- `published -> in-progress`

### Translation Row States

- `dirty`
- `saved`
- `review`

### Meaning

- `dirty`: changed but not confirmed
- `saved`: entered and saved
- `review`: flagged for reviewer attention

### Blocking Rules

A locale must not count as release-ready if:

- required keys are missing
- translation completion is below threshold
- locale status is below `review`

## 5. Release Workflow

Release workflow must be stricter than content workflow because it is the gate to external delivery.

## Current Release States

- `draft`
- `published`
- `rolled-back`

## Target Release States

- `draft`
- `review`
- `approved`
- `staged`
- `published`
- `rolled-back`

### Meaning

- `draft`: release bundle created, still incomplete
- `review`: readiness and ownership checks under review
- `approved`: ready for deployment target
- `staged`: promoted to staging environment
- `published`: promoted to production or official reader target
- `rolled-back`: release superseded by rollback action

### Allowed Transitions

- `draft -> review`
- `review -> draft`
- `review -> approved`
- `approved -> staged`
- `staged -> approved`
- `staged -> published`
- `published -> rolled-back`

### Environment Rules

Environment should remain:

- `draft`
- `staging`
- `production`

Rules:

- `draft` environment is not externally publishable
- `staging` is required before `production` in stricter future flow
- rollback should create a new release event, not mutate history invisibly

### Blocking Rules

A release must not move forward if:

- document readiness score fails threshold
- open sections remain in `draft` or `review`
- translation threshold is below policy
- no snapshot exists
- unsafe HTML or marker validation fails

## 6. Audit and Activity Workflow

Workflow transitions must generate durable activity events.

### Required Event Types

- `create`
- `update`
- `review`
- `approve`
- `publish`
- `rollback`
- `archive`
- `delete`

### Required Event Metadata

- actor
- timestamp
- entity type
- entity id
- document id when applicable
- section id when applicable
- release id when applicable
- human-readable summary

## 7. Readiness Rules

Readiness is the bridge between workflow and publishing.

### Section Readiness

A section is ready when:

- status is `approved` or `published`
- no unsafe HTML remains
- required fields are filled
- unresolved blocking comments do not exist

### Document Readiness

A document is ready when:

- required sections are ready
- document status is `approved` or `published`
- translation threshold passes for required locales
- no blocking validation issues exist

### Release Readiness

A release is ready when:

- document readiness passes
- release notes/metadata exist
- snapshot exists
- target environment rules are satisfied

## 8. What Needs To Change In Phase 1

### Keep

- existing document/section core statuses
- translation status model
- release environment model

### Extend

- add release states: `review`, `approved`, `staged`
- make `approved` operationally meaningful for documents and sections
- connect translation thresholds to release readiness
- formalize blocked transitions

### Normalize

- do not treat `published` as a generic “done” state
- distinguish `approved` from `published`
- distinguish content workflow from release workflow

## 9. Immediate Implementation Follow-Up

After this file, create:

1. `PERMISSION_MATRIX.md`
2. `DB_SCHEMA_DRAFT.md`

Those two files must map directly to this workflow matrix.
