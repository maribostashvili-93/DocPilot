import { useCallback, useEffect, useState } from 'react';
import { useTenant } from './TenantContext';
import { WorkflowHistory } from './WorkflowControls';

/* ── Types ─────────────────────────────────────────────────────────── */

interface Release {
  id: string;
  title: string;
  status: string;
  version: string | null;
  release_notes: string | null;
  published_at: string | null;
  created_at: string;
}

interface ReadinessItem {
  ok: boolean;
  total?: number;
  approved?: number;
  locale?: string;
  pct?: number;
}

interface Readiness {
  sectionsApproved?: ReadinessItem;
  translationThreshold?: ReadinessItem;
  releaseNotes?: ReadinessItem;
  snapshot?: ReadinessItem;
  unsafeHtml?: ReadinessItem;
  reviewer?: ReadinessItem;
  overallReady?: boolean;
  blockingIssues?: string[];
}

/* ── Constants ─────────────────────────────────────────────────────── */

const RELEASE_STEPS = ['draft', 'staged', 'published'] as const;

const STEP_LABELS: Record<string, string> = {
  draft:         'Draft',
  staged:        'Staged',
  published:     'Published',
  'rolled-back': 'Rolled Back',
};

const STEP_STATUS_CLASS: Record<string, string> = {
  draft:         'ds-status-neutral',
  staged:        'ds-status-staged',
  published:     'ds-status-published',
  'rolled-back': 'ds-status-rolled-back',
};

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

/* ── ReleasePanel (entry point) ────────────────────────────────────── */

export function ReleasePanel({
  releaseId,
  onStatusChange,
}: {
  releaseId: string;
  onStatusChange?: (newStatus: string) => void;
}) {
  const tenant = useTenant();
  const [release, setRelease] = useState<Release | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenant) return;
    setLoading(true); setErr(null);
    try {
      const [relData, rdData] = await Promise.all([
        apiJson<{ release: Release }>(
          `/api/v2/companies/${tenant.companyId}/releases/${releaseId}`,
        ),
        apiJson<Readiness>(
          `/api/v2/companies/${tenant.companyId}/releases/${releaseId}/readiness`,
        ).catch(() => null),
      ]);
      setRelease(relData.release);
      setReadiness(rdData);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load release.');
    } finally {
      setLoading(false);
    }
  }, [tenant, releaseId]);

  useEffect(() => { load(); }, [load]);

  if (!tenant) return null;
  if (loading) return <p style={{ color: 'var(--ds-text-muted)', fontSize: 'var(--ds-text-sm)' }}>Loading release…</p>;
  if (err) return <div className="ds-alert ds-alert-danger">{err}</div>;
  if (!release) return null;

  function handleRollback() {
    load();
    onStatusChange?.('rolled-back');
  }

  function handleTransitionSuccess(newStatus: string) {
    load();
    onStatusChange?.(newStatus);
  }

  return (
    <div className="rp-root">
      <div className="rp-header">
        <div>
          <h3 className="rp-title">{release.title}</h3>
          {release.version && <span className="rp-version">v{release.version}</span>}
        </div>
        <span className={`ds-status ${STEP_STATUS_CLASS[release.status] ?? 'ds-status-neutral'}`}>
          {release.status}
        </span>
      </div>

      <ReleaseStatusStepper status={release.status} />

      {readiness && <ReleaseReadinessPanel readiness={readiness} />}

      <div className="rp-actions">
        {release.status === 'published' && (
          <RollbackButton
            releaseId={releaseId}
            companyId={tenant.companyId}
            onRollback={handleRollback}
          />
        )}
      </div>

      <WorkflowHistory entityType="releases" entityId={releaseId} />
    </div>
  );
}

/* ── ReleaseStatusStepper ──────────────────────────────────────────── */

function ReleaseStatusStepper({ status }: { status: string }) {
  const isRolledBack = status === 'rolled-back';
  const currentIdx = RELEASE_STEPS.indexOf(status as typeof RELEASE_STEPS[number]);

  return (
    <div className="ds-stepper rsp-stepper">
      {isRolledBack ? (
        <div className="ds-stepper-step current">
          <div className="ds-stepper-dot" style={{ background: 'var(--ds-amber-400)' }} />
          <div className="ds-stepper-body">
            <span className={`ds-status ${STEP_STATUS_CLASS['rolled-back']}`}>Rolled Back</span>
          </div>
        </div>
      ) : (
        RELEASE_STEPS.map((step, idx) => {
          const state = idx < currentIdx ? 'past' : idx === currentIdx ? 'current' : '';
          return (
            <div key={step} className={`ds-stepper-step ${state}`}>
              <div className="ds-stepper-dot" />
              <div className="ds-stepper-body">
                <span className={`ds-status ${STEP_STATUS_CLASS[step] ?? ''}`}>
                  {STEP_LABELS[step] ?? step}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ── ReleaseReadinessPanel ─────────────────────────────────────────── */

const READINESS_ITEMS: Array<{
  key: keyof Readiness;
  label: (item: ReadinessItem) => string;
}> = [
  { key: 'sectionsApproved',     label: (d) => `${d.approved ?? 0}/${d.total ?? 0} sections approved` },
  { key: 'translationThreshold', label: (d) => `Translation threshold: ${d.ok ? 'met' : `${d.pct ?? 0}% (min 90%)`}` },
  { key: 'releaseNotes',         label: () => 'Release notes present' },
  { key: 'snapshot',             label: () => 'Snapshot created' },
  { key: 'unsafeHtml',           label: () => 'No unsafe HTML detected' },
  { key: 'reviewer',             label: () => 'Reviewer assigned' },
];

function ReleaseReadinessPanel({ readiness }: { readiness: Readiness }) {
  const allOk = readiness.overallReady === true;
  return (
    <div className="rp-readiness">
      <div className="rp-readiness-head">
        <span className="rp-readiness-label">Release Readiness</span>
        {allOk
          ? <span className="ds-badge ds-badge-success">Ready</span>
          : <span className="ds-badge ds-badge-warning">Blocked</span>}
      </div>
      {READINESS_ITEMS.map(({ key, label }) => {
        const item = readiness[key] as ReadinessItem | undefined;
        if (!item) return null;
        return (
          <div key={key} className={`ds-readiness-item ${item.ok ? 'ok' : 'blocked'}`}>
            <span aria-hidden="true">{item.ok ? '✅' : '⚠️'}</span>
            <span>{label(item)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── RollbackButton ────────────────────────────────────────────────── */

function RollbackButton({
  releaseId,
  companyId,
  onRollback,
}: {
  releaseId: string;
  companyId: string;
  onRollback: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function doRollback() {
    setBusy(true); setErr(null);
    try {
      await apiJson(`/api/v2/companies/${companyId}/releases/${releaseId}/rollback`, {
        method: 'POST',
      });
      setConfirming(false);
      onRollback();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Rollback failed.');
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="ds-btn ds-btn-sm ds-btn-danger"
        onClick={() => setConfirming(true)}
      >
        Rollback Release
      </button>

      {confirming && (
        <div className="ds-dialog-backdrop" onClick={() => !busy && setConfirming(false)}>
          <div className="ds-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ds-dialog-header">
              <h3 className="ds-dialog-title">Confirm Rollback</h3>
            </div>
            <div className="ds-dialog-body">
              <p style={{ margin: '0 0 var(--ds-space-3)' }}>
                This will mark the release as <strong>rolled-back</strong> and record a transition event.
              </p>
              <p style={{ margin: 0, color: 'var(--ds-text-muted)', fontSize: 'var(--ds-text-sm)' }}>
                The snapshot is NOT deleted — all history is preserved.
              </p>
              {err && <div className="ds-alert ds-alert-danger" style={{ marginTop: 'var(--ds-space-3)' }}>{err}</div>}
            </div>
            <div className="ds-dialog-footer">
              <button
                type="button"
                className="ds-btn ds-btn-ghost ds-btn-sm"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-danger ds-btn-sm"
                onClick={doRollback}
                disabled={busy}
              >
                {busy ? 'Rolling back…' : 'Confirm Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
