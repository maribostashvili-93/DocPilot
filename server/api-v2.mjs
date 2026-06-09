// /api/v2/* — secure multi-tenant API. Server-enforced auth + RBAC + tenant boundary.

import crypto from 'node:crypto';
import {
  hashPassword, verifyPassword, validatePasswordPolicy,
  findUserByEmail, getUserById, getUserRoles, createUser, setUserRoles, updatePassword,
  recordLoginAttempt, isRateLimited,
  createSession, deleteSession,
  parseCookies, sessionCookieHeader, clearSessionCookieHeader,
  loadAuthFromRequest, hasAnyRole, isSuperAdmin, appendAudit,
} from './auth.mjs';
import { db, makeId, makeSlug, nowIso } from './db.mjs';
import { can } from './authz.mjs';
import { applyTransition, getTransitionHistory, checkBlockingRules } from './workflow.mjs';
import * as productAdapter     from './adapter/products.mjs';
import * as documentAdapter    from './adapter/documents.mjs';
import * as sectionAdapter     from './adapter/sections.mjs';
import * as translationAdapter from './adapter/translations.mjs';
import * as releaseAdapter     from './adapter/releases.mjs';
import * as researchSources    from './research/sources.mjs';
import * as researchJobs       from './research/jobs.mjs';
import * as researchDrafts     from './research/drafts.mjs';
import * as searchQuery        from './search/query.mjs';
import * as searchIndexer      from './search/indexer.mjs';

function send(res, status, body, extraHeaders = {}) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'content-type, cookie',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    ...extraHeaders,
  };
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch (err) { reject(new Error('Invalid JSON body.')); }
    });
    req.on('error', reject);
  });
}

function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString().split(',')[0].trim();
}

function findCompanyBySlug(slug) {
  if (!slug) return null;
  return db.prepare('SELECT * FROM companies WHERE slug = ?').get(String(slug)) ?? null;
}

function loadAuthWithApiKey(req) {
  const base = loadAuthFromRequest(req);
  if (base.user) return base;
  const authHeader = req.headers['authorization'] ?? '';
  if (authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.slice(7);
    const keyHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const key = db.prepare(
      'SELECT * FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL',
    ).get(keyHash);
    if (key) {
      db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(nowIso(), key.id);
      return {
        session: null,
        user: { id: `apikey:${key.id}`, company_id: key.company_id, _isApiKey: true },
        roles: ['api-key'],
      };
    }
  }
  return base;
}

function companyById(id) {
  if (!id) return null;
  return db.prepare('SELECT * FROM companies WHERE id = ?').get(id) ?? null;
}

function companyBrandingPayload(companyId) {
  const row = db.prepare('SELECT * FROM company_branding WHERE company_id = ?').get(companyId);
  return row ?? null;
}

function publicCompanyPayload(company) {
  if (!company) return null;
  const branding = companyBrandingPayload(company.id);
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    status: company.status,
    branding: branding && {
      logoUrl: branding.logo_url,
      primaryColor: branding.primary_color,
      accentColor: branding.accent_color,
      heroTitle: branding.hero_title,
      heroSubtitle: branding.hero_subtitle,
      footerText: branding.footer_text,
      description: branding.description,
    },
  };
}

function accountManagerSummary(amUserId) {
  if (!amUserId) return null;
  const am = db.prepare('SELECT id, name, surname, email, phone, telegram, signal_username FROM users WHERE id = ? AND status = ?').get(amUserId, 'active');
  if (!am) return null;
  return {
    id: am.id,
    name: am.name,
    surname: am.surname,
    email: am.email,
    phone: am.phone,
    telegram: am.telegram,
    signalUsername: am.signal_username,
  };
}

function userPayload(user, roles) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    surname: user.surname,
    phone: user.phone,
    telegram: user.telegram,
    signalUsername: user.signal_username,
    status: user.status,
    companyId: user.company_id,
    roles: roles ?? getUserRoles(user.id),
    lastLoginAt: user.last_login_at,
    accountManagerUserId: user.account_manager_user_id,
    accountManager: accountManagerSummary(user.account_manager_user_id),
    stagingCardEnabled: user.staging_card_enabled === 0 ? false : true,
  };
}

async function routeAuthLogin(req, res) {
  const body = await readBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const companySlug = body.companySlug ? String(body.companySlug).trim() : '';
  const ip = getIp(req);

  if (!email || !password) return send(res, 400, { error: 'Email and password required.' });

  if (isRateLimited({ email, ip })) {
    appendAudit({ action: 'login.ratelimit', summary: `Login rate-limited for ${email}`, ip, userAgent: req.headers['user-agent'] });
    return send(res, 429, { error: 'Too many attempts. Please wait 15 minutes.' });
  }

  let companyId = null;
  if (companySlug) {
    const company = findCompanyBySlug(companySlug);
    if (!company) {
      recordLoginAttempt({ email, ip, success: false });
      return send(res, 401, { error: 'Invalid credentials.' });
    }
    if (company.status !== 'active') {
      return send(res, 403, { error: 'Company access is suspended.' });
    }
    companyId = company.id;
  }

  const user = findUserByEmail(companyId, email);
  if (!user || user.status !== 'active') {
    recordLoginAttempt({ email, companyId, ip, success: false });
    appendAudit({ companyId, action: 'login.fail', summary: `Unknown user ${email}`, ip });
    return send(res, 401, { error: 'Invalid credentials.' });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    recordLoginAttempt({ email, companyId, ip, success: false });
    appendAudit({ companyId, userId: user.id, action: 'login.fail', summary: `Bad password for ${email}`, ip });
    return send(res, 401, { error: 'Invalid credentials.' });
  }

  recordLoginAttempt({ email, companyId, ip, success: true });
  const session = createSession({ userId: user.id, companyId, ip, userAgent: req.headers['user-agent'] });
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(nowIso(), user.id);
  appendAudit({ companyId, userId: user.id, action: 'login.success', summary: `Login from ${ip}`, ip, userAgent: req.headers['user-agent'] });

  const roles = getUserRoles(user.id);
  const cookie = sessionCookieHeader(session.token, { expires: session.expiresAt });
  return send(res, 200, {
    ok: true,
    user: userPayload(user, roles),
    company: publicCompanyPayload(companyById(companyId)),
    expiresAt: session.expiresAt,
  }, { 'set-cookie': cookie });
}

function routeAuthLogout(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies['dp_session'];
  if (token) {
    const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    if (session) {
      appendAudit({ companyId: session.company_id, userId: session.user_id, action: 'logout', ip: getIp(req) });
    }
    deleteSession(token);
  }
  return send(res, 200, { ok: true }, { 'set-cookie': clearSessionCookieHeader() });
}

function routeAuthMe(req, res) {
  const { session, user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Not authenticated.' });
  const company = user.company_id ? publicCompanyPayload(companyById(user.company_id)) : null;
  return send(res, 200, { user: userPayload(user, roles), company, expiresAt: session?.expires_at });
}

// SUPERADMIN — companies CRUD
async function routeCompaniesList(req, res) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user || !isSuperAdmin(roles)) return send(res, 403, { error: 'Forbidden.' });
  const rows = db.prepare('SELECT * FROM companies ORDER BY created_at DESC').all();
  return send(res, 200, { companies: rows.map((row) => publicCompanyPayload(row)) });
}

async function routeCompanyCreate(req, res) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user || !isSuperAdmin(roles)) return send(res, 403, { error: 'Forbidden.' });
  const body = await readBody(req);
  const name = String(body.name || '').trim();
  if (!name) return send(res, 400, { error: 'Company name required.' });
  const slug = makeSlug();
  const id = makeId('co');
  const now = nowIso();
  db.prepare(`
    INSERT INTO companies (id, slug, name, status, created_at, updated_at)
    VALUES (?, ?, ?, 'active', ?, ?)
  `).run(id, slug, name, now, now);
  db.prepare(`
    INSERT INTO company_branding (company_id, primary_color, accent_color, hero_title, hero_subtitle, description, footer_text, updated_at)
    VALUES (?, '#ff1b23', '#63cdff', ?, ?, ?, ?, ?)
  `).run(id, `${name} Documentation`, 'Welcome. Sign in to access your client area.', `${name} client area on DocPilot.`, `${name} · Hosted by DocPilot`, now);
  appendAudit({ userId: user.id, action: 'company.create', entityType: 'company', entityId: id, summary: `Created company ${name}`, ip: getIp(req) });
  return send(res, 201, { company: publicCompanyPayload(companyById(id)) });
}

const SLUG_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{5,63}$/;

async function routeCompanyUpdate(req, res, companyId) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user || !isSuperAdmin(roles)) return send(res, 403, { error: 'Forbidden.' });
  const existing = companyById(companyId);
  if (!existing) return send(res, 404, { error: 'Company not found.' });
  const body = await readBody(req);

  const fields = [];
  const values = [];
  const changes = [];

  if (typeof body.name === 'string') {
    const next = body.name.trim();
    if (!next) return send(res, 400, { error: 'Name cannot be empty.' });
    if (next !== existing.name) {
      fields.push('name = ?');
      values.push(next);
      changes.push(`name: ${existing.name} → ${next}`);
    }
  }

  if (typeof body.status === 'string') {
    const next = body.status.trim();
    if (!['active', 'suspended', 'archived'].includes(next)) {
      return send(res, 400, { error: 'Invalid status. Must be active, suspended, or archived.' });
    }
    if (next !== existing.status) {
      fields.push('status = ?');
      values.push(next);
      changes.push(`status: ${existing.status} → ${next}`);
    }
  }

  if (typeof body.slug === 'string') {
    const next = body.slug.trim();
    if (next !== existing.slug) {
      if (!SLUG_RE.test(next)) {
        return send(res, 400, { error: 'Slug must be 6–64 chars, alphanumeric/underscore/dash, and start with a letter or digit.' });
      }
      const collision = db.prepare('SELECT id FROM companies WHERE slug = ? AND id != ?').get(next, companyId);
      if (collision) return send(res, 409, { error: 'Slug already in use by another company.' });
      fields.push('slug = ?');
      values.push(next);
      changes.push(`slug: ${existing.slug} → ${next}`);
    }
  }

  if (!fields.length) return send(res, 200, { company: publicCompanyPayload(existing), unchanged: true });

  fields.push('updated_at = ?');
  values.push(nowIso());
  values.push(companyId);
  db.prepare(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  appendAudit({
    userId: user.id,
    action: 'company.update',
    entityType: 'company',
    entityId: companyId,
    summary: changes.join(' · ') || 'Updated company',
    metadata: { changes },
    ip: getIp(req),
  });
  return send(res, 200, { company: publicCompanyPayload(companyById(companyId)) });
}

async function routeCompanyDelete(req, res, companyId) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user || !isSuperAdmin(roles)) return send(res, 403, { error: 'Forbidden.' });
  db.prepare('UPDATE companies SET status = ?, updated_at = ? WHERE id = ?').run('archived', nowIso(), companyId);
  appendAudit({ userId: user.id, action: 'company.archive', entityType: 'company', entityId: companyId, summary: `Archived company`, ip: getIp(req) });
  return send(res, 200, { ok: true });
}

// Branding update (superadmin OR company-admin in this company)
async function routeBrandingUpdate(req, res, companyId) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Not authenticated.' });
  const canEdit = isSuperAdmin(roles) || (user.company_id === companyId && hasAnyRole(roles, ['company-admin']));
  if (!canEdit) return send(res, 403, { error: 'Forbidden.' });
  const body = await readBody(req);
  const allowed = ['logo_url', 'primary_color', 'accent_color', 'hero_title', 'hero_subtitle', 'footer_text', 'description'];
  const fields = [];
  const values = [];
  for (const f of allowed) {
    const camelKey = f.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (typeof body[camelKey] === 'string') {
      fields.push(`${f} = ?`);
      values.push(body[camelKey]);
    }
  }
  if (!fields.length) return send(res, 400, { error: 'No fields to update.' });
  fields.push('updated_at = ?');
  values.push(nowIso());
  values.push(companyId);
  db.prepare(`UPDATE company_branding SET ${fields.join(', ')} WHERE company_id = ?`).run(...values);
  appendAudit({ userId: user.id, companyId, action: 'branding.update', entityType: 'company', entityId: companyId, summary: 'Branding updated', ip: getIp(req) });
  return send(res, 200, { branding: companyBrandingPayload(companyId) });
}

// Public-by-slug: returns minimal branding for the login page render (no PII)
async function routePublicCompanyBranding(req, res, slug) {
  const company = findCompanyBySlug(slug);
  if (!company) return send(res, 404, { error: 'Not found.' });
  if (company.status !== 'active') return send(res, 404, { error: 'Not found.' });
  return send(res, 200, { company: publicCompanyPayload(company) }, {
    'x-robots-tag': 'noindex, nofollow',
  });
}

// USERS — superadmin or company-admin scope
async function routeUsersList(req, res, companyId) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Not authenticated.' });
  const canRead = isSuperAdmin(roles) || (user.company_id === companyId && hasAnyRole(roles, ['company-admin']));
  if (!canRead) return send(res, 403, { error: 'Forbidden.' });
  const rows = db.prepare('SELECT * FROM users WHERE company_id = ? ORDER BY created_at DESC').all(companyId);
  return send(res, 200, { users: rows.map((u) => userPayload(u)) });
}

async function routeUserCreate(req, res, companyId) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Not authenticated.' });
  const canCreate = isSuperAdmin(roles) || (user.company_id === companyId && hasAnyRole(roles, ['company-admin']));
  if (!canCreate) return send(res, 403, { error: 'Forbidden.' });
  const body = await readBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const surname = typeof body.surname === 'string' ? body.surname.trim() : null;
  const phone = typeof body.phone === 'string' ? body.phone.trim() : null;
  const telegram = typeof body.telegram === 'string' ? body.telegram.trim() : null;
  const signalUsername = typeof body.signalUsername === 'string' ? body.signalUsername.trim() : null;
  const password = String(body.password || '');
  const userRoles = Array.isArray(body.roles) ? body.roles : ['viewer'];
  if (!email || !name) return send(res, 400, { error: 'Email and name required.' });
  const policyError = validatePasswordPolicy(password);
  if (policyError) return send(res, 400, { error: policyError });

  // Optional accountManagerUserId — must be a user in the same company with 'account-manager' role.
  let amId = null;
  if (typeof body.accountManagerUserId === 'string' && body.accountManagerUserId) {
    const am = getUserById(body.accountManagerUserId);
    if (!am || am.company_id !== companyId) return send(res, 400, { error: 'Assigned account manager not in this company.' });
    if (!getUserRoles(am.id).includes('account-manager')) return send(res, 400, { error: 'Assigned user is not an account manager.' });
    amId = am.id;
  }

  try {
    const created = await createUser({
      email, password, name, surname, phone, telegram, signalUsername,
      accountManagerUserId: amId,
      companyId, status: 'active', roles: userRoles,
    });
    appendAudit({ userId: user.id, companyId, action: 'user.create', entityType: 'user', entityId: created.id, summary: `Created ${created.email}`, ip: getIp(req) });
    return send(res, 201, { user: userPayload(created) });
  } catch (err) {
    return send(res, 400, { error: err.message || 'Could not create user.' });
  }
}

async function routeUserUpdate(req, res, companyId, userId) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Not authenticated.' });
  const canUpdate = isSuperAdmin(roles) || (user.company_id === companyId && hasAnyRole(roles, ['company-admin']));
  if (!canUpdate) return send(res, 403, { error: 'Forbidden.' });
  const target = getUserById(userId);
  if (!target || target.company_id !== companyId) return send(res, 404, { error: 'User not found.' });
  const body = await readBody(req);
  if (typeof body.name === 'string') db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(body.name, nowIso(), userId);
  if (typeof body.surname === 'string') db.prepare('UPDATE users SET surname = ?, updated_at = ? WHERE id = ?').run(body.surname.trim() || null, nowIso(), userId);
  if (typeof body.phone === 'string') db.prepare('UPDATE users SET phone = ?, updated_at = ? WHERE id = ?').run(body.phone.trim() || null, nowIso(), userId);
  if (typeof body.telegram === 'string') db.prepare('UPDATE users SET telegram = ?, updated_at = ? WHERE id = ?').run(body.telegram.trim() || null, nowIso(), userId);
  if (typeof body.signalUsername === 'string') db.prepare('UPDATE users SET signal_username = ?, updated_at = ? WHERE id = ?').run(body.signalUsername.trim() || null, nowIso(), userId);
  if (typeof body.status === 'string') db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(body.status, nowIso(), userId);
  if (Array.isArray(body.roles)) setUserRoles(userId, body.roles);
  if (Object.prototype.hasOwnProperty.call(body, 'stagingCardEnabled')) {
    const enabled = body.stagingCardEnabled === false || body.stagingCardEnabled === 0 ? 0 : 1;
    db.prepare('UPDATE users SET staging_card_enabled = ?, updated_at = ? WHERE id = ?').run(enabled, nowIso(), userId);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'accountManagerUserId')) {
    const raw = body.accountManagerUserId;
    if (raw === null || raw === '') {
      db.prepare('UPDATE users SET account_manager_user_id = NULL, updated_at = ? WHERE id = ?').run(nowIso(), userId);
    } else if (typeof raw === 'string') {
      const am = getUserById(raw);
      if (!am || am.company_id !== companyId) return send(res, 400, { error: 'Assigned account manager not in this company.' });
      if (!getUserRoles(am.id).includes('account-manager')) return send(res, 400, { error: 'Assigned user is not an account manager.' });
      if (am.id === userId) return send(res, 400, { error: 'A user cannot be their own account manager.' });
      db.prepare('UPDATE users SET account_manager_user_id = ?, updated_at = ? WHERE id = ?').run(am.id, nowIso(), userId);
    }
  }
  if (typeof body.password === 'string' && body.password.length) {
    try { await updatePassword(userId, body.password); }
    catch (err) { return send(res, 400, { error: err.message }); }
  }
  appendAudit({ userId: user.id, companyId, action: 'user.update', entityType: 'user', entityId: userId, summary: 'User updated', ip: getIp(req) });
  return send(res, 200, { user: userPayload(getUserById(userId)) });
}

// List active account-managers in a company — used by the assignment dropdown.
async function routeAccountManagersList(req, res, companyId) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Not authenticated.' });
  const canRead = isSuperAdmin(roles) || (user.company_id === companyId && hasAnyRole(roles, ['company-admin']));
  if (!canRead) return send(res, 403, { error: 'Forbidden.' });
  const rows = db.prepare(`
    SELECT u.id, u.name, u.surname, u.email, u.phone, u.telegram, u.signal_username
    FROM users u
    JOIN user_roles r ON r.user_id = u.id
    WHERE u.company_id = ? AND u.status = 'active' AND r.role = 'account-manager'
    ORDER BY u.name COLLATE NOCASE
  `).all(companyId);
  return send(res, 200, {
    accountManagers: rows.map((r) => ({
      id: r.id,
      name: r.name,
      surname: r.surname,
      email: r.email,
      phone: r.phone,
      telegram: r.telegram,
      signalUsername: r.signal_username,
    })),
  });
}

async function routeUserDelete(req, res, companyId, userId) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Not authenticated.' });
  const canDelete = isSuperAdmin(roles) || (user.company_id === companyId && hasAnyRole(roles, ['company-admin']));
  if (!canDelete) return send(res, 403, { error: 'Forbidden.' });
  if (userId === user.id) return send(res, 400, { error: 'Cannot delete your own account.' });
  db.prepare('DELETE FROM users WHERE id = ? AND company_id = ?').run(userId, companyId);
  appendAudit({ userId: user.id, companyId, action: 'user.delete', entityType: 'user', entityId: userId, ip: getIp(req) });
  return send(res, 200, { ok: true });
}

// Audit log (superadmin or company-admin scope)
function routeAuditList(req, res, companyId) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Not authenticated.' });
  const canRead = isSuperAdmin(roles) || (user.company_id === companyId && hasAnyRole(roles, ['company-admin']));
  if (!canRead) return send(res, 403, { error: 'Forbidden.' });
  const rows = db.prepare('SELECT * FROM audit_events WHERE company_id = ? OR (? IS NULL AND company_id IS NULL) ORDER BY created_at DESC LIMIT 500')
    .all(companyId, companyId);
  return send(res, 200, { events: rows });
}

// ROUTE DISPATCHER
export async function handleApiV2(req, res, url) {
  if (req.method === 'OPTIONS') return send(res, 204, {});

  const p = url.pathname;

  // Auth
  if (p === '/api/v2/auth/login' && req.method === 'POST') return routeAuthLogin(req, res);
  if (p === '/api/v2/auth/logout' && req.method === 'POST') return routeAuthLogout(req, res);
  if (p === '/api/v2/auth/me' && req.method === 'GET') return routeAuthMe(req, res);

  // Public-by-slug branding (anyone hitting /c/:slug)
  let m = p.match(/^\/api\/v2\/public\/companies\/([A-Za-z0-9_-]+)\/branding$/);
  if (m && req.method === 'GET') return routePublicCompanyBranding(req, res, m[1]);

  // Superadmin scope
  if (p === '/api/v2/companies' && req.method === 'GET') return routeCompaniesList(req, res);
  if (p === '/api/v2/companies' && req.method === 'POST') return routeCompanyCreate(req, res);

  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)$/);
  if (m) {
    if (req.method === 'PUT') return routeCompanyUpdate(req, res, m[1]);
    if (req.method === 'DELETE') return routeCompanyDelete(req, res, m[1]);
  }

  // Branding update
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/branding$/);
  if (m && req.method === 'PUT') return routeBrandingUpdate(req, res, m[1]);

  // Account managers list (scoped to company) — used by the assignment dropdown.
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/account-managers$/);
  if (m && req.method === 'GET') return routeAccountManagersList(req, res, m[1]);

  // Users (scoped to company)
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/users$/);
  if (m) {
    if (req.method === 'GET') return routeUsersList(req, res, m[1]);
    if (req.method === 'POST') return routeUserCreate(req, res, m[1]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/users\/([A-Za-z0-9_-]+)$/);
  if (m) {
    if (req.method === 'PUT') return routeUserUpdate(req, res, m[1], m[2]);
    if (req.method === 'DELETE') return routeUserDelete(req, res, m[1], m[2]);
  }

  // Audit log
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/audit$/);
  if (m && req.method === 'GET') return routeAuditList(req, res, m[1]);

  // ─── CONTENT ROUTES ───────────────────────────────────────────────────────

  // Products
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/products$/);
  if (m) {
    if (req.method === 'GET')  return routeProductsList(req, res, m[1]);
    if (req.method === 'POST') return routeProductCreate(req, res, m[1]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/products\/([A-Za-z0-9_-]+)$/);
  if (m) {
    if (req.method === 'GET')    return routeProductGet(req, res, m[1], m[2]);
    if (req.method === 'PUT')    return routeProductUpdate(req, res, m[1], m[2]);
    if (req.method === 'DELETE') return routeProductDelete(req, res, m[1], m[2]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/products\/([A-Za-z0-9_-]+)\/status$/);
  if (m && req.method === 'PUT') return routeProductTransition(req, res, m[1], m[2]);

  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/products\/([A-Za-z0-9_-]+)\/members$/);
  if (m) {
    if (req.method === 'GET')  return routeProductMembersList(req, res, m[1], m[2]);
    if (req.method === 'POST') return routeProductMemberAdd(req, res, m[1], m[2]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/products\/([A-Za-z0-9_-]+)\/members\/([A-Za-z0-9_-]+)$/);
  if (m && req.method === 'DELETE') return routeProductMemberRemove(req, res, m[1], m[2], m[3]);

  // Documents
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/products\/([A-Za-z0-9_-]+)\/documents$/);
  if (m) {
    if (req.method === 'GET')  return routeDocumentsList(req, res, m[1], m[2]);
    if (req.method === 'POST') return routeDocumentCreate(req, res, m[1], m[2]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/documents\/([A-Za-z0-9_-]+)$/);
  if (m) {
    if (req.method === 'GET')    return routeDocumentGet(req, res, m[1], m[2]);
    if (req.method === 'PUT')    return routeDocumentUpdate(req, res, m[1], m[2]);
    if (req.method === 'DELETE') return routeDocumentDelete(req, res, m[1], m[2]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/documents\/([A-Za-z0-9_-]+)\/transition$/);
  if (m && req.method === 'POST') return routeDocumentTransition(req, res, m[1], m[2]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/documents\/([A-Za-z0-9_-]+)\/transitions$/);
  if (m && req.method === 'GET')  return routeDocumentTransitionHistory(req, res, m[1], m[2]);

  // Translation locales
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/documents\/([A-Za-z0-9_-]+)\/translation-locales$/);
  if (m && req.method === 'GET') return routeTranslationLocalesList(req, res, m[1], m[2]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/documents\/([A-Za-z0-9_-]+)\/translation-locales\/([A-Za-z0-9_-]+)\/status$/);
  if (m && req.method === 'PUT') return routeTranslationLocaleStatus(req, res, m[1], m[2], m[3]);

  // Sections
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/documents\/([A-Za-z0-9_-]+)\/sections$/);
  if (m) {
    if (req.method === 'GET')  return routeSectionsList(req, res, m[1], m[2]);
    if (req.method === 'POST') return routeSectionCreate(req, res, m[1], m[2]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/sections\/([A-Za-z0-9_-]+)$/);
  if (m) {
    if (req.method === 'GET')    return routeSectionGet(req, res, m[1], m[2]);
    if (req.method === 'PUT')    return routeSectionUpdate(req, res, m[1], m[2]);
    if (req.method === 'DELETE') return routeSectionDelete(req, res, m[1], m[2]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/sections\/([A-Za-z0-9_-]+)\/transition$/);
  if (m && req.method === 'POST') return routeSectionTransition(req, res, m[1], m[2]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/sections\/([A-Za-z0-9_-]+)\/transitions$/);
  if (m && req.method === 'GET')  return routeSectionTransitionHistory(req, res, m[1], m[2]);

  // Section comments
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/sections\/([A-Za-z0-9_-]+)\/comments$/);
  if (m) {
    if (req.method === 'GET')  return routeCommentsList(req, res, m[1], m[2]);
    if (req.method === 'POST') return routeCommentCreate(req, res, m[1], m[2]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/comments\/([A-Za-z0-9_-]+)\/resolve$/);
  if (m && req.method === 'PUT') return routeCommentResolve(req, res, m[1], m[2]);

  // Translation strings
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/sections\/([A-Za-z0-9_-]+)\/translation-strings$/);
  if (m && req.method === 'GET') return routeTranslationStringsList(req, res, m[1], m[2]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/sections\/([A-Za-z0-9_-]+)\/translation-strings\/([A-Za-z0-9_-]+)$/);
  if (m && req.method === 'PUT') return routeTranslationStringSave(req, res, m[1], m[2], m[3]);

  // Releases
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/products\/([A-Za-z0-9_-]+)\/releases$/);
  if (m) {
    if (req.method === 'GET')  return routeReleasesList(req, res, m[1], m[2]);
    if (req.method === 'POST') return routeReleaseCreate(req, res, m[1], m[2]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/releases\/([A-Za-z0-9_-]+)$/);
  if (m) {
    if (req.method === 'GET') return routeReleaseGet(req, res, m[1], m[2]);
    if (req.method === 'PUT') return routeReleaseUpdate(req, res, m[1], m[2]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/releases\/([A-Za-z0-9_-]+)\/transition$/);
  if (m && req.method === 'POST') return routeReleaseTransition(req, res, m[1], m[2]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/releases\/([A-Za-z0-9_-]+)\/rollback$/);
  if (m && req.method === 'POST') return routeReleaseRollback(req, res, m[1], m[2]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/releases\/([A-Za-z0-9_-]+)\/readiness$/);
  if (m && req.method === 'GET') return routeReleaseReadiness(req, res, m[1], m[2]);

  // Research
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/research\/sources$/);
  if (m) {
    if (req.method === 'GET')  return routeResearchSourcesList(req, res, m[1]);
    if (req.method === 'POST') return routeResearchSourceCreate(req, res, m[1]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/research\/sources\/([A-Za-z0-9_-]+)$/);
  if (m) {
    if (req.method === 'GET')    return routeResearchSourceGet(req, res, m[1], m[2]);
    if (req.method === 'DELETE') return routeResearchSourceDelete(req, res, m[1], m[2]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/research\/sources\/([A-Za-z0-9_-]+)\/analyze$/);
  if (m && req.method === 'POST') return routeResearchSourceAnalyze(req, res, m[1], m[2]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/research\/sources\/([A-Za-z0-9_-]+)\/generate-draft$/);
  if (m && req.method === 'POST') return routeResearchGenerateDraft(req, res, m[1], m[2]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/research\/jobs$/);
  if (m && req.method === 'GET') return routeResearchJobsList(req, res, m[1]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/research\/drafts$/);
  if (m) {
    if (req.method === 'GET')  return routeResearchDraftsList(req, res, m[1]);
    if (req.method === 'POST') return routeResearchDraftCreate(req, res, m[1]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/research\/drafts\/([A-Za-z0-9_-]+)\/send-to-cms$/);
  if (m && req.method === 'POST') return routeResearchDraftSendToCms(req, res, m[1], m[2]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/research\/drafts\/([A-Za-z0-9_-]+)\/discard$/);
  if (m && req.method === 'POST') return routeResearchDraftDiscard(req, res, m[1], m[2]);

  // API Keys
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/api-keys$/);
  if (m) {
    if (req.method === 'GET')  return routeApiKeysList(req, res, m[1]);
    if (req.method === 'POST') return routeApiKeyCreate(req, res, m[1]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/api-keys\/([A-Za-z0-9_-]+)\/revoke$/);
  if (m && req.method === 'POST') return routeApiKeyRevoke(req, res, m[1], m[2]);

  // Webhooks
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/webhooks$/);
  if (m) {
    if (req.method === 'GET')  return routeWebhooksList(req, res, m[1]);
    if (req.method === 'POST') return routeWebhookCreate(req, res, m[1]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/webhooks\/([A-Za-z0-9_-]+)$/);
  if (m) {
    if (req.method === 'DELETE') return routeWebhookDelete(req, res, m[1], m[2]);
    if (req.method === 'PUT')    return routeWebhookUpdate(req, res, m[1], m[2]);
  }
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/webhooks\/([A-Za-z0-9_-]+)\/deliveries$/);
  if (m && req.method === 'GET') return routeWebhookDeliveries(req, res, m[1], m[2]);

  // Search
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/search$/);
  if (m && req.method === 'GET') return routeSearch(req, res, m[1]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/search\/suggest$/);
  if (m && req.method === 'GET') return routeSearchSuggest(req, res, m[1]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/search\/reindex\/document\/([A-Za-z0-9_-]+)$/);
  if (m && req.method === 'POST') return routeReindexDocument(req, res, m[1], m[2]);
  m = p.match(/^\/api\/v2\/companies\/([A-Za-z0-9_-]+)\/search\/reindex\/product\/([A-Za-z0-9_-]+)$/);
  if (m && req.method === 'POST') return routeReindexProduct(req, res, m[1], m[2]);

  return null; // signal unhandled — fall through to legacy router
}

// ─── CONTENT ROUTE HANDLERS ───────────────────────────────────────────────────

function requireTenantMatch(user, roles, cid) {
  return isSuperAdmin(roles) || user.company_id === cid;
}

// ─── Products ────────────────────────────────────────────────────────────────

function routeProductsList(req, res, cid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'product.view')) return send(res, 403, { error: 'Forbidden' });
  const url2 = new URL(req.url, 'http://x');
  const products = productAdapter.list(cid, { status: url2.searchParams.get('status') || undefined });
  return send(res, 200, { products });
}

function routeProductGet(req, res, cid, pid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'product.view')) return send(res, 403, { error: 'Forbidden' });
  const product = productAdapter.get(pid);
  if (!product || product.company_id !== cid) return send(res, 404, { error: 'Not found' });
  return send(res, 200, { product });
}

async function routeProductCreate(req, res, cid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'product.create')) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  if (!body.name?.trim()) return send(res, 400, { error: 'name is required' });
  const product = productAdapter.save({
    company_id: cid,
    name: body.name.trim(),
    studio: body.studio ?? null,
    status: 'draft',
    description: body.description ?? null,
    version: body.version ?? null,
    nav_order: body.nav_order ?? 1,
  }, user.id);
  return send(res, 201, { product });
}

async function routeProductUpdate(req, res, cid, pid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'product.edit')) return send(res, 403, { error: 'Forbidden' });
  const existing = productAdapter.get(pid);
  if (!existing || existing.company_id !== cid) return send(res, 404, { error: 'Not found' });
  const body = await readBody(req);
  const updated = productAdapter.save({ ...existing, ...body, id: pid, company_id: cid }, user.id);
  return send(res, 200, { product: updated });
}

function routeProductDelete(req, res, cid, pid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'product.archive')) return send(res, 403, { error: 'Forbidden' });
  const ok = productAdapter.remove(pid, user.id);
  if (!ok) return send(res, 404, { error: 'Not found' });
  return send(res, 200, { ok: true });
}

async function routeProductTransition(req, res, cid, pid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  if (!body.status) return send(res, 400, { error: 'status is required' });
  try {
    const result = applyTransition('product', pid, body.status, user.id, body.note ?? null);
    return send(res, 200, { transition: result });
  } catch (err) {
    return send(res, err.statusCode ?? 500, { error: err.message, issues: err.issues ?? [] });
  }
}

// ─── Product members ──────────────────────────────────────────────────────────

function routeProductMembersList(req, res, cid, pid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'product.view')) return send(res, 403, { error: 'Forbidden' });
  const members = db.prepare(`
    SELECT pm.*, u.name, u.email, gb.name as granted_by_name
    FROM product_members pm
    JOIN users u ON u.id = pm.user_id
    LEFT JOIN users gb ON gb.id = pm.granted_by
    WHERE pm.product_id = ?
    ORDER BY pm.granted_at ASC
  `).all(pid);
  return send(res, 200, { members });
}

async function routeProductMemberAdd(req, res, cid, pid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'product.manage')) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  if (!body.userId || !body.role) return send(res, 400, { error: 'userId and role are required' });
  db.prepare(`
    INSERT INTO product_members(id, product_id, user_id, role, granted_by, granted_at)
    VALUES(?, ?, ?, ?, ?, ?)
    ON CONFLICT(product_id, user_id) DO UPDATE SET role = excluded.role, granted_by = excluded.granted_by, granted_at = excluded.granted_at
  `).run(makeId('pm'), pid, body.userId, body.role, user.id, nowIso());
  return send(res, 201, { ok: true });
}

function routeProductMemberRemove(req, res, cid, pid, uid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'product.manage')) return send(res, 403, { error: 'Forbidden' });
  db.prepare('DELETE FROM product_members WHERE product_id = ? AND user_id = ?').run(pid, uid);
  return send(res, 200, { ok: true });
}

// ─── Documents ────────────────────────────────────────────────────────────────

function routeDocumentsList(req, res, cid, pid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'document.view')) return send(res, 403, { error: 'Forbidden' });
  const url2 = new URL(req.url, 'http://x');
  const documents = documentAdapter.list(cid, {
    productId: pid,
    status: url2.searchParams.get('status') || undefined,
  });
  return send(res, 200, { documents });
}

function routeDocumentGet(req, res, cid, did) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'document.view')) return send(res, 403, { error: 'Forbidden' });
  const document = documentAdapter.get(did);
  if (!document || document.company_id !== cid) return send(res, 404, { error: 'Not found' });
  return send(res, 200, { document });
}

async function routeDocumentCreate(req, res, cid, pid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'document.create')) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  if (!body.title?.trim()) return send(res, 400, { error: 'title is required' });
  const document = documentAdapter.save({
    company_id: cid,
    product_id: pid,
    title: body.title.trim(),
    type: body.type ?? null,
    status: 'draft',
    version: body.version ?? null,
    description: body.description ?? null,
    audience: body.audience ?? null,
    taxonomy: body.taxonomy ?? null,
    nav_order: body.nav_order ?? null,
    owner: user.id,
  }, user.id);
  return send(res, 201, { document });
}

async function routeDocumentUpdate(req, res, cid, did) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'document.edit')) return send(res, 403, { error: 'Forbidden' });
  const existing = documentAdapter.get(did);
  if (!existing || existing.company_id !== cid) return send(res, 404, { error: 'Not found' });
  const body = await readBody(req);
  const updated = documentAdapter.save({ ...existing, ...body, id: did, company_id: cid }, user.id);
  return send(res, 200, { document: updated });
}

function routeDocumentDelete(req, res, cid, did) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'document.archive')) return send(res, 403, { error: 'Forbidden' });
  const ok = documentAdapter.remove(did, user.id);
  if (!ok) return send(res, 404, { error: 'Not found' });
  return send(res, 200, { ok: true });
}

async function routeDocumentTransition(req, res, cid, did) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  if (!body.to) return send(res, 400, { error: 'to is required' });
  const actionMap = { review: 'document.review', approved: 'document.approve', draft: 'document.edit', archived: 'document.archive' };
  const required = actionMap[body.to] ?? 'document.edit';
  if (!can(user, roles, required)) return send(res, 403, { error: 'Forbidden' });
  try {
    const result = applyTransition('document', did, body.to, user.id, body.note ?? null);
    return send(res, 200, { transition: result });
  } catch (err) {
    return send(res, err.statusCode ?? 500, { error: err.message, issues: err.issues ?? [] });
  }
}

function routeDocumentTransitionHistory(req, res, cid, did) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'document.view')) return send(res, 403, { error: 'Forbidden' });
  return send(res, 200, { transitions: getTransitionHistory('document', did) });
}

// ─── Translation locales ──────────────────────────────────────────────────────

function routeTranslationLocalesList(req, res, cid, did) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'translation.view')) return send(res, 403, { error: 'Forbidden' });
  return send(res, 200, { locales: translationAdapter.getLocales(did) });
}

async function routeTranslationLocaleStatus(req, res, cid, did, locale) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'translation.edit')) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  const updated = translationAdapter.saveLocale({
    companyId: cid, documentId: did, locale,
    status: body.status ?? 'in-progress',
    completionPct: body.completionPct ?? 0,
    reviewer: body.reviewer ?? null,
  });
  return send(res, 200, { locale: updated });
}

// ─── Sections ────────────────────────────────────────────────────────────────

function routeSectionsList(req, res, cid, did) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'section.view')) return send(res, 403, { error: 'Forbidden' });
  return send(res, 200, { sections: sectionAdapter.listByDocument(did) });
}

function routeSectionGet(req, res, cid, sid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'section.view')) return send(res, 403, { error: 'Forbidden' });
  const section = sectionAdapter.get(sid);
  if (!section || section.company_id !== cid) return send(res, 404, { error: 'Not found' });
  return send(res, 200, { section });
}

async function routeSectionCreate(req, res, cid, did) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'section.create')) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  const section = sectionAdapter.save({
    company_id: cid,
    document_id: did,
    title: body.title ?? null,
    summary: body.summary ?? null,
    html: body.html ?? null,
    number: body.number ?? null,
    slug: body.slug ?? null,
    status: 'draft',
    owner: user.id,
    position: body.position ?? 0,
  }, user.id);
  return send(res, 201, { section });
}

async function routeSectionUpdate(req, res, cid, sid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'section.edit')) return send(res, 403, { error: 'Forbidden' });
  const existing = sectionAdapter.get(sid);
  if (!existing || existing.company_id !== cid) return send(res, 404, { error: 'Not found' });
  const body = await readBody(req);
  const updated = sectionAdapter.save({ ...existing, ...body, id: sid, company_id: cid }, user.id);
  return send(res, 200, { section: updated });
}

function routeSectionDelete(req, res, cid, sid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'section.delete')) return send(res, 403, { error: 'Forbidden' });
  const ok = sectionAdapter.remove(sid, user.id);
  if (!ok) return send(res, 404, { error: 'Not found' });
  return send(res, 200, { ok: true });
}

async function routeSectionTransition(req, res, cid, sid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  if (!body.to) return send(res, 400, { error: 'to is required' });
  const actionMap = { review: 'section.review', approved: 'section.approve', draft: 'section.edit' };
  const required = actionMap[body.to] ?? 'section.edit';
  if (!can(user, roles, required)) return send(res, 403, { error: 'Forbidden' });
  try {
    const result = applyTransition('section', sid, body.to, user.id, body.note ?? null);
    return send(res, 200, { transition: result });
  } catch (err) {
    return send(res, err.statusCode ?? 500, { error: err.message, issues: err.issues ?? [] });
  }
}

function routeSectionTransitionHistory(req, res, cid, sid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'section.view')) return send(res, 403, { error: 'Forbidden' });
  return send(res, 200, { transitions: getTransitionHistory('section', sid) });
}

// ─── Section comments ─────────────────────────────────────────────────────────

function routeCommentsList(req, res, cid, sid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'section.view')) return send(res, 403, { error: 'Forbidden' });
  const comments = db.prepare(`
    SELECT c.*, u.name as author_name, u.email as author_email,
           rb.name as resolved_by_name
    FROM comments c
    LEFT JOIN users u ON u.id = c.author_id
    LEFT JOIN users rb ON rb.id = c.resolved_by
    WHERE c.section_id = ?
    ORDER BY c.created_at ASC
  `).all(sid);
  return send(res, 200, { comments });
}

async function routeCommentCreate(req, res, cid, sid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'section.comment')) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  if (!body.body?.trim()) return send(res, 400, { error: 'body is required' });
  const now = nowIso();
  const comment = {
    id: makeId('cmt'),
    company_id: cid,
    section_id: sid,
    author_id: user.id,
    body: body.body.trim(),
    is_blocking: body.isBlocking ? 1 : 0,
    resolved: 0,
    resolved_by: null,
    resolved_at: null,
    parent_id: body.parentId ?? null,
    created_at: now,
    updated_at: now,
  };
  db.prepare(`
    INSERT INTO comments(id, company_id, section_id, author_id, body, is_blocking, resolved, resolved_by, resolved_at, parent_id, created_at, updated_at)
    VALUES(@id, @company_id, @section_id, @author_id, @body, @is_blocking, @resolved, @resolved_by, @resolved_at, @parent_id, @created_at, @updated_at)
  `).run(comment);
  return send(res, 201, { comment });
}

async function routeCommentResolve(req, res, cid, coid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'section.comment')) return send(res, 403, { error: 'Forbidden' });
  const now = nowIso();
  const result = db.prepare(
    'UPDATE comments SET resolved = 1, resolved_by = ?, resolved_at = ?, updated_at = ? WHERE id = ? AND company_id = ?'
  ).run(user.id, now, now, coid, cid);
  if (!result.changes) return send(res, 404, { error: 'Comment not found' });
  return send(res, 200, { ok: true });
}

// ─── Translation strings ──────────────────────────────────────────────────────

function routeTranslationStringsList(req, res, cid, sid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'translation.view')) return send(res, 403, { error: 'Forbidden' });
  const url2 = new URL(req.url, 'http://x');
  const locale = url2.searchParams.get('locale') || null;
  return send(res, 200, { strings: translationAdapter.getStrings(sid, locale) });
}

async function routeTranslationStringSave(req, res, cid, sid, locale) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'translation.edit')) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  const string = translationAdapter.saveString({
    companyId: cid, sectionId: sid, locale,
    body: body.body ?? null,
    state: body.state ?? 'dirty',
    translatedBy: user.id,
    reviewedBy: null,
  });
  return send(res, 200, { string });
}

// ─── Releases ────────────────────────────────────────────────────────────────

function routeReleasesList(req, res, cid, pid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'release.view')) return send(res, 403, { error: 'Forbidden' });
  const url2 = new URL(req.url, 'http://x');
  const releases = releaseAdapter.list(cid, {
    productId: pid,
    status: url2.searchParams.get('status') || undefined,
  });
  return send(res, 200, { releases });
}

function routeReleaseGet(req, res, cid, rid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'release.view')) return send(res, 403, { error: 'Forbidden' });
  const release = releaseAdapter.get(rid);
  if (!release || release.company_id !== cid) return send(res, 404, { error: 'Not found' });
  return send(res, 200, { release });
}

async function routeReleaseCreate(req, res, cid, pid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'release.create')) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  if (!body.version?.trim()) return send(res, 400, { error: 'version is required' });
  if (!body.documentId) return send(res, 400, { error: 'documentId is required' });
  const release = releaseAdapter.save({
    company_id: cid,
    product_id: pid,
    document_id: body.documentId,
    version: body.version.trim(),
    label: body.label ?? null,
    status: 'draft',
    notes: body.notes ?? null,
    environment: body.environment ?? null,
    reviewer: body.reviewer ?? null,
  }, user.id);
  return send(res, 201, { release });
}

async function routeReleaseUpdate(req, res, cid, rid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  const existing = releaseAdapter.get(rid);
  if (!existing || existing.company_id !== cid) return send(res, 404, { error: 'Not found' });
  const body = await readBody(req);
  const updated = releaseAdapter.save({ ...existing, ...body, id: rid, company_id: cid }, user.id);
  return send(res, 200, { release: updated });
}

async function routeReleaseTransition(req, res, cid, rid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  if (!body.to) return send(res, 400, { error: 'to is required' });
  const actionMap = { review: 'release.review', approved: 'release.approve', staged: 'release.stage', published: 'release.publish' };
  const required = actionMap[body.to] ?? 'release.review';
  if (!can(user, roles, required)) return send(res, 403, { error: 'Forbidden' });
  try {
    const result = applyTransition('release', rid, body.to, user.id, body.note ?? null);
    return send(res, 200, { transition: result });
  } catch (err) {
    return send(res, err.statusCode ?? 500, { error: err.message, issues: err.issues ?? [] });
  }
}

async function routeReleaseRollback(req, res, cid, rid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'release.rollback')) return send(res, 403, { error: 'Forbidden' });
  const release = releaseAdapter.get(rid);
  if (!release || release.company_id !== cid) return send(res, 404, { error: 'Not found' });
  try {
    const result = applyTransition('release', rid, 'rolled-back', user.id, 'Manual rollback');
    return send(res, 200, { transition: result });
  } catch (err) {
    return send(res, err.statusCode ?? 500, { error: err.message, issues: err.issues ?? [] });
  }
}

function routeReleaseReadiness(req, res, cid, rid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'release.view')) return send(res, 403, { error: 'Forbidden' });

  const release = releaseAdapter.get(rid);
  if (!release || release.company_id !== cid) return send(res, 404, { error: 'Not found' });

  const sections = db.prepare(
    'SELECT * FROM sections WHERE document_id = ?'
  ).all(release.document_id);
  const totalSections    = sections.length;
  const approvedSections = sections.filter(s => s.status === 'approved').length;
  const hasUnsafeHtml    = sections.some(s => s.has_unsafe_html);
  const hasNotes         = !!release.notes?.trim();
  const hasSnapshot      = !!release.snapshot_id;
  const hasReviewer      = !!release.reviewer;

  const locales = db.prepare(
    'SELECT * FROM translation_locales WHERE document_id = ?'
  ).all(release.document_id);
  const below = locales.filter(l => l.completion_pct < 90);
  const translationOk = below.length === 0;

  const issues = checkBlockingRules('release', rid);

  return send(res, 200, {
    readiness: {
      sectionsApproved:     { total: totalSections, approved: approvedSections, ok: approvedSections === totalSections && totalSections > 0 },
      translationThreshold: { ok: translationOk, locales: locales.map(l => ({ locale: l.locale, pct: l.completion_pct })) },
      releaseNotes:         { ok: hasNotes },
      snapshot:             { ok: hasSnapshot },
      unsafeHtml:           { ok: !hasUnsafeHtml },
      reviewer:             { ok: hasReviewer },
      overallReady:         approvedSections === totalSections && totalSections > 0 && !hasUnsafeHtml && hasNotes && translationOk && hasReviewer,
      blockingIssues:       issues,
    },
  });
}

// ─── Research ─────────────────────────────────────────────────────────────────

function routeResearchSourcesList(req, res, cid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  return send(res, 200, { sources: researchSources.list(cid) });
}

async function routeResearchSourceCreate(req, res, cid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  try {
    const source = researchSources.create(cid, { name: body.name, url: body.url, type: body.type });
    return send(res, 201, { source });
  } catch (e) {
    return send(res, e.status ?? 400, { error: e.message });
  }
}

function routeResearchSourceGet(req, res, cid, sid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  const source = researchSources.get(cid, sid);
  if (!source) return send(res, 404, { error: 'Not found' });
  return send(res, 200, { source });
}

function routeResearchSourceDelete(req, res, cid, sid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!researchSources.get(cid, sid)) return send(res, 404, { error: 'Not found' });
  researchSources.remove(cid, sid);
  return send(res, 204, null);
}

async function routeResearchSourceAnalyze(req, res, cid, sid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  try {
    const job = await researchJobs.trigger(cid, sid);
    return send(res, 202, { job });
  } catch (e) {
    return send(res, e.status ?? 500, { error: e.message });
  }
}

async function routeResearchGenerateDraft(req, res, cid, sid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  const source = researchSources.get(cid, sid);
  if (!source) return send(res, 404, { error: 'Not found' });
  if (source.status !== 'ready') return send(res, 422, { error: 'Source must be analyzed before generating a draft' });
  const content = researchDrafts.generateContent(source);
  try {
    const draft = researchDrafts.create(cid, { title: `Draft from ${source.name}`, sourceId: sid, content });
    return send(res, 201, { draft });
  } catch (e) {
    return send(res, e.status ?? 500, { error: e.message });
  }
}

function routeResearchJobsList(req, res, cid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  return send(res, 200, { jobs: researchJobs.list(cid) });
}

function routeResearchDraftsList(req, res, cid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  return send(res, 200, { drafts: researchDrafts.list(cid) });
}

async function routeResearchDraftCreate(req, res, cid) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  try {
    const draft = researchDrafts.create(cid, { title: body.title, sourceId: body.sourceId ?? null, content: body.content });
    return send(res, 201, { draft });
  } catch (e) {
    return send(res, e.status ?? 400, { error: e.message });
  }
}

async function routeResearchDraftSendToCms(req, res, cid, did) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  try {
    const result = await researchDrafts.sendToCms(cid, did, body.productId, user.id);
    return send(res, 200, result);
  } catch (e) {
    return send(res, e.status ?? 500, { error: e.message });
  }
}

async function routeResearchDraftDiscard(req, res, cid, did) {
  const { user, roles } = loadAuthFromRequest(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  try {
    const draft = researchDrafts.discard(cid, did);
    return send(res, 200, { draft });
  } catch (e) {
    return send(res, e.status ?? 500, { error: e.message });
  }
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

function safeKeyPayload(key) {
  const { key_hash, ...safe } = key;
  void key_hash;
  return safe;
}

function routeApiKeysList(req, res, cid) {
  const { user, roles } = loadAuthWithApiKey(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'settings.view')) return send(res, 403, { error: 'Forbidden' });
  const keys = db.prepare(
    'SELECT * FROM api_keys WHERE company_id = ? ORDER BY created_at DESC',
  ).all(cid);
  return send(res, 200, { apiKeys: keys.map(safeKeyPayload) });
}

async function routeApiKeyCreate(req, res, cid) {
  const { user, roles } = loadAuthWithApiKey(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'settings.edit')) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  if (!body.name?.trim()) return send(res, 400, { error: 'name is required' });

  const rawToken = `dpk_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const keyPrefix = rawToken.slice(0, 10);
  const id = makeId('apk');
  db.prepare(
    `INSERT INTO api_keys(id, company_id, name, key_hash, key_prefix, scopes, created_by, created_at)
     VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, cid, body.name.trim(), keyHash, keyPrefix,
    JSON.stringify(body.scopes ?? ['*']), user.id, nowIso());

  const key = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id);
  return send(res, 201, { apiKey: safeKeyPayload(key), token: rawToken });
}

function routeApiKeyRevoke(req, res, cid, kid) {
  const { user, roles } = loadAuthWithApiKey(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'settings.edit')) return send(res, 403, { error: 'Forbidden' });
  const key = db.prepare('SELECT * FROM api_keys WHERE id = ? AND company_id = ?').get(kid, cid);
  if (!key) return send(res, 404, { error: 'Not found' });
  if (key.revoked_at) return send(res, 422, { error: 'Already revoked' });
  db.prepare('UPDATE api_keys SET revoked_at = ? WHERE id = ?').run(nowIso(), kid);
  return send(res, 200, { revoked: true });
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

function safeWebhookPayload(ep) {
  const { secret, ...safe } = ep;
  void secret;
  return { ...safe, events: JSON.parse(ep.events) };
}

function routeWebhooksList(req, res, cid) {
  const { user, roles } = loadAuthWithApiKey(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'settings.view')) return send(res, 403, { error: 'Forbidden' });
  const endpoints = db.prepare(
    'SELECT * FROM webhook_endpoints WHERE company_id = ? ORDER BY created_at DESC',
  ).all(cid);
  return send(res, 200, { webhooks: endpoints.map(safeWebhookPayload) });
}

async function routeWebhookCreate(req, res, cid) {
  const { user, roles } = loadAuthWithApiKey(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'settings.edit')) return send(res, 403, { error: 'Forbidden' });
  const body = await readBody(req);
  if (!body.url?.trim()) return send(res, 400, { error: 'url is required' });
  try { new URL(body.url.trim()); } catch { return send(res, 400, { error: 'url must be a valid absolute URL' }); }

  const id = makeId('whk');
  const secret = crypto.randomBytes(24).toString('hex');
  const now = nowIso();
  db.prepare(
    `INSERT INTO webhook_endpoints(id, company_id, url, secret, events, active, created_by, created_at, updated_at)
     VALUES(?, ?, ?, ?, ?, 1, ?, ?, ?)`,
  ).run(id, cid, body.url.trim(), secret,
    JSON.stringify(body.events ?? ['*']), user.id, now, now);

  const ep = db.prepare('SELECT * FROM webhook_endpoints WHERE id = ?').get(id);
  return send(res, 201, { webhook: safeWebhookPayload(ep), secret });
}

function routeWebhookDelete(req, res, cid, eid) {
  const { user, roles } = loadAuthWithApiKey(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'settings.edit')) return send(res, 403, { error: 'Forbidden' });
  const ep = db.prepare('SELECT * FROM webhook_endpoints WHERE id = ? AND company_id = ?').get(eid, cid);
  if (!ep) return send(res, 404, { error: 'Not found' });
  db.prepare('DELETE FROM webhook_endpoints WHERE id = ?').run(eid);
  return send(res, 204, null);
}

async function routeWebhookUpdate(req, res, cid, eid) {
  const { user, roles } = loadAuthWithApiKey(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'settings.edit')) return send(res, 403, { error: 'Forbidden' });
  const ep = db.prepare('SELECT * FROM webhook_endpoints WHERE id = ? AND company_id = ?').get(eid, cid);
  if (!ep) return send(res, 404, { error: 'Not found' });
  const body = await readBody(req);
  db.prepare(
    'UPDATE webhook_endpoints SET active = ?, events = ?, updated_at = ? WHERE id = ?',
  ).run(
    body.active !== undefined ? (body.active ? 1 : 0) : ep.active,
    body.events ? JSON.stringify(body.events) : ep.events,
    nowIso(), eid,
  );
  const updated = db.prepare('SELECT * FROM webhook_endpoints WHERE id = ?').get(eid);
  return send(res, 200, { webhook: safeWebhookPayload(updated) });
}

function routeWebhookDeliveries(req, res, cid, eid) {
  const { user, roles } = loadAuthWithApiKey(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'settings.view')) return send(res, 403, { error: 'Forbidden' });
  const ep = db.prepare('SELECT * FROM webhook_endpoints WHERE id = ? AND company_id = ?').get(eid, cid);
  if (!ep) return send(res, 404, { error: 'Not found' });
  const deliveries = db.prepare(
    'SELECT * FROM webhook_deliveries WHERE endpoint_id = ? ORDER BY delivered_at DESC LIMIT 50',
  ).all(eid);
  return send(res, 200, { deliveries });
}

// ─── Search ───────────────────────────────────────────────────────────────────

function routeSearch(req, res, cid) {
  const { user, roles } = loadAuthWithApiKey(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  const url2 = new URL(req.url, 'http://x');
  const q = url2.searchParams.get('q') ?? '';
  const locale = url2.searchParams.get('locale') || 'en';
  const productId = url2.searchParams.get('productId') || null;
  try {
    const result = searchQuery.search({ companyId: cid, q, locale, productId });
    return send(res, 200, result);
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}

function routeSearchSuggest(req, res, cid) {
  const { user, roles } = loadAuthWithApiKey(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  const url2 = new URL(req.url, 'http://x');
  const q = url2.searchParams.get('q') ?? '';
  const locale = url2.searchParams.get('locale') || 'en';
  try {
    const result = searchQuery.suggest({ companyId: cid, q, locale });
    return send(res, 200, result);
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}

function routeReindexDocument(req, res, cid, did) {
  const { user, roles } = loadAuthWithApiKey(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'document.publish')) return send(res, 403, { error: 'Forbidden' });
  try {
    const result = searchIndexer.reindexDocument({ companyId: cid, documentId: did });
    return send(res, 200, result);
  } catch (e) {
    return send(res, e.status ?? 500, { error: e.message });
  }
}

function routeReindexProduct(req, res, cid, pid) {
  const { user, roles } = loadAuthWithApiKey(req);
  if (!user) return send(res, 401, { error: 'Unauthorized' });
  if (!requireTenantMatch(user, roles, cid)) return send(res, 403, { error: 'Forbidden' });
  if (!can(user, roles, 'product.manage')) return send(res, 403, { error: 'Forbidden' });
  try {
    const result = searchIndexer.reindexProduct({ companyId: cid, productId: pid });
    return send(res, 200, result);
  } catch (e) {
    return send(res, e.status ?? 500, { error: e.message });
  }
}
