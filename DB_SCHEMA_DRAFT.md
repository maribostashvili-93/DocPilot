# DocPilot Database Schema Draft

## Purpose

Define the target PostgreSQL schema for DocPilot.
Derived directly from WORKFLOW_MATRIX.md and PERMISSION_MATRIX.md.

Migration approach: introduce this schema alongside existing JSON persistence,
then progressively migrate reads/writes through a storage adapter layer.

---

## Conventions

- All tables use `uuid` primary keys.
- `created_at` and `updated_at` are present on every table.
- `tenant_id` is present on every tenant-scoped table (row-level isolation).
- Enum types are defined as PostgreSQL `ENUM` or constrained `TEXT CHECK`.
- Foreign keys reference `id` columns; cascade rules are noted per table.

---

## Enums

```sql
-- Workflow states
CREATE TYPE product_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE document_status AS ENUM ('draft', 'review', 'approved', 'published', 'archived');
CREATE TYPE section_status AS ENUM ('draft', 'review', 'approved', 'published', 'archived');
CREATE TYPE translation_status AS ENUM ('not-started', 'in-progress', 'review', 'published');
CREATE TYPE translation_row_state AS ENUM ('dirty', 'saved', 'review');
CREATE TYPE release_status AS ENUM ('draft', 'review', 'approved', 'staged', 'published', 'rolled-back');
CREATE TYPE release_environment AS ENUM ('draft', 'staging', 'production');

-- Auth and access
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'invited');
CREATE TYPE grant_scope AS ENUM ('platform', 'tenant', 'product', 'document', 'section', 'release', 'translation-locale', 'asset');

-- Activity events
CREATE TYPE activity_action AS ENUM (
  'create', 'update', 'review', 'approve', 'publish',
  'rollback', 'archive', 'delete', 'invite', 'login'
);
```

---

## Core Tables

### tenants

```sql
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'free',
  settings      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### users

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  status        user_status NOT NULL DEFAULT 'invited',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);
```

### roles

```sql
CREATE TABLE roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = platform-level role
  name          TEXT NOT NULL,
  description   TEXT,
  is_system     BOOLEAN NOT NULL DEFAULT false,  -- true = cannot be deleted
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

-- Seed system roles: admin, company-admin, editor, reviewer, viewer, partner, tam, developer
```

### user_roles

```sql
CREATE TABLE user_roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by    UUID REFERENCES users(id),
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);
```

---

## Permission Grants

### permission_grants

Replaces the coarse `documents:write` model with a scoped `can(user, action, resource, scope)` check.

```sql
CREATE TABLE permission_grants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,           -- e.g. 'release.publish', 'document.approve'
  scope         grant_scope NOT NULL,
  scope_id      UUID,                    -- product_id, document_id, etc. NULL = all in tenant
  granted_by    UUID REFERENCES users(id),
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,
  CHECK (user_id IS NOT NULL OR role_id IS NOT NULL)
);

CREATE INDEX ON permission_grants (user_id, action, scope, scope_id);
CREATE INDEX ON permission_grants (role_id, action, scope, scope_id);
```

---

## Content Entities

### products

```sql
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  status          product_status NOT NULL DEFAULT 'draft',
  owner_id        UUID REFERENCES users(id),
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);
```

### product_members

Per-product access delegation without giving tenant-wide power.

```sql
CREATE TABLE product_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES roles(id),
  granted_by  UUID REFERENCES users(id),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
```

### documents

```sql
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  status          document_status NOT NULL DEFAULT 'draft',
  owner_id        UUID REFERENCES users(id),
  reviewer_id     UUID REFERENCES users(id),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, slug)
);
```

### sections

```sql
CREATE TABLE sections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  summary         TEXT,
  status          section_status NOT NULL DEFAULT 'draft',
  owner_id        UUID REFERENCES users(id),
  reviewer_id     UUID REFERENCES users(id),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  has_unsafe_html BOOLEAN NOT NULL DEFAULT false,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, slug)
);
```

---

## Translation Tables

### translation_locales

One row per document × locale combination.

```sql
CREATE TABLE translation_locales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  locale          TEXT NOT NULL,          -- e.g. 'ka', 'en', 'fr'
  status          translation_status NOT NULL DEFAULT 'not-started',
  completion_pct  INTEGER NOT NULL DEFAULT 0,
  reviewer_id     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, locale)
);
```

### translation_strings

One row per section × locale combination.

```sql
CREATE TABLE translation_strings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  section_id      UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  locale          TEXT NOT NULL,
  body            TEXT,
  state           translation_row_state NOT NULL DEFAULT 'dirty',
  translated_by   UUID REFERENCES users(id),
  reviewed_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (section_id, locale)
);
```

---

## Release Tables

### releases

```sql
CREATE TABLE releases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version         TEXT NOT NULL,
  title           TEXT,
  notes           TEXT,
  status          release_status NOT NULL DEFAULT 'draft',
  environment     release_environment NOT NULL DEFAULT 'draft',
  snapshot_id     UUID,                   -- FK to release_snapshots added below
  owner_id        UUID REFERENCES users(id),
  reviewer_id     UUID REFERENCES users(id),
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### release_items

What content is bundled in a release.

```sql
CREATE TABLE release_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id      UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  document_id     UUID REFERENCES documents(id),
  section_id      UUID REFERENCES sections(id),
  locale          TEXT,
  readiness_score INTEGER,                -- 0-100 snapshot at bundle time
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### release_snapshots

Immutable content snapshot at publish time.

```sql
CREATE TABLE release_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id  UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  payload     JSONB NOT NULL,             -- full content snapshot
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE releases
  ADD CONSTRAINT fk_release_snapshot
  FOREIGN KEY (snapshot_id) REFERENCES release_snapshots(id);
```

---

## Media

### media_assets

```sql
CREATE TABLE media_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id),
  filename        TEXT NOT NULL,
  original_name   TEXT,
  mime_type       TEXT NOT NULL,
  size_bytes      BIGINT,
  url             TEXT NOT NULL,
  alt_text        TEXT,
  uploaded_by     UUID REFERENCES users(id),
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Comments

```sql
CREATE TABLE comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  section_id      UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  author_id       UUID REFERENCES users(id),
  body            TEXT NOT NULL,
  is_blocking     BOOLEAN NOT NULL DEFAULT false,
  resolved        BOOLEAN NOT NULL DEFAULT false,
  resolved_by     UUID REFERENCES users(id),
  resolved_at     TIMESTAMPTZ,
  parent_id       UUID REFERENCES comments(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Activity Events

```sql
CREATE TABLE activity_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id        UUID REFERENCES users(id),
  action          activity_action NOT NULL,
  entity_type     TEXT NOT NULL,          -- 'document', 'section', 'release', etc.
  entity_id       UUID NOT NULL,
  product_id      UUID REFERENCES products(id),
  document_id     UUID REFERENCES documents(id),
  section_id      UUID REFERENCES sections(id),
  release_id      UUID REFERENCES releases(id),
  summary         TEXT,                   -- human-readable description
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON activity_events (tenant_id, created_at DESC);
CREATE INDEX ON activity_events (entity_type, entity_id);
CREATE INDEX ON activity_events (actor_id);
```

---

## Workflow Transition Log

Separate table for auditable state transitions (not merged into activity_events
so the transition chain is queryable without filtering noise).

```sql
CREATE TABLE workflow_transitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  from_status     TEXT NOT NULL,
  to_status       TEXT NOT NULL,
  actor_id        UUID REFERENCES users(id),
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON workflow_transitions (entity_type, entity_id, created_at DESC);
```

---

## Migration Phases

### Phase 1 — Schema + adapter layer

- Create all tables above in a `docpilot` schema.
- Write a storage adapter that accepts reads/writes for each entity type.
- Existing JSON persistence remains the primary store.
- New reads/writes go through the adapter; adapter writes to both JSON and DB.

### Phase 2 — Migrate primary content

- Products
- Documents
- Sections
- Media assets

Adapter flips to DB-primary for these entities. JSON becomes the fallback.

### Phase 3 — Migrate operational state

- Translations (locales + strings)
- Releases (items + snapshots)
- Comments

### Phase 4 — Migrate events and auth

- Activity events
- Workflow transitions
- Permission grants
- User roles

### Phase 5 — Remove JSON persistence

- Drop JSON-primary read paths.
- Remove file-based state management.
- JSON export remains available as a feature, not as the primary store.

---

## Indexes Summary

Performance-critical indexes beyond the above:

```sql
-- Tenant-scoped lookups
CREATE INDEX ON products (tenant_id, status);
CREATE INDEX ON documents (product_id, status);
CREATE INDEX ON sections (document_id, status);
CREATE INDEX ON translation_locales (document_id, locale);
CREATE INDEX ON releases (product_id, status, environment);

-- Permission lookups
CREATE INDEX ON permission_grants (tenant_id, scope, scope_id);
CREATE INDEX ON user_roles (user_id);
```

---

## Immediate Next Steps

1. Create `server/db/schema.sql` from this draft.
2. Choose migration tool — recommended: `node-postgres` + `node-pg-migrate`.
3. Write initial seed that maps existing JSON-state users/roles into the new tables.
4. Create storage adapter interface: `getDocument(id)`, `saveDocument(doc)`, etc.
5. Wire adapter to existing server routes — dual-write before flipping primary.
