import { db, makeId, makeSlug, nowIso } from '../db.mjs';
import { appendAudit } from '../auth.mjs';

function kvKey(companyId) { return `documents_${companyId}`; }

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
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id) ?? null;
}

export function getBySlug(companyId, slug) {
  return db.prepare('SELECT * FROM documents WHERE company_id = ? AND slug = ?')
    .get(companyId, slug) ?? null;
}

export function list(companyId, filters = {}) {
  let q = 'SELECT * FROM documents WHERE company_id = ?';
  const params = [companyId];
  if (filters.productId) { q += ' AND product_id = ?'; params.push(filters.productId); }
  if (filters.status)    { q += ' AND status = ?';     params.push(filters.status); }
  q += ' ORDER BY nav_order ASC, created_at ASC';
  return db.prepare(q).all(...params);
}

export function save(entity, actorId) {
  const now = nowIso();
  const isNew = !entity.id;
  if (isNew) {
    entity.id = makeId('doc');
    entity.slug = entity.slug || makeSlug();
  }

  db.prepare(`
    INSERT INTO documents(
      id, company_id, product_id, slug, title, type, status, version,
      description, audience, taxonomy, nav_placement, nav_order,
      owner, reviewer, template_id, has_unsafe_html, created_at, updated_at
    ) VALUES(
      @id, @company_id, @product_id, @slug, @title, @type, @status, @version,
      @description, @audience, @taxonomy, @nav_placement, @nav_order,
      @owner, @reviewer, @template_id, @has_unsafe_html, @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title, type = excluded.type, status = excluded.status,
      version = excluded.version, description = excluded.description,
      audience = excluded.audience, taxonomy = excluded.taxonomy,
      nav_placement = excluded.nav_placement, nav_order = excluded.nav_order,
      owner = excluded.owner, reviewer = excluded.reviewer,
      has_unsafe_html = excluded.has_unsafe_html, updated_at = excluded.updated_at
  `).run({
    id: entity.id,
    company_id: entity.company_id,
    product_id: entity.product_id,
    slug: entity.slug,
    title: entity.title,
    type: entity.type ?? null,
    status: entity.status ?? 'draft',
    version: entity.version ?? null,
    description: entity.description ?? null,
    audience: entity.audience ?? null,
    taxonomy: entity.taxonomy ?? null,
    nav_placement: entity.nav_placement ?? null,
    nav_order: entity.nav_order ?? null,
    owner: entity.owner ?? null,
    reviewer: entity.reviewer ?? null,
    template_id: entity.template_id ?? null,
    has_unsafe_html: entity.has_unsafe_html ?? 0,
    created_at: entity.created_at || now,
    updated_at: now,
  });

  // dual-write to kv_store (removed in Phase 2D)
  const kv = readKv(entity.company_id);
  kv[entity.id] = { ...entity, updated_at: now };
  writeKv(entity.company_id, kv);

  appendAudit({
    companyId: entity.company_id,
    userId: actorId,
    action: isNew ? 'document.create' : 'document.update',
    entityType: 'document',
    entityId: entity.id,
    productId: entity.product_id,
    documentId: entity.id,
    summary: `${isNew ? 'Created' : 'Updated'} document "${entity.title}"`,
  });

  return entity;
}

export function remove(id, actorId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!doc) return false;
  db.prepare("UPDATE documents SET status = 'archived', updated_at = ? WHERE id = ?")
    .run(nowIso(), id);
  appendAudit({
    companyId: doc.company_id,
    userId: actorId,
    action: 'document.archive',
    entityType: 'document',
    entityId: id,
    productId: doc.product_id,
    documentId: id,
    summary: `Archived document "${doc.title}"`,
  });
  return true;
}
