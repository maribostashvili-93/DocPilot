import { db, makeId, nowIso } from '../db.mjs';
import { appendAudit } from '../auth.mjs';

function kvKey(companyId) { return `products_${companyId}`; }

function readKv(companyId) {
  const row = db.prepare(
    'SELECT value FROM kv_store WHERE company_scope = ? AND key = ?'
  ).get(companyId, kvKey(companyId));
  return row ? JSON.parse(row.value) : {};
}

function writeKv(companyId, data) {
  const now = nowIso();
  db.prepare(`
    INSERT INTO kv_store(company_scope, key, value, revision, updated_at)
    VALUES(?, ?, ?, 1, ?)
    ON CONFLICT(company_scope, key)
    DO UPDATE SET value = excluded.value, revision = revision + 1, updated_at = excluded.updated_at
  `).run(companyId, kvKey(companyId), JSON.stringify(data), now);
}

export function get(id) {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (row) return row;
  // fallback: search kv_store for unmigrated rows
  const all = db.prepare(
    "SELECT company_scope, value FROM kv_store WHERE key LIKE 'products_%'"
  ).all();
  for (const { company_scope: _scope, value } of all) {
    const map = JSON.parse(value);
    if (map[id]) return { ...map[id], _source: 'kv' };
  }
  return null;
}

export function list(companyId, filters = {}) {
  let q = 'SELECT * FROM products WHERE company_id = ?';
  const params = [companyId];
  if (filters.status) { q += ' AND status = ?'; params.push(filters.status); }
  q += ' ORDER BY nav_order ASC, created_at ASC';
  return db.prepare(q).all(...params);
}

export function save(entity, actorId) {
  const now = nowIso();
  const isNew = !entity.id;
  if (isNew) entity.id = makeId('prod');

  db.prepare(`
    INSERT INTO products(id, company_id, name, studio, status, description, version, nav_order, created_at, updated_at)
    VALUES(@id, @company_id, @name, @studio, @status, @description, @version, @nav_order, @created_at, @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, studio = excluded.studio, status = excluded.status,
      description = excluded.description, version = excluded.version,
      nav_order = excluded.nav_order, updated_at = excluded.updated_at
  `).run({
    id: entity.id,
    company_id: entity.company_id,
    name: entity.name,
    studio: entity.studio ?? null,
    status: entity.status ?? 'draft',
    description: entity.description ?? null,
    version: entity.version ?? null,
    nav_order: entity.nav_order ?? 1,
    created_at: entity.created_at || now,
    updated_at: now,
  });

  // dual-write to kv_store for backwards compat (removed in Phase 2D)
  const kv = readKv(entity.company_id);
  kv[entity.id] = { ...entity, updated_at: now };
  writeKv(entity.company_id, kv);

  appendAudit({
    companyId: entity.company_id,
    userId: actorId,
    action: isNew ? 'product.create' : 'product.update',
    entityType: 'product',
    entityId: entity.id,
    productId: entity.id,
    summary: `${isNew ? 'Created' : 'Updated'} product ${entity.name}`,
  });

  return entity;
}

export function remove(id, actorId) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) return false;

  const now = nowIso();
  db.prepare("UPDATE products SET status = 'archived', updated_at = ? WHERE id = ?")
    .run(now, id);

  const kv = readKv(product.company_id);
  if (kv[id]) { kv[id].status = 'archived'; writeKv(product.company_id, kv); }

  appendAudit({
    companyId: product.company_id,
    userId: actorId,
    action: 'product.archive',
    entityType: 'product',
    entityId: id,
    productId: id,
    summary: `Archived product ${product.name}`,
  });

  return true;
}
