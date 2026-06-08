import { db, makeId, nowIso } from '../db.mjs';

export function getLocales(documentId) {
  return db.prepare(
    'SELECT * FROM translation_locales WHERE document_id = ? ORDER BY locale ASC'
  ).all(documentId);
}

export function saveLocale({ companyId, documentId, locale, status, completionPct, reviewer }) {
  const now = nowIso();
  const existing = db.prepare(
    'SELECT id FROM translation_locales WHERE document_id = ? AND locale = ?'
  ).get(documentId, locale);

  const id = existing?.id || makeId('tl');

  db.prepare(`
    INSERT INTO translation_locales(id, company_id, document_id, locale, status, completion_pct, reviewer, created_at, updated_at)
    VALUES(@id, @companyId, @documentId, @locale, @status, @completionPct, @reviewer, @now, @now)
    ON CONFLICT(document_id, locale) DO UPDATE SET
      status = excluded.status,
      completion_pct = excluded.completion_pct,
      reviewer = excluded.reviewer,
      updated_at = excluded.updated_at
  `).run({
    id,
    companyId,
    documentId,
    locale,
    status: status || 'not-started',
    completionPct: completionPct ?? 0,
    reviewer: reviewer ?? null,
    now,
  });

  return db.prepare('SELECT * FROM translation_locales WHERE id = ?').get(id);
}

export function getStrings(sectionId, locale = null) {
  if (locale) {
    return db.prepare(
      'SELECT * FROM translation_strings WHERE section_id = ? AND locale = ?'
    ).all(sectionId, locale);
  }
  return db.prepare(
    'SELECT * FROM translation_strings WHERE section_id = ?'
  ).all(sectionId);
}

export function saveString({ companyId, sectionId, locale, body, state, translatedBy, reviewedBy }) {
  const now = nowIso();
  const existing = db.prepare(
    'SELECT id FROM translation_strings WHERE section_id = ? AND locale = ?'
  ).get(sectionId, locale);

  const id = existing?.id || makeId('ts');

  db.prepare(`
    INSERT INTO translation_strings(id, company_id, section_id, locale, body, state, translated_by, reviewed_by, created_at, updated_at)
    VALUES(@id, @companyId, @sectionId, @locale, @body, @state, @translatedBy, @reviewedBy, @now, @now)
    ON CONFLICT(section_id, locale) DO UPDATE SET
      body = excluded.body,
      state = excluded.state,
      translated_by = excluded.translated_by,
      reviewed_by = excluded.reviewed_by,
      updated_at = excluded.updated_at
  `).run({
    id,
    companyId,
    sectionId,
    locale,
    body: body ?? null,
    state: state || 'dirty',
    translatedBy: translatedBy ?? null,
    reviewedBy: reviewedBy ?? null,
    now,
  });

  return db.prepare('SELECT * FROM translation_strings WHERE id = ?').get(id);
}
