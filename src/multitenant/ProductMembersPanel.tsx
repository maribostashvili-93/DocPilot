import { useCallback, useEffect, useState } from 'react';
import { useTenant } from './TenantContext';

/* ── Types ─────────────────────────────────────────────────────────── */

interface ProductMember {
  user_id: string;
  name: string | null;
  email: string;
  role: string;
  granted_by_name: string | null;
  granted_at: string;
}

interface CompanyUser {
  id: string;
  name: string | null;
  email: string;
}

const MEMBER_ROLES = ['editor', 'reviewer', 'viewer', 'developer', 'partner'];

/* ── Helper ────────────────────────────────────────────────────────── */

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let msg = 'Request failed';
    try { msg = (await res.json())?.error ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── ProductMembersPanel ───────────────────────────────────────────── */

export function ProductMembersPanel({ productId }: { productId: string }) {
  const tenant = useTenant();
  const [members, setMembers] = useState<ProductMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!tenant) return;
    setLoading(true); setErr(null);
    try {
      const data = await apiJson<{ members: ProductMember[] }>(
        `/api/v2/companies/${tenant.companyId}/products/${productId}/members`,
      );
      setMembers(data.members);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load members.');
    } finally {
      setLoading(false);
    }
  }, [tenant, productId]);

  useEffect(() => { load(); }, [load]);

  async function remove(userId: string) {
    if (!tenant) return;
    if (!confirm('Remove this member from the product?')) return;
    try {
      await apiJson(
        `/api/v2/companies/${tenant.companyId}/products/${productId}/members/${userId}`,
        { method: 'DELETE' },
      );
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to remove member.');
    }
  }

  if (!tenant) return null;

  return (
    <div className="pmp-root">
      <div className="pmp-header">
        <div>
          <h3 className="pmp-title">Team</h3>
          <p className="pmp-sub">Members scoped to this product only</p>
        </div>
        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-sm"
          onClick={() => setAdding(true)}
        >
          Add Member
        </button>
      </div>

      {err && <div className="ds-alert ds-alert-danger">{err}</div>}

      {loading && <p className="pmp-loading">Loading…</p>}

      {members.length === 0 && !loading ? (
        <div className="ds-empty-state">
          <div className="ds-empty-state-icon">👥</div>
          <h3 className="ds-empty-state-title">No members yet</h3>
          <p className="ds-empty-state-body">Add team members to scope their access to this product.</p>
        </div>
      ) : (
        <table className="ds-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Granted by</th>
              <th>Since</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.user_id}>
                <td>{m.name ?? '—'}</td>
                <td>{m.email}</td>
                <td><span className="ds-badge ds-badge-info">{m.role}</span></td>
                <td>{m.granted_by_name ?? '—'}</td>
                <td>{fmtDate(m.granted_at)}</td>
                <td className="ds-table-actions">
                  <button
                    type="button"
                    className="ds-btn ds-btn-sm ds-btn-ghost"
                    onClick={() => remove(m.user_id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {adding && (
        <AddMemberDialog
          productId={productId}
          companyId={tenant.companyId}
          existingIds={members.map((m) => m.user_id)}
          onClose={() => setAdding(false)}
          onAdded={() => { setAdding(false); load(); }}
        />
      )}
    </div>
  );
}

/* ── AddMemberDialog ───────────────────────────────────────────────── */

function AddMemberDialog({
  productId,
  companyId,
  existingIds,
  onClose,
  onAdded,
}: {
  productId: string;
  companyId: string;
  existingIds: string[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('viewer');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiJson<{ users: CompanyUser[] }>(`/api/v2/companies/${companyId}/users`)
      .then((d) => setUsers(d.users.filter((u) => !existingIds.includes(u.id))))
      .catch(() => setUsers([]));
  }, [companyId, existingIds]);

  async function submit() {
    if (!userId) return;
    setBusy(true); setErr(null);
    try {
      await apiJson(`/api/v2/companies/${companyId}/products/${productId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId, role }),
      });
      onAdded();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to add member.');
      setBusy(false);
    }
  }

  return (
    <div className="ds-dialog-backdrop" onClick={() => !busy && onClose()}>
      <div className="ds-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ds-dialog-header">
          <h3 className="ds-dialog-title">Add Member</h3>
        </div>
        <div className="ds-dialog-body">
          <div className="ds-field">
            <label className="ds-label" htmlFor="pmp-user-select">User</label>
            <select
              id="pmp-user-select"
              className="ds-select"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoFocus
            >
              <option value="">— select a user —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ? `${u.name} (${u.email})` : u.email}
                </option>
              ))}
            </select>
          </div>
          <div className="ds-field">
            <label className="ds-label" htmlFor="pmp-role-select">Role</label>
            <select
              id="pmp-role-select"
              className="ds-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {MEMBER_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {err && <div className="ds-alert ds-alert-danger">{err}</div>}
        </div>
        <div className="ds-dialog-footer">
          <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="ds-btn ds-btn-primary ds-btn-sm" onClick={submit} disabled={busy || !userId}>
            {busy ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
