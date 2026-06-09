-- DocPilot multi-tenant schema (v2)
-- Created 2026-05-31. Owner: server/db.mjs.

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS company_branding (
  company_id TEXT PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#ff1b23',
  accent_color TEXT DEFAULT '#63cdff',
  hero_title TEXT,
  hero_subtitle TEXT,
  footer_text TEXT,
  description TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  surname TEXT,
  phone TEXT,
  telegram TEXT,
  signal_username TEXT,
  account_manager_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  invited_token TEXT,
  invited_expires_at TEXT,
  last_login_at TEXT,
  staging_card_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- NOTE: idx_users_account_manager is created in server/db.mjs AFTER the
-- ensureColumn() migrations run, so existing databases that lack the
-- account_manager_user_id column on first boot don't blow up here.

-- Each user can have multiple roles, but in practice 1 role per company-user pair.
-- Superadmins have role 'superadmin' and NULL company_id.
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  PRIMARY KEY (user_id, role)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_company_email
  ON users(COALESCE(company_id, ''), email);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  last_used_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  studio TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT,
  version TEXT,
  nav_order INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT,
  status TEXT,
  version TEXT,
  description TEXT,
  audience TEXT,
  taxonomy TEXT,
  nav_placement TEXT,
  nav_order INTEGER,
  owner TEXT,
  reviewer TEXT,
  template_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(company_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_product ON documents(product_id);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  number TEXT,
  slug TEXT,
  title TEXT,
  summary TEXT,
  html TEXT,
  status TEXT,
  owner TEXT,
  position INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sections_doc ON sections(document_id);
CREATE INDEX IF NOT EXISTS idx_sections_company ON sections(company_id);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  alt TEXT,
  caption TEXT,
  tags TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_company ON media_assets(company_id);

CREATE TABLE IF NOT EXISTS translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id TEXT NOT NULL,
  language_code TEXT NOT NULL,
  key_id TEXT NOT NULL,
  value TEXT,
  source_hash TEXT,
  state TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(company_id, language_code, key_id)
);

CREATE INDEX IF NOT EXISTS idx_translations_company ON translations(company_id);

CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  label TEXT,
  status TEXT,
  notes TEXT,
  environment TEXT,
  snapshot_json TEXT,
  source_revision INTEGER,
  rollback_of TEXT REFERENCES releases(id),
  previous_snapshot_id TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(company_id, document_id, version)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  ip TEXT,
  user_agent TEXT,
  summary TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_company_time ON audit_events(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_events(user_id);

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  company_id TEXT,
  ip TEXT NOT NULL,
  success INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_email_time ON login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_ip_time ON login_attempts(ip, created_at DESC);

-- Generic JSON-key store for things we haven't fully normalized yet
-- (themes, api keys, etc.). Used as a backwards-compat shim.
-- company_scope = '' means platform-global (superadmin scope).
CREATE TABLE IF NOT EXISTS kv_store (
  company_scope TEXT NOT NULL DEFAULT '',
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (company_scope, key)
);

-- ─── Phase 2A additions ────────────────────────────────────────────────────
-- All tables below were absent from the original schema.
-- They use CREATE TABLE IF NOT EXISTS so re-running this file on an existing
-- database is safe — existing tables are untouched.

-- Scoped permission grants: replaces the flat role→write-permission map.
-- action is a dot-namespaced string, e.g. 'release.publish', 'document.approve'.
-- scope / scope_id narrow the grant: NULL scope_id means "all in company".
CREATE TABLE IF NOT EXISTS permission_grants (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT,
  action TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'tenant',
  scope_id TEXT,
  granted_by TEXT REFERENCES users(id),
  granted_at TEXT NOT NULL,
  expires_at TEXT,
  CHECK (user_id IS NOT NULL OR role IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_pgrants_company ON permission_grants(company_id);
CREATE INDEX IF NOT EXISTS idx_pgrants_user ON permission_grants(user_id, action, scope, scope_id);

-- Per document × locale translation status.
-- Tracks completion and review state at the locale level.
CREATE TABLE IF NOT EXISTS translation_locales (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not-started',
  completion_pct INTEGER NOT NULL DEFAULT 0,
  reviewer TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(document_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_tlocales_document ON translation_locales(document_id);
CREATE INDEX IF NOT EXISTS idx_tlocales_company ON translation_locales(company_id);

-- Per section × locale translated body with row-level state.
-- 'dirty' = changed but unsaved, 'saved' = confirmed, 'review' = flagged.
CREATE TABLE IF NOT EXISTS translation_strings (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  body TEXT,
  state TEXT NOT NULL DEFAULT 'dirty',
  translated_by TEXT REFERENCES users(id),
  reviewed_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(section_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_tstrings_section ON translation_strings(section_id);
CREATE INDEX IF NOT EXISTS idx_tstrings_company ON translation_strings(company_id);

-- Immutable content snapshot written at release publish time.
-- Kept separate from the releases row so it can be large and queried independently.
CREATE TABLE IF NOT EXISTS release_snapshots (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rsnapshots_release ON release_snapshots(release_id);

-- Content items bundled inside a release.
-- readiness_score is captured at bundle time (0-100).
CREATE TABLE IF NOT EXISTS release_items (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES documents(id),
  section_id TEXT REFERENCES sections(id),
  locale TEXT,
  readiness_score INTEGER,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ritems_release ON release_items(release_id);

-- Per-product role delegation without granting tenant-wide power.
CREATE TABLE IF NOT EXISTS product_members (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  granted_by TEXT REFERENCES users(id),
  granted_at TEXT NOT NULL,
  UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pmembers_product ON product_members(product_id);
CREATE INDEX IF NOT EXISTS idx_pmembers_user ON product_members(user_id);

-- Section-level threaded comments.
-- is_blocking = 1 prevents section from advancing to 'approved'.
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES users(id),
  body TEXT NOT NULL,
  is_blocking INTEGER NOT NULL DEFAULT 0,
  resolved INTEGER NOT NULL DEFAULT 0,
  resolved_by TEXT REFERENCES users(id),
  resolved_at TEXT,
  parent_id TEXT REFERENCES comments(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_section ON comments(section_id);
CREATE INDEX IF NOT EXISTS idx_comments_company ON comments(company_id);

-- Auditable log of every workflow state transition.
-- Separate from audit_events so the transition chain is queryable without noise.
-- entity_type: 'document' | 'section' | 'release' | 'product' | 'translation-locale'
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  actor_id TEXT REFERENCES users(id),
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wtrans_entity ON workflow_transitions(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wtrans_company ON workflow_transitions(company_id, created_at DESC);

-- ── Phase 6B: API Keys ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT '["*"]',
  created_by TEXT REFERENCES users(id),
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_keys_company ON api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- ── Phase 6B: Webhooks ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT NOT NULL DEFAULT '["*"]',
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id),
  last_delivered_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload TEXT NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  duration_ms INTEGER,
  delivered_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_ep_company ON webhook_endpoints(company_id);
CREATE INDEX IF NOT EXISTS idx_webhook_del_endpoint ON webhook_deliveries(endpoint_id, delivered_at DESC);
