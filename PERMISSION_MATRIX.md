# DocPilot Permission Matrix

## Purpose

Define the target authorization model for DocPilot so workflow, ownership, and publishing rules can be enforced consistently across tenants, products, documents, sections, translations, media, and releases.

This file extends the current coarse-grained permission map into a resource-aware model.

## Current State In Code

Current coarse-grained write permissions in the backend:

- `documents:write`
- `sections:write`
- `media:write`
- `translations:write`
- `releases:write`
- `users:manage`
- `settings:write`
- `integrations:write`

Current roles already present:

- `admin`
- `company-admin`
- `editor`
- `reviewer`
- `viewer`
- `partner`
- `tam`
- `developer`

Current model is role-to-permission only. It is not yet:

- tenant-scoped
- product-scoped
- document-scoped
- workflow-action aware

## Permission Model Principles

1. Access must be checked against both action and resource.
2. Publishing is separate from editing.
3. Reviewing is separate from editing.
4. Tenant admins must not automatically gain every workflow action.
5. Product-level delegation must be possible without global tenant power.

## Scope Layers

Every grant should eventually be evaluated at one or more of these scopes:

- `platform`
- `tenant`
- `product`
- `document`
- `section`
- `release`
- `translation-locale`
- `asset`

## Permission Families

### 1. Product Permissions

- `product.view`
- `product.create`
- `product.edit`
- `product.archive`
- `product.manage`

### 2. Document Permissions

- `document.view`
- `document.create`
- `document.edit`
- `document.review`
- `document.approve`
- `document.archive`

### 3. Section Permissions

- `section.view`
- `section.create`
- `section.edit`
- `section.comment`
- `section.review`
- `section.approve`
- `section.delete`

### 4. Translation Permissions

- `translation.view`
- `translation.edit`
- `translation.review`
- `translation.publish`

### 5. Release Permissions

- `release.view`
- `release.create`
- `release.review`
- `release.approve`
- `release.stage`
- `release.publish`
- `release.rollback`

### 6. Media Permissions

- `media.view`
- `media.upload`
- `media.edit`
- `media.delete`
- `media.replace`

### 7. User and Access Permissions

- `user.view`
- `user.invite`
- `user.edit`
- `user.deactivate`
- `access.manage`

### 8. Settings and Integration Permissions

- `settings.view`
- `settings.edit`
- `integration.view`
- `integration.manage`
- `webhook.manage`
- `api-key.manage`

## Recommended Role Baseline

These are default baselines. Later phases may allow per-product and per-document overrides.

## 1. Admin

Scope:
- platform or tenant-wide, depending on deployment mode

Allowed:
- all permissions

Notes:
- final escalation role
- owns policy overrides

## 2. Company Admin

Scope:
- tenant-wide

Allowed:
- `product.*`
- `document.*`
- `section.*`
- `media.*`
- `user.view`
- `user.invite`
- `user.edit`
- `settings.view`
- `settings.edit`

Restricted:
- may not automatically get `release.publish` unless explicitly granted
- may not automatically get `integration.manage` unless explicitly granted

## 3. Editor

Scope:
- product, document, or tenant

Allowed:
- `product.view`
- `document.view`
- `document.create`
- `document.edit`
- `section.view`
- `section.create`
- `section.edit`
- `section.comment`
- `translation.view`
- `media.view`
- `media.upload`
- `media.edit`

Restricted:
- no final approval
- no publish
- no user management

## 4. Reviewer

Scope:
- document, section, translation-locale, or product

Allowed:
- `document.view`
- `document.review`
- `document.approve`
- `section.view`
- `section.comment`
- `section.review`
- `section.approve`
- `translation.view`
- `translation.review`

Restricted:
- no structural editing by default
- no release publish by default

## 5. Viewer

Scope:
- tenant, product, or document

Allowed:
- `product.view`
- `document.view`
- `section.view`
- `translation.view`
- `release.view`
- `media.view`

Restricted:
- no edits
- no workflow transitions

## 6. Partner

Scope:
- limited product or document set

Allowed:
- `document.view`
- optional `document.edit`
- `section.view`
- optional `section.comment`
- `translation.view`
- optional `translation.edit`

Restricted:
- no tenant administration
- no publish
- no user management

## 7. TAM

Scope:
- tenant or product

Allowed:
- `product.view`
- `document.view`
- `document.edit`
- `document.review`
- `section.view`
- `section.edit`
- `section.comment`
- `section.review`
- `translation.view`
- `translation.edit`
- `release.view`
- `release.create`

Restricted:
- no final publish by default

## 8. Developer

Scope:
- tenant or product

Allowed:
- `document.view`
- `document.edit`
- `section.view`
- `section.edit`
- `media.view`
- `settings.view`
- `integration.view`
- `integration.manage`

Restricted:
- no final editorial approval by default
- no publish by default

## Workflow Action Matrix

## Document Actions

| Action | Admin | Company Admin | Editor | Reviewer | Viewer | Partner | TAM | Developer |
|---|---|---|---|---|---|---|---|---|
| Create document | Yes | Yes | Yes | No | No | Optional | No | No |
| Edit document | Yes | Yes | Yes | No | No | Optional | Yes | Yes |
| Move document to review | Yes | Yes | Yes | No | No | Optional | Yes | No |
| Approve document | Yes | Optional | No | Yes | No | No | Optional | No |
| Archive document | Yes | Yes | No | No | No | No | No | No |

## Section Actions

| Action | Admin | Company Admin | Editor | Reviewer | Viewer | Partner | TAM | Developer |
|---|---|---|---|---|---|---|---|---|
| Create section | Yes | Yes | Yes | No | No | Optional | Yes | Yes |
| Edit section | Yes | Yes | Yes | No | No | Optional | Yes | Yes |
| Comment on section | Yes | Yes | Yes | Yes | No | Optional | Yes | Yes |
| Submit section for review | Yes | Yes | Yes | No | No | Optional | Yes | No |
| Approve section | Yes | Optional | No | Yes | No | No | Optional | No |
| Delete section | Yes | Yes | Optional | No | No | No | No | No |

## Translation Actions

| Action | Admin | Company Admin | Editor | Reviewer | Viewer | Partner | TAM | Developer |
|---|---|---|---|---|---|---|---|---|
| Edit translation | Yes | Optional | Optional | No | No | Optional | Yes | No |
| Review translation | Yes | No | No | Yes | No | No | Optional | No |
| Publish translation locale | Yes | No | No | Optional | No | No | No | No |

## Release Actions

| Action | Admin | Company Admin | Editor | Reviewer | Viewer | Partner | TAM | Developer |
|---|---|---|---|---|---|---|---|---|
| Create release draft | Yes | Optional | Optional | No | No | No | Yes | No |
| Review release | Yes | Optional | No | Yes | No | No | Optional | No |
| Approve release | Yes | Optional | No | Optional | No | No | Optional | No |
| Stage release | Yes | Optional | No | No | No | No | Optional | No |
| Publish release | Yes | Optional explicit grant | No | No | No | No | No | No |
| Roll back release | Yes | Optional explicit grant | No | No | No | No | No | No |

## Media Actions

| Action | Admin | Company Admin | Editor | Reviewer | Viewer | Partner | TAM | Developer |
|---|---|---|---|---|---|---|---|---|
| Upload asset | Yes | Yes | Yes | No | No | Optional | Yes | Yes |
| Edit asset metadata | Yes | Yes | Yes | No | No | Optional | Yes | Yes |
| Replace asset | Yes | Yes | Optional | No | No | No | Optional | Yes |
| Delete asset | Yes | Yes | Optional | No | No | No | No | No |

## Permission Evaluation Rules

The target authz check should become:

`can(user, action, resource, scope)`

Where:

- `user` contains role plus grants
- `action` is a specific permission like `release.publish`
- `resource` is the actual entity
- `scope` is derived from tenant/product/document ownership

## Ownership Rules

Ownership should modify behavior, but not fully replace permissions.

### Owner Privileges

Document or section owners may:

- edit their assigned content
- move it into review
- respond to comments

Owners should not automatically:

- approve their own content
- publish their own release

### Reviewer Privileges

Assigned reviewers may:

- review assigned content
- approve or reject assigned content

Reviewers should not automatically:

- restructure product navigation
- publish to production

## What Needs To Change In Phase 1

### Keep

- current role names
- coarse permission families as migration anchors

### Replace

- key-name guessing for permissions
- role-only checks
- broad `documents:write` behavior as the long-term model

### Add

- explicit action catalog
- scope-aware authz checks
- per-product and per-document grants
- separate publish privilege
- separate approve privilege

## Recommended Implementation Sequence

1. Define action catalog in one shared authz file
2. Map current roles to default grants
3. Replace page-level permission checks with `can(...)`
4. Add scoped grants for product/document ownership
5. Add workflow-specific publish/approve checks

## Immediate Follow-Up

After this file, create:

1. `DB_SCHEMA_DRAFT.md`

That schema must represent:

- users
- roles
- grants
- resource ownership
- activity events
