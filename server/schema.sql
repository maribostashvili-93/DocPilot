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
