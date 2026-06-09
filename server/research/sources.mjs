import { makeId, nowIso, db } from '../db.mjs';

const KEY = (cid) => `research_sources_${cid}`;

function read(cid) {
  const row = db.prepare(
    'SELECT value FROM kv_store WHERE company_scope = ? AND key = ?',
  ).get(cid, KEY(cid));
  return row ? Object.values(JSON.parse(row.value)) : [];
}

function write(cid, sources) {
  const map = Object.fromEntries(sources.map((s) => [s.id, s]));
  db.prepare(
    `INSERT INTO kv_store(company_scope, key, value, revision, updated_at)
     VALUES(?, ?, ?, 1, ?)
     ON CONFLICT(company_scope, key) DO UPDATE
       SET value = excluded.value,
           revision = revision + 1,
           updated_at = excluded.updated_at`,
  ).run(cid, KEY(cid), JSON.stringify(map), nowIso());
}

export function list(cid) {
  return read(cid);
}

export function get(cid, id) {
  return read(cid).find((s) => s.id === id) ?? null;
}

export function create(cid, { name, url, type }) {
  if (!name?.trim()) throw Object.assign(new Error('name is required'), { status: 400 });
  if (!url?.trim())  throw Object.assign(new Error('url is required'),  { status: 400 });
  try { new URL(url.trim()); } catch {
    throw Object.assign(new Error('url must be a valid absolute URL'), { status: 400 });
  }
  const source = {
    id: makeId('rsrc'),
    company_id: cid,
    name: name.trim(),
    url: url.trim(),
    type: type === 'docs' ? 'docs' : 'website',
    status: 'pending',
    summary: null,
    concepts: null,
    added_at: nowIso(),
    analyzed_at: null,
  };
  const sources = read(cid);
  sources.push(source);
  write(cid, sources);
  return source;
}

export function markAnalyzing(cid, id) {
  _patch(cid, id, { status: 'analyzing' });
}

export function markReady(cid, id, { summary, concepts }) {
  _patch(cid, id, { status: 'ready', summary, concepts, analyzed_at: nowIso() });
}

export function markFailed(cid, id) {
  _patch(cid, id, { status: 'failed' });
}

export function remove(cid, id) {
  const sources = read(cid).filter((s) => s.id !== id);
  write(cid, sources);
}

function _patch(cid, id, updates) {
  const sources = read(cid);
  const idx = sources.findIndex((s) => s.id === id);
  if (idx >= 0) {
    sources[idx] = { ...sources[idx], ...updates };
    write(cid, sources);
  }
}
