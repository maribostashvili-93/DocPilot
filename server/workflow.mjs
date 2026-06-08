import { db, makeId, nowIso } from './db.mjs';

// ─── Allowed transitions ──────────────────────────────────────────────────────
const TRANSITIONS = {
  product: {
    draft:     ['review'],
    review:    ['published', 'archived'],
    published: ['review', 'archived'],
  },
  document: {
    draft:     ['review'],
    review:    ['draft', 'approved'],
    approved:  ['draft', 'published'],
    published: ['review', 'archived'],
    archived:  ['draft'],
  },
  section: {
    draft:    ['review'],
    review:   ['draft', 'approved'],
    approved: ['draft', 'published'],
    published:['draft', 'archived'],
  },
  'translation-locale': {
    'not-started': ['in-progress'],
    'in-progress': ['review'],
    review:        ['in-progress', 'published'],
    published:     ['in-progress'],
  },
  release: {
    draft:    ['review'],
    review:   ['draft', 'approved'],
    approved: ['staged'],
    staged:   ['approved', 'published'],
    published:['rolled-back'],
  },
};

const TABLE_MAP = {
  product:             'products',
  document:            'documents',
  section:             'sections',
  release:             'releases',
  'translation-locale':'translation_locales',
};

export function validateTransition(entityType, from, to) {
  const allowed = TRANSITIONS[entityType]?.[from] ?? [];
  if (!allowed.includes(to)) {
    const err = new Error(
      `Invalid transition: ${entityType} ${from} → ${to}. Allowed: ${allowed.join(', ') || 'none'}`
    );
    err.code = 'INVALID_TRANSITION';
    err.statusCode = 422;
    throw err;
  }
}

// Returns string[] of blocking issue messages. Empty = no blocks.
export function checkBlockingRules(entityType, entityId) {
  const issues = [];

  if (entityType === 'section') {
    const s = db.prepare('SELECT * FROM sections WHERE id = ?').get(entityId);
    if (!s) return ['Section not found'];
    if (!s.title?.trim())  issues.push('Section title is empty');
    if (s.has_unsafe_html) issues.push('Section contains unsafe HTML — clear the flag before approving');
    if (!s.reviewer)       issues.push('Section has no assigned reviewer');
    const blocking = db.prepare(
      'SELECT COUNT(*) as n FROM comments WHERE section_id = ? AND is_blocking = 1 AND resolved = 0'
    ).get(entityId);
    if (blocking.n > 0) issues.push(`${blocking.n} unresolved blocking comment(s) remain`);
  }

  if (entityType === 'document') {
    const d = db.prepare('SELECT * FROM documents WHERE id = ?').get(entityId);
    if (!d) return ['Document not found'];
    if (d.has_unsafe_html) issues.push('Document contains unsafe HTML');
    if (!d.reviewer)       issues.push('Document has no assigned reviewer');
    const pending = db.prepare(
      "SELECT COUNT(*) as n FROM sections WHERE document_id = ? AND status IN ('draft', 'review')"
    ).get(entityId);
    if (pending.n > 0)
      issues.push(`${pending.n} section(s) still in draft or review — all must be approved first`);
  }

  if (entityType === 'release') {
    const r = db.prepare('SELECT * FROM releases WHERE id = ?').get(entityId);
    if (!r) return ['Release not found'];
    if (!r.notes?.trim()) issues.push('Release notes are empty');
    if (!r.reviewer)      issues.push('Release has no assigned reviewer');
    const locales = db.prepare(
      'SELECT locale, completion_pct FROM translation_locales WHERE document_id = ?'
    ).all(r.document_id);
    const below = locales.filter(l => l.completion_pct < 90);
    if (below.length > 0)
      issues.push(`Translation incomplete: ${below.map(l => `${l.locale} ${l.completion_pct}%`).join(', ')} (min 90%)`);
  }

  return issues;
}

export function recordTransition(entityType, entityId, from, to, actorId, note = null) {
  const table = TABLE_MAP[entityType];
  if (!table) throw new Error(`Unknown entity type: ${entityType}`);
  const entity = db.prepare(`SELECT company_id FROM ${table} WHERE id = ?`).get(entityId);
  if (!entity) throw new Error(`${entityType} ${entityId} not found`);

  db.prepare(`
    INSERT INTO workflow_transitions(id, company_id, entity_type, entity_id, from_status, to_status, actor_id, note, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(makeId('wt'), entity.company_id, entityType, entityId, from, to, actorId, note ?? null, nowIso());
}

/**
 * Full pipeline: validate → check blocking (for forward moves) → update status → record.
 */
export function applyTransition(entityType, entityId, to, actorId, note = null) {
  const table = TABLE_MAP[entityType];
  if (!table) {
    const err = new Error(`Unknown entity type: ${entityType}`);
    err.statusCode = 400;
    throw err;
  }

  const entity = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(entityId);
  if (!entity) {
    const err = new Error(`${entityType} not found`);
    err.statusCode = 404;
    throw err;
  }

  const from = entity.status;
  validateTransition(entityType, from, to);

  const forwardTargets = ['approved', 'published', 'staged'];
  if (forwardTargets.includes(to)) {
    const issues = checkBlockingRules(entityType, entityId);
    if (issues.length > 0) {
      const err = new Error(`Transition blocked: ${issues.join('; ')}`);
      err.code = 'TRANSITION_BLOCKED';
      err.issues = issues;
      err.statusCode = 422;
      throw err;
    }
  }

  db.transaction(() => {
    db.prepare(`UPDATE ${table} SET status = ?, updated_at = ? WHERE id = ?`)
      .run(to, nowIso(), entityId);
    recordTransition(entityType, entityId, from, to, actorId, note);
  })();

  return { entityType, entityId, from, to };
}

export function getTransitionHistory(entityType, entityId) {
  return db.prepare(`
    SELECT wt.*, u.name as actor_name, u.email as actor_email
    FROM workflow_transitions wt
    LEFT JOIN users u ON u.id = wt.actor_id
    WHERE wt.entity_type = ? AND wt.entity_id = ?
    ORDER BY wt.created_at ASC
  `).all(entityType, entityId);
}
