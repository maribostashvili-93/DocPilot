import { makeId, nowIso, db } from '../db.mjs';
import { htmlToPlain, makeSummary } from './extract.mjs';

function upsertRow(companyId, productId, documentId, sectionId, releaseSnapshotId, locale, title, bodyPlain, summary) {
  const existing = db.prepare(
    'SELECT id FROM search_documents WHERE document_id = ? AND section_id = ? AND locale = ?',
  ).get(documentId, sectionId, locale);

  const now = nowIso();
  const keywords = JSON.stringify([]);

  if (existing) {
    db.prepare(
      `UPDATE search_documents
         SET title = ?, body_plain = ?, summary = ?, updated_at = ?, status = 'active'
       WHERE id = ?`,
    ).run(title, bodyPlain, summary, now, existing.id);
    db.prepare(
      `DELETE FROM search_documents_fts WHERE search_document_id = ?`,
    ).run(existing.id);
    db.prepare(
      `INSERT INTO search_documents_fts(search_document_id, title, body_plain, summary, keywords)
       VALUES(?, ?, ?, ?, ?)`,
    ).run(existing.id, title, bodyPlain, summary ?? '', keywords);
    return existing.id;
  } else {
    const id = makeId('sdoc');
    db.prepare(
      `INSERT INTO search_documents(id, company_id, product_id, document_id, section_id,
         release_snapshot_id, locale, title, body_plain, summary, keywords, status, rank_score, created_at, updated_at)
       VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, ?, ?)`,
    ).run(id, companyId, productId ?? null, documentId, sectionId,
      releaseSnapshotId ?? null, locale, title, bodyPlain, summary ?? null, keywords, now, now);
    db.prepare(
      `INSERT INTO search_documents_fts(search_document_id, title, body_plain, summary, keywords)
       VALUES(?, ?, ?, ?, ?)`,
    ).run(id, title, bodyPlain, summary ?? '', keywords);
    return id;
  }
}

export function reindexDocument({ companyId, documentId, releaseSnapshotId = null, locale = 'en' }) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND company_id = ?').get(documentId, companyId);
  if (!doc) throw Object.assign(new Error('Document not found'), { status: 404 });

  const sections = db.prepare(`
    SELECT s.*, d.product_id
    FROM sections s
    JOIN documents d ON d.id = s.document_id
    WHERE s.document_id = ?
      AND s.status IN ('approved', 'published')
    ORDER BY s.position ASC
  `).all(documentId);

  const insertBatch = db.transaction(() => {
    for (const section of sections) {
      const bodyPlain = htmlToPlain(section.body_html ?? section.html ?? '');
      const sectionTitle = `${doc.title} — ${section.title}`;
      const summary = makeSummary(bodyPlain);
      upsertRow(companyId, section.product_id ?? doc.product_id, documentId,
        section.id, releaseSnapshotId, locale, sectionTitle, bodyPlain, summary);
    }
  });
  insertBatch();
  return { indexed: sections.length };
}

export function reindexProduct({ companyId, productId }) {
  const documents = db.prepare(
    "SELECT * FROM documents WHERE product_id = ? AND company_id = ? AND status IN ('approved','published')",
  ).all(productId, companyId);

  let total = 0;
  for (const doc of documents) {
    const result = reindexDocument({ companyId, documentId: doc.id });
    total += result.indexed;
  }
  return { indexed: total, documents: documents.length };
}

export function removeDocumentFromIndex(documentId) {
  const rows = db.prepare('SELECT id FROM search_documents WHERE document_id = ?').all(documentId);
  for (const row of rows) {
    db.prepare('DELETE FROM search_documents_fts WHERE search_document_id = ?').run(row.id);
  }
  db.prepare('DELETE FROM search_documents WHERE document_id = ?').run(documentId);
}
