# DocPilot Foundation Plan

## Goal

Stabilize the DocPilot platform spine before adding heavier features such as AI, advanced analytics, or deep integrations.

Core workflow target:

`Product -> Document -> Section -> Review -> Translate -> Release -> Publish`

## Phase 1 Scope

1. Define the canonical data model
2. Define workflow states and transition rules
3. Define granular permissions
4. Plan persistence migration from JSON state to PostgreSQL
5. Normalize activity/audit events

## Immediate Deliverables

### 1. Entity Map

- `Tenant`
- `User`
- `Product`
- `Document`
- `Section`
- `Translation`
- `Release`
- `MediaAsset`
- `Comment`
- `ActivityEvent`
- `PermissionGrant`

### 2. Workflow Matrix

#### Document

- `draft`
- `review`
- `approved`
- `published`
- `archived`

#### Section

- `draft`
- `review`
- `approved`
- `published`
- `deprecated`

#### Release

- `draft`
- `review`
- `approved`
- `staged`
- `published`
- `rolled_back`

### 3. Permission Matrix

- `product.view`
- `product.manage`
- `document.view`
- `document.edit`
- `section.edit`
- `section.review`
- `translation.edit`
- `release.publish`
- `media.manage`
- `user.manage`
- `settings.manage`

### 4. Persistence Migration Plan

Step 1:
- Introduce DB schema without deleting JSON persistence

Step 2:
- Add storage adapter layer so reads/writes can move away from file-based state

Step 3:
- Migrate products, documents, sections, translations, releases, media metadata

Step 4:
- Move activity events and comments

Step 5:
- Remove JSON state as primary store

## What Not To Build Yet

- AI assistant
- Deep Jira/GitHub integrations
- Advanced analytics
- Heavy search platform
- Complex public reader redesign

## Recommended Next Task

Create these three concrete artifacts next:

1. `DB_SCHEMA_DRAFT.md`
2. `WORKFLOW_MATRIX.md`
3. `PERMISSION_MATRIX.md`
