import { db } from '../db.mjs';
import { makeSnippet } from './extract.mjs';

export function search({ companyId, q, locale = 'en', productId = null, limit = 20 }) {
  if (!q?.trim()) return { items: [], total: 0, query: q ?? '' };

  const ftsQuery = q.trim().split(/\s+/).map((t) => `${t}*`).join(' ');

  const args = [companyId, locale, ftsQuery];
  let productFilter = '';
  if (productId) {
    productFilter = 'AND sd.product_id = ?';
    args.push(productId);
  }
  args.push(limit);

  const rows = db.prepare(`
    SELECT
      sd.id,
      sd.document_id,
      sd.section_id,
      sd.product_id,
      sd.locale,
      sd.title,
      sd.summary,
      sd.body_plain,
      fts.rank
    FROM search_documents sd
    JOIN search_documents_fts fts ON fts.search_document_id = sd.id
    WHERE sd.company_id = ?
      AND sd.locale = ?
      AND sd.status = 'active'
      ${productFilter}
      AND search_documents_fts MATCH ?
    ORDER BY fts.rank
    LIMIT ?
  `).all(...args);

  const items = rows.map((row) => ({
    documentId: row.document_id,
    sectionId: row.section_id,
    productId: row.product_id,
    locale: row.locale,
    title: row.title,
    summary: row.summary,
    snippet: makeSnippet(row.body_plain, q),
    score: Math.round(Math.abs(row.rank) * 100) / 100,
  }));

  return { items, total: items.length, query: q };
}

export function suggest({ companyId, q, locale = 'en', limit = 8 }) {
  if (!q?.trim()) return { suggestions: [] };
  const ftsQuery = `${q.trim()}*`;
  const rows = db.prepare(`
    SELECT DISTINCT sd.title
    FROM search_documents sd
    JOIN search_documents_fts fts ON fts.search_document_id = sd.id
    WHERE sd.company_id = ?
      AND sd.locale = ?
      AND sd.status = 'active'
      AND search_documents_fts MATCH ?
    ORDER BY fts.rank
    LIMIT ?
  `).all(companyId, locale, ftsQuery, limit);
  return { suggestions: rows.map((r) => r.title) };
}
