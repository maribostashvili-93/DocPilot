import { useEffect, useState } from 'react';
import {
  ApiError,
  authMe,
  listCompanyUsers,
  listAccountManagers,
  updateUserAccountManager,
  updateUserStagingCard,
  type AuthUser,
  type AccountManagerSummary,
} from './api';

type Props = {
  companySlug: string | null;
  toast: (message: string) => void;
};

const ROLE_LABELS: Record<string, string> = {
  'company-admin': 'Company admin',
  'account-manager': 'Account manager',
  'viewer': 'Viewer',
};

/**
 * Tenant Users surface — v2-backed.
 *
 * Lists the company's actual users (from /api/v2/companies/:id/users)
 * with their role, AM assignment, staging-card visibility, and status.
 * Company admins cannot CREATE users here — that lives in the DocPilot
 * superadmin shell, where the role mix can be enforced safely. From the
 * tenant side admins can only TOGGLE assignment + visibility.
 */
export default function TenantUsersPage({ toast }: Props): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [managers, setManagers] = useState<AccountManagerSummary[]>([]);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await authMe();
        if (cancelled) return;
        if (!me.user?.companyId) {
          setError('No company in session.');
          setLoading(false);
          return;
        }
        setCompanyId(me.user.companyId);
        const [{ users: list }, { accountManagers: ams }] = await Promise.all([
          listCompanyUsers(me.user.companyId),
          listAccountManagers(me.user.companyId),
        ]);
        if (cancelled) return;
        setUsers(list);
        setManagers(ams);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load users.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function setAm(userId: string, amUserId: string | null) {
    if (!companyId) return;
    setBusyUserId(userId);
    try {
      const { user: updated } = await updateUserAccountManager(companyId, userId, amUserId);
      setUsers((list) => list.map((u) => (u.id === userId ? updated : u)));
      toast('Assignment updated.');
    } catch (err) {
      toast(`Failed: ${err instanceof Error ? err.message : 'unknown'}`);
    } finally {
      setBusyUserId(null);
    }
  }

  async function setStaging(userId: string, enabled: boolean) {
    if (!companyId) return;
    setBusyUserId(userId);
    try {
      const { user: updated } = await updateUserStagingCard(companyId, userId, enabled);
      setUsers((list) => list.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      toast(`Failed: ${err instanceof Error ? err.message : 'unknown'}`);
    } finally {
      setBusyUserId(null);
    }
  }

  if (loading) return <section className="tenant-users-loading"><p>Loading users…</p></section>;
  if (error) return <section className="tenant-users-empty"><h2>Could not load users</h2><p>{error}</p></section>;

  const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString() : '—';
  const roleBadge = (roles: string[]) => {
    const primary = roles[0] ?? 'viewer';
    return <span className={`tenant-users-role tenant-users-role--${primary}`}>{ROLE_LABELS[primary] ?? primary}</span>;
  };

  return (
    <section className="tenant-users">
      <header className="tenant-users-head">
        <div>
          <h1>Users</h1>
          <p>Real company users from <code>/api/v2</code>. New users are created by the DocPilot superadmin — assignments and visibility toggles live here.</p>
        </div>
      </header>

      <div className="tenant-users-stats">
        <span><strong>{users.length}</strong> total</span>
        <span><strong>{managers.length}</strong> account manager{managers.length === 1 ? '' : 's'}</span>
        <span><strong>{users.filter((u) => u.status === 'active').length}</strong> active</span>
      </div>

      <div className="tenant-users-table-wrap">
        <table className="tenant-users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Account manager</th>
              <th>Staging card</th>
              <th>Status</th>
              <th>Last login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const fullName = `${u.name}${u.surname ? ' ' + u.surname : ''}`.trim();
              const eligibleManagers = managers.filter((m) => m.id !== u.id);
              const isAm = u.roles.includes('account-manager');
              return (
                <tr key={u.id}>
                  <td><strong>{fullName || u.email}</strong></td>
                  <td className="tenant-users-email">{u.email}</td>
                  <td>{roleBadge(u.roles)}</td>
                  <td>
                    {isAm ? (
                      <span className="tenant-users-muted">— manager —</span>
                    ) : (
                      <select
                        value={u.accountManagerUserId ?? ''}
                        disabled={busyUserId === u.id}
                        onChange={(e) => setAm(u.id, e.target.value || null)}
                      >
                        <option value="">— unassigned —</option>
                        {eligibleManagers.map((m) => {
                          const amName = `${m.name}${m.surname ? ' ' + m.surname : ''}`.trim();
                          return <option key={m.id} value={m.id}>{amName} ({m.email})</option>;
                        })}
                      </select>
                    )}
                  </td>
                  <td>
                    <label className="tenant-users-toggle">
                      <input
                        type="checkbox"
                        checked={u.stagingCardEnabled !== false}
                        disabled={busyUserId === u.id}
                        onChange={(e) => setStaging(u.id, e.target.checked)}
                      />
                      <span>{u.stagingCardEnabled !== false ? 'Visible' : 'Hidden'}</span>
                    </label>
                  </td>
                  <td>
                    <span className={`tenant-users-status tenant-users-status--${u.status}`}>{u.status}</span>
                  </td>
                  <td className="tenant-users-muted">{fmtDate(u.lastLoginAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="tenant-users-foot">
        <span>Need to add or remove users? Open the <a href="/admin/v2/companies" target="_blank" rel="noopener noreferrer">DocPilot superadmin shell ↗</a>.</span>
      </footer>
    </section>
  );
}
