import { db, makeId, nowIso } from '../db.mjs';
import { appendAudit } from '../auth.mjs';

export function get(id) {
  return db.prepare('SELECT * FROM sections WHERE id = ?').get(id) ?? null;
}

export function listByDocument(documentId) {
  return db.prepare(
    'SELECT * FROM sections WHERE document_id = ? ORDER BY position ASC, created_at ASC'
  ).all(documentId);
}

export function list(companyId, filters = {}) {
  let q = 'SELECT * FROM sections WHERE company_id = ?';
  const params = [companyId];
  if (filters.documentId) { q += ' AND document_id = ?'; params.push(filters.documentId); }
  if (filters.status)     { q += ' AND status = ?';      params.push(filters.status); }
  q += ' ORDER BY position ASC, created_at ASC';
  return db.prepare(q).all(...params);
}

export function save(entity, actorId) {
  const now = nowIso();
  const isNew = !entity.id;
  if (isNew) entity.id = makeId('sec');

  db.prepare(`
    INSERT INTO sections(
      id, company_id, document_id, number, slug, title, summary, html,
      status, owner, reviewer, has_unsafe_html, position, created_at, updated_at
    ) VALUES(
      @id, @company_id, @document_id, @number, @slug, @title, @summary, @html,
      @status, @owner, @reviewer, @has_unsafe_html, @position, @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title, summary = excluded.summary, html = excluded.html,
      status = excluded.status, owner = excluded.owner, reviewer = excluded.reviewer,
      has_unsafe_html = excluded.has_unsafe_html, position = excluded.position,
      updated_at = excluded.updated_at
  `).run({
    id: entity.id,
    company_id: entity.company_id,
    document_id: entity.document_id,
    number: entity.number ?? null,
    slug: entity.slug ?? null,
    title: entity.title ?? null,
    summary: entity.summary ?? null,
    html: entity.html ?? null,
    status: entity.status ?? 'draft',
    owner: entity.owner ?? null,
    reviewer: entity.reviewer ?? null,
    has_unsafe_html: entity.has_unsafe_html ?? 0,
    position: entity.position ?? 0,
    created_at: entity.created_at || now,
    updated_at: now,
  });

  const doc = db.prepare('SELECT product_id FROM documents WHERE id = ?')
    .get(entity.document_id);

  appendAudit({
    companyId: entity.company_id,
    userId: actorId,
    action: isNew ? 'section.create' : 'section.update',
    entityType: 'section',
    entityId: entity.id,
    productId: doc?.product_id ?? null,
    documentId: entity.document_id,
    sectionId: entity.id,
    summary: `${isNew ? 'Created' : 'Updated'} section "${entity.title ?? entity.id}"`,
  });

  return entity;
}

export function remove(id, actorId) {
  const sec = db.prepare('SELECT * FROM sections WHERE id = ?').get(id);
  if (!sec) return false;
  db.prepare("UPDATE sections SET status = 'archived', updated_at = ? WHERE id = ?")
    .run(nowIso(), id);
  const doc = db.prepare('SELECT product_id FROM documents WHERE id = ?').get(sec.document_id);
  appendAudit({
    companyId: sec.company_id,
    userId: actorId,
    action: 'section.delete',
    entityType: 'section',
    entityId: id,
    productId: doc?.product_id ?? null,
    documentId: sec.document_id,
    sectionId: id,
    summary: `Deleted section "${sec.title ?? id}"`,
  });
  return true;
}
