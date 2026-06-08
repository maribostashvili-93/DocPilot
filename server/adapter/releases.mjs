import { db, makeId, nowIso } from '../db.mjs';
import { appendAudit } from '../auth.mjs';

export function get(id) {
  return db.prepare('SELECT * FROM releases WHERE id = ?').get(id) ?? null;
}

export function list(companyId, filters = {}) {
  let q = 'SELECT * FROM releases WHERE company_id = ?';
  const params = [companyId];
  if (filters.productId)  { q += ' AND product_id = ?';  params.push(filters.productId); }
  if (filters.documentId) { q += ' AND document_id = ?'; params.push(filters.documentId); }
  if (filters.status)     { q += ' AND status = ?';      params.push(filters.status); }
  q += ' ORDER BY created_at DESC';
  return db.prepare(q).all(...params);
}

export function save(entity, actorId) {
  const now = nowIso();
  const isNew = !entity.id;
  if (isNew) entity.id = makeId('rel');

  db.prepare(`
    INSERT INTO releases(
      id, company_id, product_id, document_id, version, label, status,
      notes, environment, snapshot_id, reviewer, created_at
    ) VALUES(
      @id, @company_id, @product_id, @document_id, @version, @label, @status,
      @notes, @environment, @snapshot_id, @reviewer, @created_at
    )
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label, status = excluded.status,
      notes = excluded.notes, environment = excluded.environment,
      snapshot_id = excluded.snapshot_id, reviewer = excluded.reviewer
  `).run({
    id: entity.id,
    company_id: entity.company_id,
    product_id: entity.product_id ?? null,
    document_id: entity.document_id,
    version: entity.version,
    label: entity.label ?? null,
    status: entity.status ?? 'draft',
    notes: entity.notes ?? null,
    environment: entity.environment ?? null,
    snapshot_id: entity.snapshot_id ?? null,
    reviewer: entity.reviewer ?? null,
    created_at: entity.created_at || now,
  });

  appendAudit({
    companyId: entity.company_id,
    userId: actorId,
    action: isNew ? 'release.create' : 'release.update',
    entityType: 'release',
    entityId: entity.id,
    productId: entity.product_id ?? null,
    releaseId: entity.id,
    summary: `${isNew ? 'Created' : 'Updated'} release ${entity.version}`,
  });

  return entity;
}

// Creates an immutable snapshot at publish time
export function snapshot(releaseId, payload, actorId) {
  const now = nowIso();
  const snapshotId = makeId('snap');

  db.transaction(() => {
    db.prepare(`
      INSERT INTO release_snapshots(id, release_id, payload, created_at)
      VALUES(?, ?, ?, ?)
    `).run(snapshotId, releaseId, JSON.stringify(payload), now);

    db.prepare('UPDATE releases SET snapshot_id = ?, published_at = ? WHERE id = ?')
      .run(snapshotId, now, releaseId);
  })();

  const rel = db.prepare('SELECT company_id, product_id FROM releases WHERE id = ?').get(releaseId);
  appendAudit({
    companyId: rel?.company_id,
    userId: actorId,
    action: 'release.snapshot',
    entityType: 'release',
    entityId: releaseId,
    productId: rel?.product_id ?? null,
    releaseId,
    summary: `Created snapshot ${snapshotId} for release ${releaseId}`,
  });

  return snapshotId;
}
