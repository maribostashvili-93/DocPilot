import { useEffect, useState } from 'react';
import { useTenant } from './TenantContext';

interface LocaleHealth {
  locale: string;
  documentsReady: number;
  documentsBlocked: number;
  dirtyStrings: number;
  inReviewStrings: number;
  avgCompletionPct: number;
  slaStatus: 'on-track' | 'at-risk' | 'blocked';
}

interface QueueItem {
  id: string;
  sectionId: string;
  documentId: string;
  documentTitle: string;
  sectionTitle: string;
  locale: string;
  state: string;
  translatedBy: string | null;
  reviewedBy: string | null;
  updatedAt: string;
}

const SLA_MOD: Record<string, string> = {
  'on-track': 'ds-badge-success',
  'at-risk': 'ds-badge-warning',
  blocked: 'ds-badge-danger',
};

function SlaTag({ status }: { status: string }) {
  return <span className={`ds-badge ${SLA_MOD[status] ?? 'ds-badge-neutral'}`}>{status}</span>;
}

function StatePill({ state }: { state: string }) {
  const mod = state === 'approved' ? 'ds-badge-success'
    : state === 'review' ? 'ds-badge-warning'
    : 'ds-badge-danger';
  return <span className={`ds-badge ${mod}`}>{state}</span>;
}

function PctBar({ pct }: { pct: number }) {
  const fill = pct >= 90 ? 'var(--ds-color-success, #10b981)'
    : pct >= 70 ? 'var(--ds-color-warning, #d97706)'
    : 'var(--ds-color-danger, #dc2626)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: 'var(--ds-border-default, #e5e7eb)', overflow: 'hidden',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: fill, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, minWidth: 34, textAlign: 'right', color: 'var(--ds-text-secondary)' }}>
        {pct}%
      </span>
    </div>
  );
}

export function LocalizationOpsPage() {
  const tenant = useTenant();
  const [locales, setLocales] = useState<LocaleHealth[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedLocale, setSelectedLocale] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cid = tenant?.companyId ?? '';

  useEffect(() => {
    if (!cid) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/v2/companies/${cid}/localization/overview`).then((r) => r.json()),
    ])
      .then(([overviewData]) => {
        setLocales((overviewData as { locales: LocaleHealth[] }).locales ?? []);
      })
      .catch(() => setError('Failed to load localization overview.'))
      .finally(() => setLoading(false));
  }, [cid]);

  useEffect(() => {
    if (!cid) return;
    const params = new URLSearchParams();
    if (selectedLocale) params.set('locale', selectedLocale);
    if (stateFilter) params.set('state', stateFilter);
    fetch(`/api/v2/companies/${cid}/localization/queue?${params}`)
      .then((r) => r.json())
      .then((data: { items: QueueItem[] }) => setQueue(data.items ?? []))
      .catch(() => {});
  }, [cid, selectedLocale, stateFilter]);

  if (loading) return <div className="ds-page-loading">Loading…</div>;
  if (error) return <div className="ds-alert ds-alert-danger" style={{ margin: 24 }}>{error}</div>;

  const allLocaleLabels = [...new Set(locales.map((l) => l.locale))];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <div className="ds-page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="ds-page-header-title">Localization Ops</h1>
          <p className="ds-page-header-sub" style={{ marginTop: 4 }}>
            Track translation readiness by locale, document, and reviewer.
          </p>
        </div>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Locale Health</h2>
        {locales.length === 0 ? (
          <p style={{ color: 'var(--ds-text-secondary)', fontSize: 14 }}>No translation locales configured yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {locales.map((lh) => (
              <div key={lh.locale} className="ds-surface" style={{
                border: '1px solid var(--ds-border-default)',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{lh.locale.toUpperCase()}</span>
                  <SlaTag status={lh.slaStatus} />
                </div>
                <PctBar pct={lh.avgCompletionPct} />
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
                  marginTop: 10, fontSize: 12, color: 'var(--ds-text-secondary)',
                }}>
                  <span>{lh.documentsReady} docs ready</span>
                  <span>{lh.documentsBlocked} blocked</span>
                  <span>{lh.dirtyStrings} dirty strings</span>
                  <span>{lh.inReviewStrings} in review</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Translation Queue</h2>
          <select
            className="ds-select"
            style={{ fontSize: 13, padding: '4px 8px', height: 32 }}
            value={selectedLocale}
            onChange={(e) => setSelectedLocale(e.target.value)}
          >
            <option value="">All locales</option>
            {allLocaleLabels.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
          <select
            className="ds-select"
            style={{ fontSize: 13, padding: '4px 8px', height: 32 }}
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="">All states</option>
            <option value="dirty">Dirty</option>
            <option value="review">Needs review</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        {queue.length === 0 ? (
          <p style={{ color: 'var(--ds-text-secondary)', fontSize: 14 }}>No strings match the current filters.</p>
        ) : (
          <table className="ds-table">
            <thead>
              <tr>
                <th>Document / Section</th>
                <th>Locale</th>
                <th>State</th>
                <th>Translator</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.documentTitle}</div>
                    <div style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>{item.sectionTitle}</div>
                  </td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.locale}</span></td>
                  <td><StatePill state={item.state} /></td>
                  <td style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
                    {item.translatedBy ?? '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
