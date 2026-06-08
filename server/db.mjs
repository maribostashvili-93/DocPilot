import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '.docpilot-data');
const DB_PATH = process.env.DOCPILOT_DB || join(DATA_DIR, 'docpilot.sqlite');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

// Idempotent column-add migrations for existing databases.
// SQLite's CREATE TABLE IF NOT EXISTS doesn't add columns to an already-created
// table, so for each column we check PRAGMA table_info and ALTER if missing.
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (cols.some((c) => c.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}

// users
ensureColumn('users', 'surname', 'surname TEXT');
ensureColumn('users', 'phone', 'phone TEXT');
ensureColumn('users', 'telegram', 'telegram TEXT');
ensureColumn('users', 'signal_username', 'signal_username TEXT');
ensureColumn('users', 'account_manager_user_id', 'account_manager_user_id TEXT REFERENCES users(id) ON DELETE SET NULL');
ensureColumn('users', 'staging_card_enabled', 'staging_card_enabled INTEGER NOT NULL DEFAULT 1');
db.exec('CREATE INDEX IF NOT EXISTS idx_users_account_manager ON users(account_manager_user_id)');

// sections — Phase 2A: reviewer + unsafe HTML flag
ensureColumn('sections', 'reviewer', 'reviewer TEXT');
ensureColumn('sections', 'has_unsafe_html', 'has_unsafe_html INTEGER NOT NULL DEFAULT 0');

// documents — Phase 2A: unsafe HTML flag
ensureColumn('documents', 'has_unsafe_html', 'has_unsafe_html INTEGER NOT NULL DEFAULT 0');

// releases — Phase 2A: product_id (top-level grouping), structured snapshot ref, reviewer
ensureColumn('releases', 'product_id', 'product_id TEXT REFERENCES products(id)');
ensureColumn('releases', 'snapshot_id', 'snapshot_id TEXT');
ensureColumn('releases', 'reviewer', 'reviewer TEXT');

// audit_events — Phase 2A: entity FK context columns for efficient filtering
ensureColumn('audit_events', 'product_id', 'product_id TEXT');
ensureColumn('audit_events', 'document_id', 'document_id TEXT');
ensureColumn('audit_events', 'section_id', 'section_id TEXT');
ensureColumn('audit_events', 'release_id', 'release_id TEXT');
db.exec('CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id)');

export function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix) {
  return `${prefix}_${randomBytes(8).toString('hex')}`;
}

export function makeSlug() {
  // 16 chars, URL-safe, unguessable (~96 bits of entropy)
  return randomBytes(12).toString('base64url').slice(0, 16);
}

export function makeToken() {
  // 256-bit session token
  return randomBytes(32).toString('base64url');
}

export function transaction(fn) {
  const tx = db.transaction(fn);
  return tx();
}
