import { db, nowIso } from './db.mjs';

// ─── Role default baselines ───────────────────────────────────────────────────
// '*' = all actions. 'product.*' = all product.* actions.
const ROLE_DEFAULTS = {
  superadmin: ['*'],

  'company-admin': [
    'product.*', 'document.*', 'section.*', 'media.*',
    'user.view', 'user.invite', 'user.edit',
    'settings.view', 'settings.edit',
  ],

  editor: [
    'product.view',
    'document.view', 'document.create', 'document.edit',
    'section.view', 'section.create', 'section.edit', 'section.comment',
    'translation.view',
    'media.view', 'media.upload', 'media.edit',
  ],

  reviewer: [
    'document.view', 'document.review', 'document.approve',
    'section.view', 'section.comment', 'section.review', 'section.approve',
    'translation.view', 'translation.review',
  ],

  viewer: [
    'product.view', 'document.view', 'section.view',
    'translation.view', 'release.view', 'media.view',
  ],

  partner: [
    'document.view', 'section.view', 'section.comment',
    'translation.view',
  ],

  tam: [
    'product.view',
    'document.view', 'document.edit', 'document.review',
    'section.view', 'section.edit', 'section.comment', 'section.review',
    'translation.view', 'translation.edit',
    'release.view', 'release.create',
  ],

  developer: [
    'document.view', 'document.edit',
    'section.view', 'section.edit',
    'media.view', 'media.upload', 'media.edit',
    'settings.view',
    'integration.view', 'integration.manage',
  ],

  'account-manager': [
    'product.view', 'document.view', 'section.view',
  ],
};

export const ALL_ACTIONS = [
  'product.view',    'product.create',  'product.edit',
  'product.archive', 'product.manage',

  'document.view',   'document.create', 'document.edit',
  'document.review', 'document.approve','document.archive',

  'section.view',    'section.create',  'section.edit',
  'section.comment', 'section.review',  'section.approve',
  'section.delete',

  'translation.view','translation.edit','translation.review',
  'translation.publish',

  'release.view',    'release.create',  'release.review',
  'release.approve', 'release.stage',   'release.publish',
  'release.rollback',

  'media.view',      'media.upload',    'media.edit',
  'media.delete',    'media.replace',

  'user.view',       'user.invite',     'user.edit',
  'user.deactivate', 'access.manage',

  'settings.view',   'settings.edit',
  'integration.view','integration.manage',
  'webhook.manage',  'api-key.manage',
];

/**
 * Check if user (with given roles array) can perform action.
 *
 * @param {object} user       — users row from DB
 * @param {string[]} roles    — user's roles
 * @param {string} action     — e.g. 'document.edit'
 * @param {string} scopeType  — 'tenant' | 'product' | 'document'
 * @param {string|null} scopeId — product_id or document_id (null = tenant-wide)
 */
export function can(user, roles, action, scopeType = 'tenant', scopeId = null) {
  if (!user || !action) return false;

  if (roles.includes('superadmin')) return true;

  const [resource] = action.split('.');

  // role default baseline
  for (const role of roles) {
    const grants = ROLE_DEFAULTS[role] ?? [];
    if (grants.includes('*'))             return true;
    if (grants.includes(action))          return true;
    if (grants.includes(`${resource}.*`)) return true;
  }

  // explicit permission_grants rows (scoped overrides)
  const placeholders = roles.length ? roles.map(() => '?').join(',') : "'__none__'";
  const row = db.prepare(`
    SELECT id FROM permission_grants
    WHERE company_id = ?
      AND (user_id = ? OR role IN (${placeholders}))
      AND action = ?
      AND (scope_id IS NULL OR scope_id = ?)
      AND (expires_at IS NULL OR expires_at > ?)
    LIMIT 1
  `).get(
    user.company_id,
    user.id,
    ...roles,
    action,
    scopeId,
    nowIso(),
  );

  return !!row;
}

/**
 * Returns a middleware that checks can() and sends 403 if denied.
 * Usage: router.put('/path', requireCan('document.edit'), handler)
 */
export function requireCan(action, scopeType = 'tenant', getScopeId = () => null) {
  return function(req, res, next) {
    const { user, roles } = req.auth ?? {};
    if (!user) return _send403(res, 'Not authenticated');
    const scopeId = getScopeId(req);
    if (!can(user, roles, action, scopeType, scopeId)) {
      return _send403(res, `Missing permission: ${action}`);
    }
    next?.();
  };
}

function _send403(res, message) {
  res.writeHead(403, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}
