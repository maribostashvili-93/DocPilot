// SuperAdmin shell — me-as-admin tools for managing companies, cross-company
// users, and security audit. Mounted at /admin/v2/* by App.tsx. Uses nested
// <Routes> so URL drives page selection (back/forward + deep links work).

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import PasswordField from './PasswordField';
import './password-field.css';
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  ApiError,
  apiFetch,
  authLogin,
  authLogout,
  authMe,
} from './api';
import type { AuthUser, AuthSessionResponse, PublicCompany } from './api';
import './superadmin.css';

// ---------- Local types ----------
interface CompaniesListResponse {
  companies: PublicCompany[];
}
interface CompanyResponse {
  company: PublicCompany;
}
interface ManagedUser {
  id: string;
  email: string;
  name: string;
  status: string;
  companyId: string | null;
  roles: string[];
  lastLoginAt: string | null;
}
interface UsersListResponse {
  users: ManagedUser[];
}
interface UserResponse {
  user: ManagedUser;
}
interface AuditEvent {
  id: string;
  user_id: string | null;
  company_id: string | null;
  action: string;
  summary: string | null;
  entity_type: string | null;
  entity_id: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}
interface AuditListResponse {
  events: AuditEvent[];
}

type Toast = { id: number; kind: 'success' | 'error'; message: string };

// ---------- Helpers ----------
function isSuperAdmin(roles: string[] | undefined): boolean {
  if (!roles) return false;
  return roles.includes('superadmin') || roles.includes('super-admin');
}
function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}
function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

// ---------- API wrappers (typed) ----------
async function fetchCompanies(): Promise<PublicCompany[]> {
  const data = await apiFetch<CompaniesListResponse>('/api/v2/companies');
  return data.companies;
}
async function createCompany(name: string): Promise<PublicCompany> {
  const data = await apiFetch<CompanyResponse>('/api/v2/companies', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return data.company;
}
async function updateCompany(
  id: string,
  patch: { name?: string; status?: string; slug?: string },
): Promise<PublicCompany> {
  const data = await apiFetch<CompanyResponse>(
    `/api/v2/companies/${encodeURIComponent(id)}`,
    { method: 'PUT', body: JSON.stringify(patch) },
  );
  return data.company;
}
async function archiveCompany(id: string): Promise<void> {
  await apiFetch<{ ok: true }>(`/api/v2/companies/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
async function updateBranding(
  id: string,
  patch: Record<string, string>,
): Promise<unknown> {
  return apiFetch(`/api/v2/companies/${encodeURIComponent(id)}/branding`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}
async function fetchUsers(companyId: string): Promise<ManagedUser[]> {
  const data = await apiFetch<UsersListResponse>(
    `/api/v2/companies/${encodeURIComponent(companyId)}/users`,
  );
  return data.users;
}
async function createUser(
  companyId: string,
  body: { email: string; name: string; password: string; roles: string[] },
): Promise<ManagedUser> {
  const data = await apiFetch<UserResponse>(
    `/api/v2/companies/${encodeURIComponent(companyId)}/users`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return data.user;
}
async function updateUser(
  companyId: string,
  userId: string,
  patch: { name?: string; status?: string; roles?: string[]; password?: string },
): Promise<ManagedUser> {
  const data = await apiFetch<UserResponse>(
    `/api/v2/companies/${encodeURIComponent(companyId)}/users/${encodeURIComponent(userId)}`,
    { method: 'PUT', body: JSON.stringify(patch) },
  );
  return data.user;
}
async function deleteUser(companyId: string, userId: string): Promise<void> {
  await apiFetch<{ ok: true }>(
    `/api/v2/companies/${encodeURIComponent(companyId)}/users/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  );
}
async function fetchAudit(companyId: string): Promise<AuditEvent[]> {
  const data = await apiFetch<AuditListResponse>(
    `/api/v2/companies/${encodeURIComponent(companyId)}/audit`,
  );
  return data.events;
}

// ---------- Toast context (inlined via prop drilling — small surface) ----------
function useToasts(): {
  toasts: Toast[];
  push: (kind: Toast['kind'], message: string) => void;
} {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);
  return { toasts, push };
}

function ToastStack({ toasts }: { toasts: Toast[] }): JSX.Element | null {
  if (!toasts.length) return null;
  return (
    <>
      {toasts.map((t, i) => (
        <div
          key={t.id}
          className={`superadmin-toast${t.kind === 'error' ? ' error' : ''}`}
          style={{ top: 80 + i * 64 }}
          role={t.kind === 'error' ? 'alert' : 'status'}
        >
          {t.message}
        </div>
      ))}
    </>
  );
}

// ---------- Session state ----------
type SessionState =
  | { phase: 'loading' }
  | { phase: 'anon' }
  | { phase: 'ready'; user: AuthUser };

// ====================================================================
// Shell entry — handles session bootstrap, routes
// ====================================================================
export default function SuperAdminShell(): JSX.Element {
  const [session, setSession] = useState<SessionState>({ phase: 'loading' });
  const { toasts, push } = useToasts();
  const navigate = useNavigate();
  const location = useLocation();

  // Bootstrap: check current session on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authMe();
        if (cancelled) return;
        if (isSuperAdmin(res.user.roles)) {
          setSession({ phase: 'ready', user: res.user });
        } else {
          setSession({ phase: 'anon' });
        }
      } catch (err) {
        if (cancelled) return;
        // 401 → just anon. Any other error → also anon but surface.
        if (!(err instanceof ApiError) || err.status !== 401) {
          push('error', errorMessage(err, 'Could not load session.'));
        }
        setSession({ phase: 'anon' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [push]);

  const handleLoginSuccess = useCallback(
    (res: AuthSessionResponse) => {
      if (!isSuperAdmin(res.user.roles)) {
        push('error', 'This account is not a superadmin.');
        return;
      }
      setSession({ phase: 'ready', user: res.user });
      navigate('/admin/v2/dashboard', { replace: true });
    },
    [navigate, push],
  );

  const handleLogout = useCallback(async () => {
    try {
      await authLogout();
    } catch {
      // best effort
    }
    setSession({ phase: 'anon' });
    navigate('/admin/v2/login', { replace: true });
  }, [navigate]);

  const handleProfileUpdate = useCallback((user: AuthUser) => {
    setSession({ phase: 'ready', user });
  }, []);

  if (session.phase === 'loading') {
    return (
      <div className="superadmin-shell">
        <ToastStack toasts={toasts} />
        <div className="superadmin-loading">Loading superadmin session…</div>
      </div>
    );
  }

  // Anonymous — only allow /login. Anything else redirects.
  if (session.phase === 'anon') {
    const onLogin = location.pathname.endsWith('/admin/v2/login');
    return (
      <div className="superadmin-shell">
        <ToastStack toasts={toasts} />
        <Routes>
          <Route
            path="/login"
            element={<LoginPage onSuccess={handleLoginSuccess} />}
          />
          <Route
            path="*"
            element={
              onLogin ? null : <Navigate to="/admin/v2/login" replace />
            }
          />
        </Routes>
      </div>
    );
  }

  // Authenticated superadmin shell
  return (
    <div className="superadmin-shell superadmin-app">
      <ToastStack toasts={toasts} />
      <Header user={session.user} onLogout={handleLogout} />
      <div className="superadmin-layout">
        <Sidebar />
        <main className="superadmin-content">
          <Routes>
            <Route
              path="/login"
              element={<Navigate to="/admin/v2/dashboard" replace />}
            />
            <Route path="/dashboard" element={<DashboardPage onToast={push} />} />
            <Route
              path="/companies"
              element={<CompaniesPage onToast={push} />}
            />
            <Route
              path="/companies/:id"
              element={<CompanyDetailPage onToast={push} />}
            />
            <Route path="/audit" element={<GlobalAuditPage onToast={push} />} />
            <Route
              path="/profile"
              element={
                <ProfilePage
                  user={session.user}
                  onToast={push}
                  onUpdate={handleProfileUpdate}
                />
              }
            />
            <Route
              path="/"
              element={<Navigate to="/admin/v2/dashboard" replace />}
            />
            <Route
              path="*"
              element={<Navigate to="/admin/v2/dashboard" replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ====================================================================
// Header + Sidebar
// ====================================================================
function Header({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void;
}): JSX.Element {
  return (
    <header className="superadmin-header">
      <div className="superadmin-header-brand">
        <strong>DocPilot</strong>
        <em>Superadmin</em>
      </div>
      <div className="superadmin-header-user">
        <span className="who">{user.name || user.email}</span>
        <button
          type="button"
          className="superadmin-logout"
          onClick={onLogout}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

function Sidebar(): JSX.Element {
  const links: { to: string; label: string; icon: string }[] = [
    { to: '/admin/v2/dashboard', label: 'Dashboard', icon: '◊' },
    { to: '/admin/v2/companies', label: 'Companies', icon: '⌂' },
    { to: '/admin/v2/audit', label: 'Audit', icon: '◐' },
    { to: '/admin/v2/profile', label: 'Profile', icon: '☺' },
  ];
  return (
    <aside className="superadmin-sidebar">
      <div className="superadmin-sidebar-section">Admin</div>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `superadmin-nav-link${isActive ? ' active' : ''}`
          }
          end={false}
        >
          <span className="superadmin-nav-icon">{link.icon}</span>
          {link.label}
        </NavLink>
      ))}
    </aside>
  );
}

// ====================================================================
// Login
// ====================================================================
function LoginPage({
  onSuccess,
}: {
  onSuccess: (res: AuthSessionResponse) => void;
}): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setError(null);
      setSubmitting(true);
      try {
        const res = await authLogin({ email: email.trim(), password });
        if (!isSuperAdmin(res.user.roles)) {
          setError('Incorrect credentials');
          setSubmitting(false);
          return;
        }
        onSuccess(res);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError('Incorrect credentials');
        } else {
          setError(errorMessage(err, 'Sign-in failed.'));
        }
        setSubmitting(false);
      }
    },
    [email, password, submitting, onSuccess],
  );

  return (
    <div className="superadmin-login">
      <form className="superadmin-login-card" onSubmit={handleSubmit} noValidate>
        <div className="superadmin-login-brand">
          DocPilot<span>Superadmin</span>
        </div>
        <div className="superadmin-login-eyebrow">Administrator sign-in</div>
        <h1>Sign in</h1>

        <label className="superadmin-field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </label>
        <label className="superadmin-field">
          <span>Password</span>
          <PasswordField
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
            disabled={submitting}
          />
        </label>

        {error && (
          <div className="superadmin-login-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="superadmin-login-submit"
          disabled={submitting}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

// ====================================================================
// Dashboard
// ====================================================================
function DashboardPage({
  onToast,
}: {
  onToast: (kind: Toast['kind'], message: string) => void;
}): JSX.Element {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<PublicCompany[]>([]);
  const [userTotal, setUserTotal] = useState<number | null>(null);
  const [auditTotal, setAuditTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchCompanies();
        if (cancelled) return;
        setCompanies(list);

        // Aggregate user + audit counts per company. Best-effort —
        // skip failures silently so one bad tenant doesn't crash the page.
        const [userCounts, auditCounts] = await Promise.all([
          Promise.all(
            list.map(async (c) => {
              try {
                const users = await fetchUsers(c.id);
                return users.length;
              } catch {
                return 0;
              }
            }),
          ),
          Promise.all(
            list.map(async (c) => {
              try {
                const events = await fetchAudit(c.id);
                return events.length;
              } catch {
                return 0;
              }
            }),
          ),
        ]);
        if (cancelled) return;
        setUserTotal(userCounts.reduce((a, b) => a + b, 0));
        setAuditTotal(auditCounts.reduce((a, b) => a + b, 0));
      } catch (err) {
        if (!cancelled) onToast('error', errorMessage(err, 'Could not load dashboard.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onToast]);

  return (
    <>
      <div className="superadmin-view-header">
        <div>
          <h1>Dashboard</h1>
          <p>Operational overview across all tenants.</p>
        </div>
      </div>

      <div className="superadmin-kpi-grid">
        <div className="superadmin-kpi-card accent-red">
          <div className="label">Companies</div>
          <div className="value">{loading ? '—' : companies.length}</div>
          <div className="sub">
            {loading
              ? 'Loading…'
              : `${companies.filter((c) => c.status === 'active').length} active`}
          </div>
        </div>
        <div className="superadmin-kpi-card">
          <div className="label">Users</div>
          <div className="value">
            {userTotal === null ? '—' : userTotal}
          </div>
          <div className="sub">Across all companies</div>
        </div>
        <div className="superadmin-kpi-card accent-green">
          <div className="label">Recent audit events</div>
          <div className="value">
            {auditTotal === null ? '—' : auditTotal}
          </div>
          <div className="sub">Last 500 per tenant</div>
        </div>
      </div>

      <div className="superadmin-quick-links">
        <button
          type="button"
          className="superadmin-quick-link"
          onClick={() => navigate('/admin/v2/companies')}
        >
          <strong>Manage companies →</strong>
          <span>Create, brand, suspend or archive tenants.</span>
        </button>
        <button
          type="button"
          className="superadmin-quick-link"
          onClick={() => navigate('/admin/v2/audit')}
        >
          <strong>Open audit log →</strong>
          <span>Security events from every tenant in one view.</span>
        </button>
        <button
          type="button"
          className="superadmin-quick-link"
          onClick={() => navigate('/admin/v2/profile')}
        >
          <strong>Your profile →</strong>
          <span>Change your password and contact details.</span>
        </button>
      </div>
    </>
  );
}

// ====================================================================
// Companies list
// ====================================================================
function CompaniesPage({
  onToast,
}: {
  onToast: (kind: Toast['kind'], message: string) => void;
}): JSX.Element {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<PublicCompany[] | null>(null);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await fetchCompanies();
      setCompanies(list);
      const counts: Record<string, number> = {};
      await Promise.all(
        list.map(async (c) => {
          try {
            const users = await fetchUsers(c.id);
            counts[c.id] = users.length;
          } catch {
            counts[c.id] = 0;
          }
        }),
      );
      setUserCounts(counts);
    } catch (err) {
      onToast('error', errorMessage(err, 'Could not load companies.'));
    }
  }, [onToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const name = newName.trim();
      if (!name || busy) return;
      setBusy(true);
      try {
        const created = await createCompany(name);
        onToast('success', `Created ${created.name}.`);
        setShowCreate(false);
        setNewName('');
        // Auto-open branding for new company
        navigate(`/admin/v2/companies/${created.id}?tab=branding`);
      } catch (err) {
        onToast('error', errorMessage(err, 'Could not create company.'));
      } finally {
        setBusy(false);
      }
    },
    [newName, busy, onToast, navigate],
  );

  const handleArchive = useCallback(
    async (c: PublicCompany) => {
      const ok = window.confirm(
        `Archive "${c.name}"? Users will lose access. This is a soft-delete.`,
      );
      if (!ok) return;
      try {
        await archiveCompany(c.id);
        onToast('success', `Archived ${c.name}.`);
        await load();
      } catch (err) {
        onToast('error', errorMessage(err, 'Could not archive company.'));
      }
    },
    [load, onToast],
  );

  return (
    <>
      <div className="superadmin-view-header">
        <div>
          <h1>Companies</h1>
          <p>All tenants on this DocPilot instance.</p>
        </div>
        <button
          type="button"
          className="superadmin-btn primary"
          onClick={() => setShowCreate(true)}
        >
          + New Company
        </button>
      </div>

      {companies === null ? (
        <div className="superadmin-loading">Loading companies…</div>
      ) : companies.length === 0 ? (
        <div className="superadmin-empty">
          No companies yet. Create one to get started.
        </div>
      ) : (
        <div className="superadmin-table-wrap">
          <table className="superadmin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Users</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}>
                  <td>
                    <button
                      type="button"
                      className="superadmin-inline-link"
                      onClick={() => navigate(`/admin/v2/companies/${c.id}`)}
                    >
                      {c.name}
                    </button>
                    <div style={{ color: '#687581', fontSize: 11, marginTop: 2 }}>
                      {c.id}
                    </div>
                  </td>
                  <td>{c.slug}</td>
                  <td>
                    <span
                      className={`superadmin-pill ${statusClass(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td>{userCounts[c.id] ?? '—'}</td>
                  <td className="actions">
                    <button
                      type="button"
                      className="superadmin-btn"
                      onClick={() => navigate(`/admin/v2/companies/${c.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="superadmin-btn danger"
                      onClick={() => handleArchive(c)}
                      disabled={c.status === 'archived'}
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div
          className="superadmin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreate(false);
          }}
        >
          <form className="superadmin-modal" onSubmit={handleCreate}>
            <div className="superadmin-modal-header">
              <h2>New company</h2>
              <p>Slug is generated automatically. You can edit branding next.</p>
            </div>
            <div className="superadmin-modal-body">
              <div className="superadmin-form-row">
                <label htmlFor="new-company-name">Company name</label>
                <input
                  id="new-company-name"
                  type="text"
                  value={newName}
                  autoFocus
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={busy}
                  required
                />
              </div>
            </div>
            <div className="superadmin-modal-footer">
              <button
                type="button"
                className="superadmin-btn ghost"
                onClick={() => setShowCreate(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="superadmin-btn primary"
                disabled={busy || !newName.trim()}
              >
                {busy ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function statusClass(status: string): string {
  if (status === 'active') return 'active';
  if (status === 'archived') return 'archived';
  if (status === 'suspended') return 'suspended';
  if (status === 'disabled') return 'disabled';
  return '';
}

// ====================================================================
// Company detail (Branding · Users · Audit)
// ====================================================================
type DetailTab = 'branding' | 'users' | 'audit';

function CompanyDetailPage({
  onToast,
}: {
  onToast: (kind: Toast['kind'], message: string) => void;
}): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = useMemo<DetailTab>(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t === 'users' || t === 'audit' || t === 'branding') return t;
    return 'branding';
  }, [location.search]);
  const [tab, setTab] = useState<DetailTab>(initialTab);
  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCompany = useCallback(async () => {
    if (!id) return;
    try {
      const list = await fetchCompanies();
      const found = list.find((c) => c.id === id) ?? null;
      setCompany(found);
    } catch (err) {
      onToast('error', errorMessage(err, 'Could not load company.'));
    } finally {
      setLoading(false);
    }
  }, [id, onToast]);

  useEffect(() => {
    void loadCompany();
  }, [loadCompany]);

  if (loading) {
    return <div className="superadmin-loading">Loading company…</div>;
  }
  if (!id || !company) {
    return (
      <>
        <button
          type="button"
          className="superadmin-back-link"
          onClick={() => navigate('/admin/v2/companies')}
        >
          ← Back to companies
        </button>
        <div className="superadmin-empty">Company not found.</div>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className="superadmin-back-link"
        onClick={() => navigate('/admin/v2/companies')}
      >
        ← Back to companies
      </button>
      <div className="superadmin-view-header">
        <div>
          <h1>{company.name}</h1>
          <p>
            <code>{company.slug}</code> ·{' '}
            <span className={`superadmin-pill ${statusClass(company.status)}`}>
              {company.status}
            </span>
          </p>
        </div>
      </div>

      <div className="superadmin-tabs" role="tablist">
        {(['branding', 'users', 'audit'] as DetailTab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`superadmin-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'branding' && (
        <BrandingTab
          company={company}
          onToast={onToast}
          onReload={loadCompany}
        />
      )}
      {tab === 'users' && (
        <UsersTab companyId={company.id} onToast={onToast} />
      )}
      {tab === 'audit' && (
        <AuditTab companyId={company.id} onToast={onToast} />
      )}
    </>
  );
}

// ---------- Branding tab ----------
type BrandingForm = {
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
  description: string;
};

function brandingFromCompany(c: PublicCompany): BrandingForm {
  const b = c.branding;
  return {
    logoUrl: b?.logoUrl ?? '',
    primaryColor: b?.primaryColor ?? '#ff1b23',
    accentColor: b?.accentColor ?? '#63cdff',
    heroTitle: b?.heroTitle ?? '',
    heroSubtitle: b?.heroSubtitle ?? '',
    footerText: b?.footerText ?? '',
    description: b?.description ?? '',
  };
}

function BrandingTab({
  company,
  onToast,
  onReload,
}: {
  company: PublicCompany;
  onToast: (kind: Toast['kind'], message: string) => void;
  onReload: () => Promise<void>;
}): JSX.Element {
  const [form, setForm] = useState<BrandingForm>(() => brandingFromCompany(company));
  const [renaming, setRenaming] = useState(false);
  const [companyName, setCompanyName] = useState(company.name);
  const [companySlug, setCompanySlug] = useState(company.slug);
  const [companyStatus, setCompanyStatus] = useState(company.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(brandingFromCompany(company));
    setCompanyName(company.name);
    setCompanySlug(company.slug);
    setCompanyStatus(company.status);
  }, [company]);

  const slugTrimmed = companySlug.trim();
  const slugChanged = slugTrimmed !== company.slug;
  const slugValid = /^[a-zA-Z0-9][a-zA-Z0-9_-]{5,63}$/.test(slugTrimmed);
  const slugError = slugChanged && !slugValid;

  const handleSave = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (saving) return;

      const nameTrim = companyName.trim();
      const newSlug = companySlug.trim();
      const willChangeSlug = newSlug !== company.slug;
      const willChangeName = renaming && nameTrim && nameTrim !== company.name;
      const willChangeStatus = companyStatus !== company.status;

      if (willChangeSlug) {
        if (!slugValid) {
          onToast('error', 'Slug must be 6–64 chars: letters, digits, dashes, or underscores. Must start with a letter or digit.');
          return;
        }
        const confirmed = window.confirm(
          `Change company URL from /c/${company.slug} to /c/${newSlug}?\n\n` +
          `Anyone with the OLD link will get a 404. You must share the new URL.`
        );
        if (!confirmed) return;
      }

      setSaving(true);
      try {
        await updateBranding(company.id, form);
        const patch: { name?: string; status?: string; slug?: string } = {};
        if (willChangeName) patch.name = nameTrim;
        if (willChangeSlug) patch.slug = newSlug;
        if (willChangeStatus) patch.status = companyStatus;
        if (Object.keys(patch).length) {
          await updateCompany(company.id, patch);
        }
        onToast('success', 'Saved.' + (willChangeSlug ? ` New URL: /c/${newSlug}` : ''));
        await onReload();
        setRenaming(false);
      } catch (err) {
        onToast('error', errorMessage(err, 'Could not save.'));
      } finally {
        setSaving(false);
      }
    },
    [company.id, company.name, company.slug, company.status, companyName, companySlug, companyStatus, form, onReload, onToast, renaming, saving, slugValid],
  );

  const previewStyle: CSSProperties = {
    ['--preview-primary' as string]: form.primaryColor || '#ff1b23',
    ['--preview-accent' as string]: form.accentColor || '#63cdff',
  };

  return (
    <form className="superadmin-form-grid" onSubmit={handleSave}>
      <div className="superadmin-card">
        <div className="superadmin-form-row">
          <label htmlFor="company-name">Company name</label>
          <input
            id="company-name"
            type="text"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              setRenaming(true);
            }}
          />
        </div>
        <div className="superadmin-form-row">
          <label htmlFor="company-slug">Company URL slug</label>
          <input
            id="company-slug"
            type="text"
            value={companySlug}
            onChange={(e) => setCompanySlug(e.target.value)}
            aria-invalid={slugError}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
          <p className={`superadmin-form-hint${slugError ? ' superadmin-form-hint-error' : ''}`}>
            URL preview: <code>{`${typeof window !== 'undefined' ? window.location.origin : ''}/c/${slugTrimmed || '<slug>'}`}</code>
            {slugError && <span> · Slug must be 6–64 chars (letters, digits, <code>-</code>, <code>_</code>) and start with a letter or digit.</span>}
            {slugChanged && slugValid && (
              <span className="superadmin-form-hint-warn">
                {' '}· Changing this URL breaks every link your team has shared. Confirm before saving.
              </span>
            )}
          </p>
        </div>
        <div className="superadmin-form-row">
          <label htmlFor="company-status">Status</label>
          <select
            id="company-status"
            value={companyStatus}
            onChange={(e) => setCompanyStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended (blocks logins)</option>
            <option value="archived">Archived (hidden + locked)</option>
          </select>
        </div>
        <div className="superadmin-form-row">
          <label htmlFor="logoUrl">Logo URL</label>
          <input
            id="logoUrl"
            type="url"
            placeholder="https://…"
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          />
        </div>
        <div className="superadmin-form-row">
          <label htmlFor="primaryColor">Primary color</label>
          <div className="color-row">
            <input
              id="primaryColor"
              type="color"
              value={form.primaryColor || '#ff1b23'}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
            />
            <input
              type="text"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
            />
          </div>
        </div>
        <div className="superadmin-form-row">
          <label htmlFor="accentColor">Accent color</label>
          <div className="color-row">
            <input
              id="accentColor"
              type="color"
              value={form.accentColor || '#63cdff'}
              onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
            />
            <input
              type="text"
              value={form.accentColor}
              onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
            />
          </div>
        </div>
        <div className="superadmin-form-row">
          <label htmlFor="heroTitle">Hero title</label>
          <input
            id="heroTitle"
            type="text"
            value={form.heroTitle}
            onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
          />
        </div>
        <div className="superadmin-form-row">
          <label htmlFor="heroSubtitle">Hero subtitle</label>
          <input
            id="heroSubtitle"
            type="text"
            value={form.heroSubtitle}
            onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
          />
        </div>
        <div className="superadmin-form-row">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="superadmin-form-row">
          <label htmlFor="footerText">Footer text</label>
          <input
            id="footerText"
            type="text"
            value={form.footerText}
            onChange={(e) => setForm({ ...form, footerText: e.target.value })}
          />
        </div>
        <div className="superadmin-form-actions">
          <button
            type="submit"
            className="superadmin-btn primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save branding'}
          </button>
        </div>
      </div>

      <div className="superadmin-branding-preview" style={previewStyle}>
        <div className="superadmin-branding-preview-frame">
          {form.logoUrl ? (
            <div className="superadmin-branding-preview-logo">
              <img src={form.logoUrl} alt={`${companyName} logo`} />
            </div>
          ) : (
            <div className="superadmin-branding-preview-logo empty">No logo</div>
          )}
          <strong>{form.heroTitle || `${companyName} Documentation`}</strong>
          <span>
            {form.heroSubtitle || 'Welcome. Sign in to access your client area.'}
          </span>
        </div>
        <div className="superadmin-branding-preview-body">
          <div className="accent-pill">{companyName || 'Tenant'}</div>
          <p style={{ margin: 0 }}>
            {form.description ||
              `${companyName || 'Tenant'} client area on DocPilot.`}
          </p>
        </div>
        <div className="superadmin-branding-preview-footer">
          {form.footerText || `${companyName} · Hosted by DocPilot`}
        </div>
      </div>
    </form>
  );
}

// ---------- Users tab ----------
const ROLE_OPTIONS = ['viewer', 'editor', 'company-admin', 'superadmin'];

function UsersTab({
  companyId,
  onToast,
}: {
  companyId: string;
  onToast: (kind: Toast['kind'], message: string) => void;
}): JSX.Element {
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await fetchUsers(companyId);
      setUsers(list);
    } catch (err) {
      onToast('error', errorMessage(err, 'Could not load users.'));
    }
  }, [companyId, onToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = useCallback(
    async (u: ManagedUser) => {
      const ok = window.confirm(`Delete user ${u.email}? This cannot be undone.`);
      if (!ok) return;
      try {
        await deleteUser(companyId, u.id);
        onToast('success', `Deleted ${u.email}.`);
        await load();
      } catch (err) {
        onToast('error', errorMessage(err, 'Could not delete user.'));
      }
    },
    [companyId, load, onToast],
  );

  const handleDisable = useCallback(
    async (u: ManagedUser) => {
      const nextStatus = u.status === 'active' ? 'disabled' : 'active';
      const verb = nextStatus === 'disabled' ? 'Disable' : 'Re-enable';
      const ok = window.confirm(`${verb} ${u.email}?`);
      if (!ok) return;
      try {
        await updateUser(companyId, u.id, { status: nextStatus });
        onToast('success', `${verb}d ${u.email}.`);
        await load();
      } catch (err) {
        onToast('error', errorMessage(err, `Could not ${verb.toLowerCase()} user.`));
      }
    },
    [companyId, load, onToast],
  );

  return (
    <>
      <div className="superadmin-view-header" style={{ marginTop: 4 }}>
        <div>
          <p style={{ margin: 0, color: '#66727d', fontSize: 13 }}>
            Manage company members and roles.
          </p>
        </div>
        <button
          type="button"
          className="superadmin-btn primary"
          onClick={() => setShowCreate(true)}
        >
          + Add user
        </button>
      </div>

      {users === null ? (
        <div className="superadmin-loading">Loading users…</div>
      ) : users.length === 0 ? (
        <div className="superadmin-empty">No users in this company yet.</div>
      ) : (
        <div className="superadmin-table-wrap">
          <table className="superadmin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name || '—'}</td>
                  <td>{u.email}</td>
                  <td>{u.roles.join(', ') || '—'}</td>
                  <td>
                    <span className={`superadmin-pill ${statusClass(u.status)}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>{formatTime(u.lastLoginAt)}</td>
                  <td className="actions">
                    <button
                      type="button"
                      className="superadmin-btn"
                      onClick={() => setEditing(u)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="superadmin-btn"
                      onClick={() => handleDisable(u)}
                    >
                      {u.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      className="superadmin-btn danger"
                      onClick={() => handleDelete(u)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateUserModal
          companyId={companyId}
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await load();
          }}
          onToast={onToast}
        />
      )}
      {editing && (
        <EditUserModal
          companyId={companyId}
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
          onToast={onToast}
        />
      )}
    </>
  );
}

function CreateUserModal({
  companyId,
  onClose,
  onCreated,
  onToast,
}: {
  companyId: string;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  onToast: (kind: Toast['kind'], message: string) => void;
}): JSX.Element {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [busy, setBusy] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (busy) return;
      setBusy(true);
      try {
        await createUser(companyId, {
          email: email.trim(),
          name: name.trim(),
          password,
          roles: [role],
        });
        onToast('success', `Created ${email}.`);
        await onCreated();
      } catch (err) {
        onToast('error', errorMessage(err, 'Could not create user.'));
        setBusy(false);
      }
    },
    [busy, companyId, email, name, password, role, onCreated, onToast],
  );

  return (
    <ModalShell title="Add user" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="superadmin-modal-body">
          <div className="superadmin-form-row">
            <label htmlFor="cu-email">Email</label>
            <input
              id="cu-email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="superadmin-form-row">
            <label htmlFor="cu-name">Name</label>
            <input
              id="cu-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="superadmin-form-row">
            <label htmlFor="cu-password">Initial password</label>
            <PasswordField
              id="cu-password"
              value={password}
              onChange={setPassword}
              required
              disabled={busy}
              autoComplete="new-password"
              showGenerator
              minLength={12}
            />
          </div>
          <div className="superadmin-form-row">
            <label htmlFor="cu-role">Role</label>
            <select
              id="cu-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={busy}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="superadmin-modal-footer">
          <button
            type="button"
            className="superadmin-btn ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="superadmin-btn primary"
            disabled={busy}
          >
            {busy ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditUserModal({
  companyId,
  user,
  onClose,
  onSaved,
  onToast,
}: {
  companyId: string;
  user: ManagedUser;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onToast: (kind: Toast['kind'], message: string) => void;
}): JSX.Element {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<string>(user.roles[0] ?? 'viewer');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (busy) return;
      setBusy(true);
      try {
        const patch: { name?: string; roles?: string[]; password?: string } = {};
        if (name.trim() && name.trim() !== user.name) patch.name = name.trim();
        if (role && role !== (user.roles[0] ?? 'viewer')) patch.roles = [role];
        if (password) patch.password = password;
        if (Object.keys(patch).length === 0) {
          onClose();
          return;
        }
        await updateUser(companyId, user.id, patch);
        onToast('success', `Updated ${user.email}.`);
        await onSaved();
      } catch (err) {
        onToast('error', errorMessage(err, 'Could not update user.'));
        setBusy(false);
      }
    },
    [busy, companyId, name, password, role, user, onSaved, onClose, onToast],
  );

  return (
    <ModalShell title={`Edit ${user.email}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="superadmin-modal-body">
          <div className="superadmin-form-row">
            <label htmlFor="eu-name">Name</label>
            <input
              id="eu-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="superadmin-form-row">
            <label htmlFor="eu-role">Role</label>
            <select
              id="eu-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={busy}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="superadmin-form-row">
            <label htmlFor="eu-password">New password (optional)</label>
            <PasswordField
              id="eu-password"
              value={password}
              onChange={setPassword}
              disabled={busy}
              autoComplete="new-password"
              placeholder="Leave blank to keep current"
              showGenerator
              minLength={12}
            />
          </div>
        </div>
        <div className="superadmin-modal-footer">
          <button
            type="button"
            className="superadmin-btn ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="superadmin-btn primary"
            disabled={busy}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}): JSX.Element {
  return (
    <div
      className="superadmin-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="superadmin-modal">
        <div className="superadmin-modal-header">
          <h2>{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- Audit tab ----------
function AuditTab({
  companyId,
  onToast,
}: {
  companyId: string;
  onToast: (kind: Toast['kind'], message: string) => void;
}): JSX.Element {
  const [events, setEvents] = useState<AuditEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAudit(companyId);
        if (!cancelled) setEvents(list);
      } catch (err) {
        if (!cancelled) {
          onToast('error', errorMessage(err, 'Could not load audit log.'));
          setEvents([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, onToast]);

  if (events === null) {
    return <div className="superadmin-loading">Loading audit log…</div>;
  }
  if (events.length === 0) {
    return <div className="superadmin-empty">No audit events yet.</div>;
  }
  return (
    <div className="superadmin-audit">
      {events.map((e) => (
        <AuditEventRow key={e.id} event={e} />
      ))}
    </div>
  );
}

function AuditEventRow({ event }: { event: AuditEvent }): JSX.Element {
  return (
    <div className="superadmin-audit-event">
      <div className="action">{event.action}</div>
      <div className="time">{formatTime(event.created_at)}</div>
      {event.summary && <div className="summary">{event.summary}</div>}
      <div className="meta">
        {event.user_id && <span>user: {event.user_id}</span>}
        {event.ip && <span>ip: {event.ip}</span>}
        {event.entity_type && (
          <span>
            {event.entity_type}: {event.entity_id ?? '—'}
          </span>
        )}
      </div>
    </div>
  );
}

// ====================================================================
// Global audit — aggregates per-company audit feeds
// ====================================================================
function GlobalAuditPage({
  onToast,
}: {
  onToast: (kind: Toast['kind'], message: string) => void;
}): JSX.Element {
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [companyMap, setCompanyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const companies = await fetchCompanies();
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const c of companies) map[c.id] = c.name;
        setCompanyMap(map);

        const lists = await Promise.all(
          companies.map(async (c) => {
            try {
              return await fetchAudit(c.id);
            } catch {
              return [] as AuditEvent[];
            }
          }),
        );
        if (cancelled) return;
        const merged = lists.flat().sort((a, b) => {
          return (b.created_at || '').localeCompare(a.created_at || '');
        });
        setEvents(merged.slice(0, 500));
      } catch (err) {
        if (!cancelled) {
          onToast('error', errorMessage(err, 'Could not load audit log.'));
          setEvents([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onToast]);

  return (
    <>
      <div className="superadmin-view-header">
        <div>
          <h1>Audit log</h1>
          <p>Security events across every tenant, newest first.</p>
        </div>
      </div>
      {events === null ? (
        <div className="superadmin-loading">Loading audit log…</div>
      ) : events.length === 0 ? (
        <div className="superadmin-empty">No audit events yet.</div>
      ) : (
        <div className="superadmin-audit">
          {events.map((e) => (
            <div className="superadmin-audit-event" key={e.id}>
              <div className="action">{e.action}</div>
              <div className="time">{formatTime(e.created_at)}</div>
              {e.summary && <div className="summary">{e.summary}</div>}
              <div className="meta">
                {e.company_id && (
                  <span>
                    tenant: {companyMap[e.company_id] ?? e.company_id}
                  </span>
                )}
                {e.user_id && <span>user: {e.user_id}</span>}
                {e.ip && <span>ip: {e.ip}</span>}
                {e.entity_type && (
                  <span>
                    {e.entity_type}: {e.entity_id ?? '—'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ====================================================================
// Profile — own user details + change password
// ====================================================================
function ProfilePage({
  user,
  onToast,
  onUpdate,
}: {
  user: AuthUser;
  onToast: (kind: Toast['kind'], message: string) => void;
  onUpdate: (user: AuthUser) => void;
}): JSX.Element {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSave = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (busy) return;
      // Profile updates flow through the company-scoped user-update endpoint.
      // For a superadmin without a company, we can only update password via
      // refresh through /auth/me. The /companies/:id/users/:userId endpoint
      // requires a companyId; if the superadmin has none, we can't use it.
      if (password && password !== confirm) {
        onToast('error', 'Passwords do not match.');
        return;
      }
      if (!user.companyId) {
        onToast(
          'error',
          'Self-service profile edits require a company-scoped account. Please ask another superadmin.',
        );
        return;
      }
      setBusy(true);
      try {
        const patch: { name?: string; password?: string } = {};
        if (name.trim() && name.trim() !== user.name) patch.name = name.trim();
        if (password) patch.password = password;
        if (Object.keys(patch).length === 0) {
          onToast('success', 'Nothing to update.');
          setBusy(false);
          return;
        }
        await updateUser(user.companyId, user.id, patch);
        // Refresh session
        const me = await authMe();
        onUpdate(me.user);
        setPassword('');
        setConfirm('');
        onToast('success', 'Profile updated.');
      } catch (err) {
        onToast('error', errorMessage(err, 'Could not update profile.'));
      } finally {
        setBusy(false);
      }
    },
    [busy, confirm, name, onToast, onUpdate, password, user.companyId, user.id, user.name],
  );

  return (
    <>
      <div className="superadmin-view-header">
        <div>
          <h1>Your profile</h1>
          <p>Update your name and password.</p>
        </div>
      </div>
      <form className="superadmin-card" onSubmit={handleSave} style={{ maxWidth: 520 }}>
        <div className="superadmin-form-row">
          <label>Email</label>
          <input type="text" value={user.email} disabled />
        </div>
        <div className="superadmin-form-row">
          <label>Roles</label>
          <input type="text" value={user.roles.join(', ')} disabled />
        </div>
        <div className="superadmin-form-row">
          <label htmlFor="pf-name">Name</label>
          <input
            id="pf-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />
        </div>
        <div className="superadmin-form-row">
          <label htmlFor="pf-pw">New password</label>
          <PasswordField
            id="pf-pw"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            disabled={busy}
            placeholder="Leave blank to keep current"
            showGenerator
            minLength={12}
          />
        </div>
        <div className="superadmin-form-row">
          <label htmlFor="pf-confirm">Confirm new password</label>
          <PasswordField
            id="pf-confirm"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            disabled={busy}
          />
        </div>
        <div className="superadmin-form-actions">
          <button
            type="submit"
            className="superadmin-btn primary"
            disabled={busy}
          >
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </>
  );
}
