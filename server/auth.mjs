import bcrypt from 'bcrypt';
import { db, makeId, makeToken, nowIso } from './db.mjs';

const BCRYPT_COST = 12;
const SESSION_TTL_HOURS = 24 * 7;
const LOGIN_RATELIMIT_WINDOW_MIN = 15;
const LOGIN_RATELIMIT_MAX_FAILS = 5;
const PASSWORD_MIN_LEN = 12;

// IPs that bypass the failed-login rate limiter.
// Defaults cover loopback (dev tunnel / SSH-forwarded traffic appears as localhost).
// Override with DOCPILOT_RATELIMIT_ALLOWLIST="ip1,ip2,..."
const RATELIMIT_ALLOWLIST = new Set(
  (process.env.DOCPILOT_RATELIMIT_ALLOWLIST || '127.0.0.1,::1,::ffff:127.0.0.1')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean),
);

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export function validatePasswordPolicy(plain) {
  if (typeof plain !== 'string') return 'Password must be a string.';
  if (plain.length < PASSWORD_MIN_LEN) return `Password must be at least ${PASSWORD_MIN_LEN} characters.`;
  const checks = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  if (!checks.every((re) => re.test(plain))) {
    return 'Password must include lowercase, uppercase, digit, and symbol characters.';
  }
  return null;
}

export function findUserByEmail(companyId, email) {
  const stmt = db.prepare(`
    SELECT * FROM users
    WHERE LOWER(email) = LOWER(?)
      AND COALESCE(company_id, '') = COALESCE(?, '')
  `);
  return stmt.get(String(email).trim(), companyId ?? null) ?? null;
}

export function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) ?? null;
}

export function getUserRoles(userId) {
  return db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(userId).map((row) => row.role);
}

export async function createUser({
  email,
  password,
  name,
  surname = null,
  phone = null,
  telegram = null,
  signalUsername = null,
  accountManagerUserId = null,
  companyId = null,
  status = 'active',
  roles = [],
}) {
  const policyError = validatePasswordPolicy(password);
  if (policyError) throw new Error(policyError);
  const hash = await hashPassword(password);
  const id = makeId('usr');
  const now = nowIso();
  db.prepare(`
    INSERT INTO users (id, email, company_id, password_hash, name, surname, phone, telegram, signal_username, account_manager_user_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    String(email).trim(),
    companyId,
    hash,
    String(name).trim(),
    surname ? String(surname).trim() : null,
    phone ? String(phone).trim() : null,
    telegram ? String(telegram).trim() : null,
    signalUsername ? String(signalUsername).trim() : null,
    accountManagerUserId || null,
    status,
    now,
    now,
  );
  if (Array.isArray(roles) && roles.length) {
    const insertRole = db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)');
    for (const role of roles) insertRole.run(id, role);
  }
  return getUserById(id);
}

export function setUserRoles(userId, roles) {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);
    const insert = db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)');
    for (const role of roles) insert.run(userId, role);
  });
  tx();
}

export async function updatePassword(userId, newPassword) {
  const policyError = validatePasswordPolicy(newPassword);
  if (policyError) throw new Error(policyError);
  const hash = await hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(hash, nowIso(), userId);
}

export function recordLoginAttempt({ email, companyId, ip, success }) {
  db.prepare(`
    INSERT INTO login_attempts (email, company_id, ip, success, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(String(email).toLowerCase().trim(), companyId ?? null, String(ip || 'unknown'), success ? 1 : 0, nowIso());
}

export function isRateLimited({ email, ip }) {
  if (ip && RATELIMIT_ALLOWLIST.has(ip)) return false;
  const since = new Date(Date.now() - LOGIN_RATELIMIT_WINDOW_MIN * 60_000).toISOString();
  const row = db.prepare(`
    SELECT COUNT(*) AS fails
    FROM login_attempts
    WHERE success = 0
      AND created_at > ?
      AND (LOWER(email) = LOWER(?) OR ip = ?)
  `).get(since, String(email).trim(), String(ip || 'unknown'));
  return (row?.fails ?? 0) >= LOGIN_RATELIMIT_MAX_FAILS;
}

export function createSession({ userId, companyId, ip, userAgent }) {
  const token = makeToken();
  const now = nowIso();
  const expires = new Date(Date.now() + SESSION_TTL_HOURS * 3600_000).toISOString();
  db.prepare(`
    INSERT INTO sessions (token, user_id, company_id, created_at, expires_at, ip, user_agent, last_used_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(token, userId, companyId ?? null, now, expires, ip ?? null, userAgent ?? null, now);
  return { token, expiresAt: expires };
}

export function getSession(token) {
  if (!token) return null;
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  db.prepare('UPDATE sessions SET last_used_at = ? WHERE token = ?').run(nowIso(), token);
  return row;
}

export function deleteSession(token) {
  if (!token) return;
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  const out = {};
  for (const pair of cookieHeader.split(/;\s*/)) {
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    const k = pair.slice(0, eq).trim();
    const v = pair.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export const SESSION_COOKIE = 'dp_session';

// The Secure flag is gated by DOCPILOT_COOKIE_SECURE. NODE_ENV=production is no
// longer enough — production deployments fronted by plain HTTP (e.g. EC2 by
// public IP, no TLS termination yet) need Secure=false or browsers drop the
// session cookie on the very first navigation and the app loops on the loader.
// Default: off. Set DOCPILOT_COOKIE_SECURE=1 once you've added TLS.
function shouldFlagSecure() {
  const explicit = process.env.DOCPILOT_COOKIE_SECURE;
  if (explicit !== undefined) return explicit === '1' || explicit === 'true';
  return false;
}

export function sessionCookieHeader(token, { expires } = {}) {
  const parts = [`${SESSION_COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (expires) parts.push(`Expires=${new Date(expires).toUTCString()}`);
  if (shouldFlagSecure()) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookieHeader() {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (shouldFlagSecure()) parts.push('Secure');
  return parts.join('; ');
}

export function loadAuthFromRequest(req) {
  const cookies = parseCookies(req.headers?.cookie);
  const token = cookies[SESSION_COOKIE];
  const session = getSession(token);
  if (!session) return { session: null, user: null, roles: [] };
  const user = getUserById(session.user_id);
  if (!user || user.status !== 'active') return { session: null, user: null, roles: [] };
  const roles = getUserRoles(user.id);
  return { session, user, roles };
}

export function hasAnyRole(roles, allowed) {
  if (!allowed || !allowed.length) return true;
  return roles.some((role) => allowed.includes(role));
}

export function isSuperAdmin(roles) {
  return roles.includes('superadmin');
}

export function appendAudit({ companyId, userId, action, entityType, entityId, ip, userAgent, summary, metadata }) {
  db.prepare(`
    INSERT INTO audit_events (company_id, user_id, action, entity_type, entity_id, ip, user_agent, summary, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    companyId ?? null,
    userId ?? null,
    action,
    entityType ?? null,
    entityId ?? null,
    ip ?? null,
    userAgent ?? null,
    summary ?? null,
    metadata ? JSON.stringify(metadata) : null,
    nowIso(),
  );
}
