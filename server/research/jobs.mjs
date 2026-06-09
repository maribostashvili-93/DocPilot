import { makeId, nowIso, db } from '../db.mjs';
import * as sources from './sources.mjs';

const KEY = (cid) => `research_jobs_${cid}`;

function read(cid) {
  const row = db.prepare(
    'SELECT value FROM kv_store WHERE company_scope = ? AND key = ?',
  ).get(cid, KEY(cid));
  return row ? Object.values(JSON.parse(row.value)) : [];
}

function write(cid, jobs) {
  const map = Object.fromEntries(jobs.map((j) => [j.id, j]));
  db.prepare(
    `INSERT INTO kv_store(company_scope, key, value, revision, updated_at)
     VALUES(?, ?, ?, 1, ?)
     ON CONFLICT(company_scope, key) DO UPDATE
       SET value = excluded.value,
           revision = revision + 1,
           updated_at = excluded.updated_at`,
  ).run(cid, KEY(cid), JSON.stringify(map), nowIso());
}

function patch(cid, jobId, updates) {
  const jobs = read(cid);
  const idx = jobs.findIndex((j) => j.id === jobId);
  if (idx >= 0) {
    jobs[idx] = { ...jobs[idx], ...updates, updated_at: nowIso() };
    write(cid, jobs);
  }
}

export function list(cid) {
  return read(cid).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function trigger(cid, sourceId) {
  const source = sources.get(cid, sourceId);
  if (!source) throw Object.assign(new Error('Source not found'), { status: 404 });
  if (source.status === 'analyzing') {
    throw Object.assign(new Error('Analysis already running for this source'), { status: 409 });
  }

  const job = {
    id: makeId('job'),
    company_id: cid,
    source_id: sourceId,
    source_name: source.name,
    status: 'running',
    error: null,
    result: null,
    created_at: nowIso(),
    updated_at: nowIso(),
    completed_at: null,
  };

  const jobs = read(cid);
  jobs.push(job);
  write(cid, jobs);

  sources.markAnalyzing(cid, sourceId);

  // Fire-and-forget — intentionally not awaited
  _runAnalysis(cid, job.id, source).catch((err) => {
    patch(cid, job.id, { status: 'failed', error: err.message });
    sources.markFailed(cid, sourceId);
  });

  return job;
}

async function _runAnalysis(cid, jobId, source) {
  // Stub: 2-second simulated analysis.
  // Replace with real URL fetch + Claude API call in Phase 5B/8B.
  await new Promise((r) => setTimeout(r, 2000));

  const concepts = ['documentation', 'API reference', 'user guide', 'getting started', 'integration'];
  const summary = `Analysis complete. Key concepts and document structure extracted from ${source.url ?? source.name}.`;

  sources.markReady(cid, source.id, { summary, concepts });
  patch(cid, jobId, {
    status: 'completed',
    completed_at: nowIso(),
    result: { summary, concepts },
  });
}
