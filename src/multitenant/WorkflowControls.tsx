import { useCallback, useEffect, useState } from 'react';
import { useTenant } from './TenantContext';

/* ── Types ─────────────────────────────────────────────────────────── */

type EntityType = 'documents' | 'sections' | 'products' | 'releases';

interface WorkflowEntity {
  id: string;
  status: string;
}

interface TransitionEntry {
  id: string;
  from_status: string;
  to_status: string;
  actor_name: string | null;
  actor_email: string | null;
  note: string | null;
  created_at: string;
}

/* ── Client-side transition map (mirrors server/workflow.mjs) ──────── */

const TRANSITIONS: Record<string, Record<string, string[]>> = {
  documents: {
    draft:     ['review', 'archived'],
    review:    ['approved', 'draft'],
    approved:  ['published', 'draft'],
    published: ['staged', 'archived'],
    staged:    ['rolled-back', 'published'],
  },
  sections: {
    draft:    ['review'],
    review:   ['approved', 'draft'],
    approved: ['draft'],
  },
  products: {
    draft:     ['review', 'archived'],
    review:    ['approved', 'draft'],
    approved:  ['published', 'draft'],
    published: ['staged', 'archived'],
    staged:    ['rolled-back', 'published'],
  },
  releases: {
    draft:        ['staged'],
    staged:       ['published', 'rolled-back'],
    'rolled-back': ['draft'],
  },
};

const TRANSITION_CONFIG: Record<string, { label: string; variant: string }> = {
  review:          { label: 'Submit for Review',  variant: 'ds-btn-primary'   },
  approved:        { label: 'Approve',            variant: 'ds-btn-primary'   },
  draft:           { label: 'Request Changes',    variant: 'ds-btn-ghost'     },
  published:       { label: 'Publish',            variant: 'ds-btn-primary'   },
  staged:          { label: 'Move to Staging',    variant: 'ds-btn-secondary' },
  'rolled-back':   { label: 'Roll Back',          variant: 'ds-btn-danger'    },
  archived:        { label: 'Archive',            variant: 'ds-btn-ghost'     },
};

const STATUS_VARIANT: Record<string, string> = {
  draft:         'ds-status-neutral',
  review:        'ds-status-review',
  approved:      'ds-status-approved',
  published:     'ds-status-published',
  staged:        'ds-status-staged',
  'rolled-back': 'ds-status-rolled-back',
  archived:      'ds-status-neutral',
};

/* ── Helpers ───────────────────────────────────────────────────────── */

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

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/* ── WorkflowControls ──────────────────────────────────────────────── */

export function WorkflowControls({
  entity,
  entityType,
  onTransitionSuccess,
}: {
  entity: WorkflowEntity;
  entityType: EntityType;
  onTransitionSuccess: (newStatus: string) => void;
}) {
  const tenant = useTenant();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const allowed = TRANSITIONS[entityType]?.[entity.status] ?? [];

  if (!tenant || allowed.length === 0) return null;

  async function confirmTransition() {
    if (!tenant || !confirming) return;
    setBusy(true); setErr(null); setIssues([]);
    try {
      await apiJson(
        `/api/v2/companies/${tenant.companyId}/${entityType}/${entity.id}/transition`,
        { method: 'POST', body: JSON.stringify({ to: confirming }) },
      );
      onTransitionSuccess(confirming);
      setConfirming(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transition failed.';
      if (msg.startsWith('[') || msg.includes(',')) {
        try { setIssues(JSON.parse(msg)); } catch { setErr(msg); }
      } else {
        setErr(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wf-controls">
      <span className={`ds-status ${STATUS_VARIANT[entity.status] ?? 'ds-status-neutral'} wf-current-status`}>
        {entity.status}
      </span>

      <div className="wf-btn-row">
        {allowed.map((to) => {
          const cfg = TRANSITION_CONFIG[to];
          if (!cfg) return null;
          return (
            <button
              key={to}
              type="button"
              className={`ds-btn ds-btn-sm ${cfg.variant}`}
              onClick={() => { setConfirming(to); setIssues([]); setErr(null); }}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {confirming && (
        <div className="ds-dialog-backdrop" onClick={() => !busy && setConfirming(null)}>
          <div className="ds-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ds-dialog-header">
              <h3 className="ds-dialog-title">
                {TRANSITION_CONFIG[confirming]?.label ?? confirming}
              </h3>
            </div>
            <div className="ds-dialog-body">
              <p style={{ margin: '0 0 var(--ds-space-3)' }}>
                Move <strong>{entityType.replace(/s$/, '')}</strong> from{' '}
                <span className={`ds-status ${STATUS_VARIANT[entity.status] ?? ''}`}>{entity.status}</span>
                {' → '}
                <span className={`ds-status ${STATUS_VARIANT[confirming] ?? ''}`}>{confirming}</span>?
              </p>
              {issues.length > 0 && (
                <div className="ds-alert ds-alert-warning">
                  <strong>Blocking issues:</strong>
                  <ul style={{ margin: 'var(--ds-space-2) 0 0', paddingLeft: 'var(--ds-space-5)' }}>
                    {issues.map((issue, i) => <li key={i}>{issue}</li>)}
                  </ul>
                </div>
              )}
              {err && <div className="ds-alert ds-alert-danger">{err}</div>}
            </div>
            <div className="ds-dialog-footer">
              <button
                type="button"
                className="ds-btn ds-btn-ghost ds-btn-sm"
                onClick={() => setConfirming(null)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`ds-btn ds-btn-sm ${TRANSITION_CONFIG[confirming]?.variant ?? 'ds-btn-primary'}`}
                onClick={confirmTransition}
                disabled={busy || issues.length > 0}
              >
                {busy ? 'Working…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── WorkflowHistory ───────────────────────────────────────────────── */

export function WorkflowHistory({
  entityType,
  entityId,
}: {
  entityType: EntityType;
  entityId: string;
}) {
  const tenant = useTenant();
  const [entries, setEntries] = useState<TransitionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const data = await apiJson<{ transitions: TransitionEntry[] }>(
        `/api/v2/companies/${tenant.companyId}/${entityType}/${entityId}/transitions`,
      );
      setEntries(data.transitions);
    } catch {
      /* non-critical — just don't show history */
    } finally {
      setLoading(false);
    }
  }, [tenant, entityType, entityId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!tenant) return null;

  return (
    <div className="wf-history">
      <button
        type="button"
        className="wf-history-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        History {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className="ds-stepper wf-timeline">
          {loading && <p className="wf-history-empty">Loading…</p>}
          {!loading && entries.length === 0 && (
            <p className="wf-history-empty">No transitions recorded yet.</p>
          )}
          {entries.map((t) => (
            <div key={t.id} className="ds-stepper-step past">
              <div className="ds-stepper-dot" />
              <div className="ds-stepper-body">
                <div className="ds-stepper-meta">
                  <span className="wf-actor">{t.actor_name ?? t.actor_email ?? 'System'}</span>
                  {' moved to '}
                  <span className={`ds-status ${STATUS_VARIANT[t.to_status] ?? 'ds-status-neutral'}`}>
                    {t.to_status}
                  </span>
                  <span className="wf-time">{fmtTime(t.created_at)}</span>
                </div>
                {t.note && <p className="wf-note">{t.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
