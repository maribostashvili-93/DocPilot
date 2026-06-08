import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import './research.css';

/* ═══════════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════════ */

type SourceType = 'website' | 'docs';
type SourceStatus = 'pending' | 'analyzing' | 'ready' | 'failed';
type JobStatus = 'running' | 'completed' | 'failed';
type DraftStatus = 'pending-review' | 'sent-to-cms' | 'discarded';

interface RSource {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  status: SourceStatus;
  addedAt: string;
  analyzedAt?: string;
  summary?: string;
  concepts?: string[];
}

interface RJob {
  id: string;
  sourceId: string;
  sourceName: string;
  status: JobStatus;
  startedAt: string;
  completedAt?: string;
}

interface RDraft {
  id: string;
  title: string;
  sourceId: string;
  sourceName: string;
  status: DraftStatus;
  createdAt: string;
  content: string;
}

/* ═══════════════════════════════════════════════════════════════════
   Seed data
═══════════════════════════════════════════════════════════════════ */

const SEED_SOURCES: RSource[] = [
  {
    id: 'src-1',
    name: 'DocPilot Public Docs',
    url: 'https://docs.docpilot.app',
    type: 'docs',
    status: 'ready',
    addedAt: '2026-06-01T09:00:00Z',
    analyzedAt: '2026-06-01T09:02:14Z',
    summary:
      'Comprehensive documentation covering the full DocPilot platform — CMS workflows, publishing pipeline, translation management, and the multi-tenant client portal.',
    concepts: [
      'authentication',
      'API integration',
      'document publishing',
      'translation workflow',
      'media library',
      'branding',
      'client portal',
    ],
  },
  {
    id: 'src-2',
    name: 'Integration Partner Guide',
    url: 'https://partners.example.com/integration',
    type: 'website',
    status: 'pending',
    addedAt: '2026-06-07T08:30:00Z',
  },
];

const SEED_JOBS: RJob[] = [
  {
    id: 'job-1',
    sourceId: 'src-1',
    sourceName: 'DocPilot Public Docs',
    status: 'completed',
    startedAt: '2026-06-01T09:00:00Z',
    completedAt: '2026-06-01T09:02:14Z',
  },
];

const SEED_DRAFT_CONTENT = `# Getting Started with DocPilot

Welcome to DocPilot — your team's unified documentation platform.

## What is DocPilot?

DocPilot is a multi-tenant documentation CMS that helps companies publish, manage, and translate technical documentation for their clients. Built for teams that care about structure and consistency.

## First Steps

### 1. Access Your Workspace

After receiving your invitation, log in at your company's portal URL. Your account manager will have provided credentials.

### 2. Explore the Dashboard

The CMS dashboard gives you an overview of all your documents, their publication status, and pending translations.

### 3. Create Your First Document

Navigate to **Documents → New Document** to start drafting. Choose from built-in templates for:
- Game documentation
- Integration guides
- Back-office manuals
- Operations playbooks

### 4. Publish to the Client Portal

When your document is ready, set the status to **Approved** and publish it. Clients will see it instantly on their portal.

## Need Help?

Reach out to your account manager or visit the support section in your client portal.`;

const SEED_DRAFTS: RDraft[] = [
  {
    id: 'draft-1',
    title: 'Getting Started with DocPilot',
    sourceId: 'src-1',
    sourceName: 'DocPilot Public Docs',
    status: 'pending-review',
    createdAt: '2026-06-02T11:30:00Z',
    content: SEED_DRAFT_CONTENT,
  },
];

/* ═══════════════════════════════════════════════════════════════════
   Context
═══════════════════════════════════════════════════════════════════ */

interface RCContextValue {
  sources: RSource[];
  jobs: RJob[];
  drafts: RDraft[];
  addSource: (s: RSource) => void;
  analyzeSource: (id: string, name: string) => void;
  addDraft: (d: RDraft) => void;
  updateDraft: (id: string, patch: Partial<RDraft>) => void;
}

const RCContext = createContext<RCContextValue | null>(null);

function useRC(): RCContextValue {
  const ctx = useContext(RCContext);
  if (!ctx) throw new Error('useRC must be used inside ResearchProvider');
  return ctx;
}

function ResearchProvider({ children }: { children: ReactNode }) {
  const [sources, setSources] = useState<RSource[]>(SEED_SOURCES);
  const [jobs, setJobs] = useState<RJob[]>(SEED_JOBS);
  const [drafts, setDrafts] = useState<RDraft[]>(SEED_DRAFTS);

  const addSource = useCallback((s: RSource) => setSources((p) => [...p, s]), []);

  const analyzeSource = useCallback((id: string, name: string) => {
    setSources((p) => p.map((s) => (s.id === id ? { ...s, status: 'analyzing' } : s)));
    const jobId = `job-${Date.now()}`;
    setJobs((p) => [
      ...p,
      { id: jobId, sourceId: id, sourceName: name, status: 'running', startedAt: new Date().toISOString() },
    ]);
    setTimeout(() => {
      const now = new Date().toISOString();
      setSources((p) =>
        p.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 'ready',
                analyzedAt: now,
                summary:
                  'Analysis complete. Key concepts and document structure extracted successfully from the source URL.',
                concepts: ['documentation', 'API reference', 'user guide', 'getting started', 'integration'],
              }
            : s,
        ),
      );
      setJobs((p) =>
        p.map((j) => (j.id === jobId ? { ...j, status: 'completed', completedAt: now } : j)),
      );
    }, 2500);
  }, []);

  const addDraft = useCallback((d: RDraft) => setDrafts((p) => [...p, d]), []);

  const updateDraft = useCallback(
    (id: string, patch: Partial<RDraft>) =>
      setDrafts((p) => p.map((d) => (d.id === id ? { ...d, ...patch } : d))),
    [],
  );

  return (
    <RCContext.Provider value={{ sources, jobs, drafts, addSource, analyzeSource, addDraft, updateDraft }}>
      {children}
    </RCContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════════════════════ */

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ═══════════════════════════════════════════════════════════════════
   Shared UI atoms
═══════════════════════════════════════════════════════════════════ */

const STATUS_BADGE_MOD: Record<string, string> = {
  pending: 'ds-badge-warning',
  analyzing: 'ds-badge-info',
  ready: 'ds-badge-success',
  failed: 'ds-badge-danger',
  running: 'ds-badge-info',
  completed: 'ds-badge-success',
  'pending-review': 'ds-badge-warning',
  'sent-to-cms': 'ds-badge-success',
  discarded: 'ds-badge-neutral',
};

function StatusBadge({ status }: { status: string }) {
  const mod = STATUS_BADGE_MOD[status] ?? 'ds-badge-neutral';
  return <span className={`ds-badge ${mod}`}>{status.replace(/-/g, ' ')}</span>;
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="ds-toast">✓ {msg}</div>;
}

/* ═══════════════════════════════════════════════════════════════════
   Sidebar
═══════════════════════════════════════════════════════════════════ */

function Sidebar({ slug, isOpen, onClose }: { slug: string; isOpen: boolean; onClose: () => void }) {
  const loc = useLocation();
  const base = `/c/${slug}/admin/research`;

  function active(path: string, exact = false): boolean {
    if (exact) return loc.pathname === path || loc.pathname === `${path}/`;
    return loc.pathname.startsWith(path);
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="rc-sidebar-overlay tenant-cms-sidebar-overlay is-visible"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
      <aside id="tenant-cms-sidebar" className={`rc-sidebar tenant-cms-sidebar${isOpen ? ' is-open' : ''}`}>
        <a href={`/c/${slug}/admin/cms`} className="rc-back-link">
          ← Back to CMS
        </a>

        <p className="ds-nav-group">Intelligence</p>

        <Link
          to={base}
          className={`ds-nav-item${active(base, true) ? ' active' : ''}`}
          onClick={onClose}
        >
          <span aria-hidden="true">▣</span>Overview
        </Link>
        <Link
          to={`${base}/sources`}
          className={`ds-nav-item${active(`${base}/sources`) ? ' active' : ''}`}
          onClick={onClose}
        >
          <span aria-hidden="true">◈</span>Sources
        </Link>
        <Link
          to={`${base}/generate`}
          className={`ds-nav-item${active(`${base}/generate`) ? ' active' : ''}`}
          onClick={onClose}
        >
          <span aria-hidden="true">✦</span>Generate Draft
        </Link>
      </aside>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ResearchApp (exported entry point)
═══════════════════════════════════════════════════════════════════ */

export function ResearchApp() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ResearchProvider>
      <a href="#main-content" className="rc-skip-link">Skip to content</a>
      <div className="rc-app tenant-cms-app-view tenant-cms-app-layout">
        <Sidebar slug={slug} isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <div id="main-content" className="rc-main tenant-cms-content">
          <div className="rc-mobile-bar tenant-cms-mobile-bar">
            <button
              type="button"
              className="rc-mobile-toggle tenant-cms-mobile-toggle"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="tenant-cms-sidebar"
            >
              ☰&nbsp; Menu
            </button>
          </div>
          <Routes>
            <Route index element={<Dashboard slug={slug} />} />
            <Route path="sources" element={<Sources slug={slug} />} />
            <Route path="sources/:sourceId" element={<SourceDetail slug={slug} />} />
            <Route path="generate" element={<Generate slug={slug} />} />
            <Route path="drafts/:draftId" element={<DraftReview slug={slug} />} />
            <Route path="*" element={<Navigate to={`/c/${slug}/admin/research`} replace />} />
          </Routes>
        </div>
      </div>
    </ResearchProvider>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Page — Dashboard
═══════════════════════════════════════════════════════════════════ */

function Dashboard({ slug }: { slug: string }) {
  const { sources, jobs, drafts } = useRC();
  const base = `/c/${slug}/admin/research`;
  const pendingDrafts = drafts.filter((d) => d.status === 'pending-review');
  const readySources = sources.filter((s) => s.status === 'ready');

  return (
    <div className="rc-page">
      <div className="rc-page-header">
        <div className="rc-page-kicker">Intelligence</div>
        <div className="rc-page-header-row">
          <h1 className="ds-page-header-title">AI Research Center</h1>
          <div className="ds-page-header-actions">
            <Link to={`${base}/sources`} className="ds-btn ds-btn-secondary ds-btn-sm">
              Add Source
            </Link>
            <Link to={`${base}/generate`} className="ds-btn ds-btn-primary ds-btn-sm">
              Generate Draft
            </Link>
          </div>
        </div>
        <p className="ds-page-header-sub">Analyze sources, generate documentation, review and send to CMS.</p>
        <div className="rc-page-meta">
          <span>{readySources.length} ready for generation</span>
          <span>{pendingDrafts.length} pending review</span>
          <span>{jobs.filter((j) => j.status === 'running').length} active jobs</span>
        </div>
      </div>

      <div className="rc-stats-grid">
        <div className="ds-stat">
          <span className="ds-stat-label">Sources</span>
          <span className="ds-stat-value">{sources.length}</span>
          <span className="ds-stat-delta">{readySources.length} analyzed</span>
        </div>
        <div className="ds-stat rc-stat-blue">
          <span className="ds-stat-label">Jobs</span>
          <span className="ds-stat-value">{jobs.length}</span>
          <span className="ds-stat-delta">{jobs.filter((j) => j.status === 'completed').length} completed</span>
        </div>
        <div className="ds-stat rc-stat-amber">
          <span className="ds-stat-label">Drafts</span>
          <span className="ds-stat-value">{drafts.length}</span>
          <span className="ds-stat-delta">{pendingDrafts.length} pending review</span>
        </div>
        <div className="ds-stat rc-stat-green">
          <span className="ds-stat-label">In CMS</span>
          <span className="ds-stat-value">{drafts.filter((d) => d.status === 'sent-to-cms').length}</span>
          <span className="ds-stat-delta">sent to CMS</span>
        </div>
      </div>

      <div className="rc-panels-row">
        <div className="rc-panel">
          <div className="rc-panel-header">
            <span className="rc-panel-title">Recent Jobs</span>
          </div>
          <div className="rc-panel-body">
            {jobs.length === 0 ? (
              <p className="rc-panel-empty">No analysis jobs yet.</p>
            ) : (
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {[...jobs].reverse().slice(0, 6).map((j) => (
                    <tr key={j.id}>
                      <td>{j.sourceName}</td>
                      <td>
                        <StatusBadge status={j.status} />
                      </td>
                      <td style={{ color: '#9aaabb', fontSize: 12 }}>{fmtDateTime(j.startedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rc-panel">
          <div className="rc-panel-header">
            <span className="rc-panel-title">Pending Review</span>
            {pendingDrafts.length > 0 && (
              <span className="ds-badge ds-badge-warning">{pendingDrafts.length}</span>
            )}
          </div>
          <div className="rc-panel-body">
            {pendingDrafts.length === 0 ? (
              <p className="rc-panel-empty">No drafts awaiting review.</p>
            ) : (
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Source</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDrafts.map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.title}</td>
                      <td style={{ color: '#9aaabb', fontSize: 12 }}>{d.sourceName}</td>
                      <td>
                        <Link to={`${base}/drafts/${d.id}`} className="ds-btn ds-btn-secondary ds-btn-sm">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Page — Sources Library
═══════════════════════════════════════════════════════════════════ */

function Sources({ slug }: { slug: string }) {
  const { sources, addSource, analyzeSource } = useRC();
  const [showModal, setShowModal] = useState(false);
  const base = `/c/${slug}/admin/research`;

  return (
    <div className="rc-page">
      <div className="rc-page-header">
        <div className="rc-page-kicker">Intelligence · Sources</div>
        <div className="rc-page-header-row">
          <h1 className="ds-page-header-title">Sources Library</h1>
          <button type="button" className="ds-btn ds-btn-primary" onClick={() => setShowModal(true)}>
            + Add Source
          </button>
        </div>
        <p className="ds-page-header-sub">Add website or documentation URLs to analyze and extract knowledge.</p>
        <div className="rc-page-meta">
          <span>{sources.length} total sources</span>
          <span>{sources.filter((src) => src.status === 'ready').length} analyzed</span>
          <span>{sources.filter((src) => src.status === 'pending').length} waiting to run</span>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="ds-empty-state">
          <div className="ds-empty-state-icon">◈</div>
          <h3 className="ds-empty-state-title">No sources yet</h3>
          <p className="ds-empty-state-body">Add a URL to start analyzing documentation.</p>
          <button type="button" className="ds-btn ds-btn-primary" onClick={() => setShowModal(true)}>
            + Add your first source
          </button>
        </div>
      ) : (
        <div className="rc-sources-grid">
          {sources.map((src) => (
            <div key={src.id} className="rc-source-card">
              <div className="rc-source-card-header">
                <span className="rc-source-card-name">{src.name}</span>
                <StatusBadge status={src.status} />
              </div>
              <span className="rc-source-card-url">{src.url}</span>
              <div className="rc-source-card-meta">
                <span className="rc-source-type">{src.type === 'docs' ? '📄 Docs' : '🌐 Website'}</span>
                <span style={{ fontSize: 11, color: '#9aaabb' }}>Added {fmtDate(src.addedAt)}</span>
              </div>
              <div className="rc-source-card-actions">
                {src.status === 'pending' && (
                  <button
                    type="button"
                    className="ds-btn ds-btn-primary ds-btn-sm"
                    onClick={() => analyzeSource(src.id, src.name)}
                  >
                    Analyze
                  </button>
                )}
                {src.status === 'analyzing' && (
                  <button type="button" className="ds-btn ds-btn-secondary ds-btn-sm" disabled>
                    Analyzing…
                  </button>
                )}
                {src.status === 'ready' && (
                  <Link to={`${base}/sources/${src.id}`} className="ds-btn ds-btn-secondary ds-btn-sm">
                    View Analysis
                  </Link>
                )}
                {src.status === 'failed' && (
                  <button
                    type="button"
                    className="ds-btn ds-btn-secondary ds-btn-sm"
                    onClick={() => analyzeSource(src.id, src.name)}
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddSourceModal
          onClose={() => setShowModal(false)}
          onAdd={(src) => {
            addSource(src);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddSourceModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: RSource) => void }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<SourceType>('website');
  const [err, setErr] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setErr('Name and URL are required.');
      return;
    }
    try {
      new URL(url.trim());
    } catch {
      setErr('Enter a valid URL (include https://).');
      return;
    }
    onAdd({
      id: newId(),
      name: name.trim(),
      url: url.trim(),
      type,
      status: 'pending',
      addedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="ds-dialog-backdrop" onClick={onClose}>
      <div className="ds-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ds-dialog-header">
          <h3 className="ds-dialog-title">Add Source</h3>
        </div>
        <form onSubmit={submit}>
          <div className="ds-dialog-body">
            <p style={{ marginTop: 0, marginBottom: 'var(--ds-space-4)' }}>
              Add a documentation or website URL to extract reusable knowledge for draft generation.
            </p>
            <div className="ds-field">
              <label className="ds-label" htmlFor="src-name">Source name</label>
              <input
                id="src-name"
                className="ds-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="DocPilot Documentation"
                required
                autoFocus
              />
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="src-url">URL</label>
              <input
                id="src-url"
                className="ds-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.example.com"
                required
              />
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="src-type">Source type</label>
              <select
                id="src-type"
                className="ds-select"
                value={type}
                onChange={(e) => setType(e.target.value as SourceType)}
              >
                <option value="website">Website URL</option>
                <option value="docs">Documentation URL</option>
              </select>
            </div>
            {err && <div className="ds-alert ds-alert-danger">{err}</div>}
          </div>
          <div className="ds-dialog-footer">
            <button type="button" className="ds-btn ds-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ds-btn ds-btn-primary">
              Add Source
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Page — Source Analysis
═══════════════════════════════════════════════════════════════════ */

function SourceDetail({ slug }: { slug: string }) {
  const { sourceId } = useParams<{ sourceId: string }>();
  const { sources } = useRC();
  const navigate = useNavigate();
  const base = `/c/${slug}/admin/research`;
  const src = sources.find((s) => s.id === sourceId);

  if (!src) {
    return (
      <div className="rc-page">
        <p style={{ color: '#9aaabb' }}>Source not found.</p>
        <Link to={`${base}/sources`} className="ds-btn ds-btn-secondary" style={{ marginTop: 12, display: 'inline-flex' }}>
          ← Back to Sources
        </Link>
      </div>
    );
  }

  return (
    <div className="rc-page">
      <div className="rc-page-header">
        <div className="rc-page-kicker">
          <Link to={`${base}/sources`} style={{ color: 'inherit', textDecoration: 'none' }}>
            Sources
          </Link>
          {' · '}Analysis
        </div>
        <div className="rc-page-header-row">
          <h1 className="ds-page-header-title">{src.name}</h1>
          <StatusBadge status={src.status} />
        </div>
      </div>

      {src.status !== 'ready' ? (
        <div className="rc-info-card" style={{ maxWidth: 520 }}>
          <p style={{ color: '#6b7a92', fontSize: 14, margin: '0 0 14px' }}>
            {src.status === 'analyzing'
              ? 'Analysis in progress… This may take a few moments.'
              : 'This source has not been analyzed yet. Go back to Sources Library and click Analyze.'}
          </p>
          <Link to={`${base}/sources`} className="ds-btn ds-btn-secondary ds-btn-sm" style={{ display: 'inline-flex' }}>
            ← Sources Library
          </Link>
        </div>
      ) : (
        <div className="rc-analysis-layout">
          <div className="rc-analysis-col">
            <div className="rc-info-card">
              <h3 className="rc-info-card-title">Source Information</h3>
              <div className="rc-info-row">
                <span className="rc-info-label">URL</span>
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="rc-info-value">
                  {src.url}
                </a>
              </div>
              <div className="rc-info-row">
                <span className="rc-info-label">Type</span>
                <span className="rc-info-value">{src.type === 'docs' ? 'Documentation URL' : 'Website URL'}</span>
              </div>
              <div className="rc-info-row">
                <span className="rc-info-label">Added</span>
                <span className="rc-info-value">{fmtDate(src.addedAt)}</span>
              </div>
              {src.analyzedAt && (
                <div className="rc-info-row">
                  <span className="rc-info-label">Analyzed</span>
                  <span className="rc-info-value">{fmtDateTime(src.analyzedAt)}</span>
                </div>
              )}
            </div>

            {src.concepts && (
              <div className="rc-info-card">
                <h3 className="rc-info-card-title">Extracted Concepts</h3>
                <div className="rc-concepts">
                  {src.concepts.map((c) => (
                    <span key={c} className="rc-concept-tag">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rc-analysis-col">
            {src.summary && (
              <div className="rc-info-card">
                <h3 className="rc-info-card-title">Analysis Summary</h3>
                <p className="rc-summary-text">{src.summary}</p>
              </div>
            )}

            <div className="rc-info-card">
              <h3 className="rc-info-card-title">Suggested Output</h3>
              <div className="rc-output-card">
                <div className="rc-output-icon">📄</div>
                <div className="rc-output-info">
                  <div className="rc-output-title">Getting Started Guide</div>
                  <div className="rc-output-desc">
                    A step-by-step guide for new users, based on this source.
                  </div>
                </div>
                <button
                  type="button"
                  className="ds-btn ds-btn-primary ds-btn-sm"
                  onClick={() => navigate(`${base}/generate?source=${src.id}`)}
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Page — Draft Generation
═══════════════════════════════════════════════════════════════════ */

function Generate({ slug }: { slug: string }) {
  const { sources, addDraft } = useRC();
  const navigate = useNavigate();
  const loc = useLocation();
  const base = `/c/${slug}/admin/research`;

  const preselect = new URLSearchParams(loc.search).get('source') ?? '';
  const readySources = sources.filter((s) => s.status === 'ready');

  const [sourceId, setSourceId] = useState(preselect || readySources[0]?.id || '');
  const [busy, setBusy] = useState(false);

  const selectedSource = sources.find((s) => s.id === sourceId);

  function generate() {
    if (!selectedSource) return;
    setBusy(true);
    setTimeout(() => {
      const draft: RDraft = {
        id: newId(),
        title: `Getting Started with ${selectedSource.name}`,
        sourceId: selectedSource.id,
        sourceName: selectedSource.name,
        status: 'pending-review',
        createdAt: new Date().toISOString(),
        content: buildContent(selectedSource),
      };
      addDraft(draft);
      navigate(`${base}/drafts/${draft.id}`);
    }, 1800);
  }

  return (
    <div className="rc-page">
      <div className="rc-page-header">
        <div className="rc-page-kicker">Intelligence · Generate</div>
        <h1 className="ds-page-header-title">Generate Getting Started Guide</h1>
        <p className="ds-page-header-sub">
          Choose an analyzed source to generate a structured Getting Started guide.
        </p>
        <div className="rc-page-meta">
          <span>{readySources.length} analyzed sources available</span>
          <span>Output type is fixed for consistency</span>
          <span>Draft opens in review immediately after generation</span>
        </div>
      </div>

      <div className="rc-generate-card">
        {readySources.length === 0 ? (
          <div className="rc-generate-section" style={{ borderTop: 0, paddingTop: 24 }}>
            <p style={{ color: '#9aaabb', fontSize: 14, margin: 0 }}>
              No analyzed sources available. Add and analyze a source first.
            </p>
            <Link
              to={`${base}/sources`}
              className="ds-btn ds-btn-secondary ds-btn-sm"
              style={{ marginTop: 12, display: 'inline-flex' }}
            >
              Go to Sources
            </Link>
          </div>
        ) : (
          <>
            <div className="rc-generate-section" style={{ borderTop: 0, paddingTop: 24 }}>
              <label className="rc-generate-label" htmlFor="gen-source">
                Source
              </label>
              <select
                id="gen-source"
                className="ds-select"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              >
                {readySources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rc-generate-section">
              <span className="rc-generate-label">Output type</span>
              <div className="rc-generate-locked">📄 Getting Started Guide</div>
              <span className="rc-generate-note">MVP: only Getting Started Guide is available.</span>
            </div>

            <div className="rc-generate-section">
              <span className="rc-generate-label">Audience</span>
              <div className="rc-generate-locked">👤 New users</div>
            </div>

            <div className="rc-generate-section">
              <span className="rc-generate-label">Tone</span>
              <div className="rc-generate-locked">✍️ Professional and friendly</div>
            </div>

            <div className="rc-generate-section" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <button
                type="button"
                className="ds-btn ds-btn-primary"
                onClick={generate}
                disabled={busy || !sourceId}
              >
                {busy ? 'Generating…' : '✦ Generate Draft'}
              </button>
              {busy && (
                <span style={{ fontSize: 13, color: '#9aaabb' }}>Creating draft…</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function buildContent(src: RSource): string {
  const name = src.name;
  const conceptLines =
    src.concepts
      ? src.concepts
          .slice(0, 4)
          .map((c) => `- **${c.charAt(0).toUpperCase() + c.slice(1)}** — browse related content`)
          .join('\n')
      : '- Browse available sections using the navigation';

  return `# Getting Started with ${name}

## Introduction

Welcome! This guide will help you get up and running with ${name} quickly.

${src.summary ? `${src.summary}\n` : ''}
## Prerequisites

Before you begin, make sure you have:

- Access credentials provided by your account manager
- A modern web browser (Chrome, Firefox, or Edge recommended)
- Stable internet connection

## Step 1: Log In

Navigate to your company portal and enter your email and password. If you haven't received credentials yet, contact your account manager.

## Step 2: Explore the Dashboard

Once logged in, you'll see your dashboard. This gives you a high-level overview of all available content and features.

## Step 3: Find What You Need

Use the navigation on the left to explore different sections:

${conceptLines}

## Step 4: Get Help

If you have questions, reach out to your account manager or use the support section in your portal.

---

*Generated by DocPilot AI Research Center from: ${src.url}*`;
}

/* ═══════════════════════════════════════════════════════════════════
   Page — Draft Review
═══════════════════════════════════════════════════════════════════ */

function DraftReview({ slug }: { slug: string }) {
  const { draftId } = useParams<{ draftId: string }>();
  const { drafts, updateDraft } = useRC();
  const navigate = useNavigate();
  const base = `/c/${slug}/admin/research`;
  const [toast, setToast] = useState('');

  const draft = drafts.find((d) => d.id === draftId);

  if (!draft) {
    return (
      <div className="rc-page">
        <p style={{ color: '#9aaabb' }}>Draft not found.</p>
        <Link to={base} className="ds-btn ds-btn-secondary" style={{ marginTop: 12, display: 'inline-flex' }}>
          ← Overview
        </Link>
      </div>
    );
  }

  function sendToCMS() {
    if (!draft) return;
    updateDraft(draft.id, { status: 'sent-to-cms' });
    setToast('Draft sent to CMS successfully.');
  }

  function discard() {
    if (!draft) return;
    if (!window.confirm('Discard this draft? This cannot be undone.')) return;
    updateDraft(draft.id, { status: 'discarded' });
    navigate(base);
  }

  return (
    <div className="rc-page">
      <div className="rc-page-header">
        <div className="rc-page-kicker">
          <Link to={base} style={{ color: 'inherit', textDecoration: 'none' }}>
            Overview
          </Link>
          {' · '}Draft Review
        </div>
        <div className="rc-page-header-row">
          <h1 className="ds-page-header-title">{draft.title}</h1>
          <StatusBadge status={draft.status} />
        </div>
        <p className="ds-page-header-sub">
          Source: {draft.sourceName} · Created {fmtDate(draft.createdAt)}
        </p>
        <div className="rc-page-meta">
          <span>Review content before publishing</span>
          <span>Draft source: {draft.sourceName}</span>
        </div>
      </div>

      <div className="rc-draft-layout">
        <div className="rc-draft-preview">
          <div className="rc-draft-preview-bar">Draft Preview</div>
          <div className="rc-draft-content">
            <DraftMarkdown content={draft.content} />
          </div>
        </div>

        <div className="rc-draft-actions">
          <div className="rc-draft-actions-title">Actions</div>

          <div className="rc-draft-meta">
            <div>
              <div className="rc-meta-label">Status</div>
              <div style={{ marginTop: 6 }}>
                <StatusBadge status={draft.status} />
              </div>
            </div>
            <div>
              <div className="rc-meta-label">Source</div>
              <div className="rc-meta-value">{draft.sourceName}</div>
            </div>
          </div>

          {draft.status === 'pending-review' && (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-primary"
                onClick={sendToCMS}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Send to CMS
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-danger"
                onClick={discard}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Discard Draft
              </button>
            </>
          )}

          {draft.status === 'sent-to-cms' && (
            <div className="ds-alert ds-alert-success">
              ✓ This draft has been sent to the CMS and is available as a new document draft.
            </div>
          )}

          {draft.status === 'discarded' && (
            <div style={{ fontSize: 13, color: '#9aaabb' }}>This draft has been discarded.</div>
          )}

          <Link
            to={base}
            className="ds-btn ds-btn-secondary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            ← Back to Overview
          </Link>
        </div>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Minimal markdown renderer (headings / paragraphs / lists / bold)
═══════════════════════════════════════════════════════════════════ */

function DraftMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const nodes: ReactNode[] = [];
  let k = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('# ')) {
      nodes.push(<h1 key={k++}>{parseBold(line.slice(2))}</h1>);
    } else if (line.startsWith('## ')) {
      nodes.push(<h2 key={k++}>{parseBold(line.slice(3))}</h2>);
    } else if (line.startsWith('### ')) {
      nodes.push(<h3 key={k++}>{parseBold(line.slice(4))}</h3>);
    } else if (line.startsWith('- ')) {
      nodes.push(<li key={k++}>{parseBold(line.slice(2))}</li>);
    } else if (line.startsWith('---')) {
      nodes.push(<hr key={k++} style={{ border: 0, borderTop: '1px solid #e8edf5', margin: '20px 0' }} />);
    } else if (line.trim() === '') {
      nodes.push(<br key={k++} />);
    } else {
      nodes.push(<p key={k++}>{parseBold(line)}</p>);
    }
  }

  // Wrap consecutive <li> in <ul>
  const result: ReactNode[] = [];
  let listBuf: ReactNode[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i] as React.ReactElement;
    if (el && el.type === 'li') {
      listBuf.push(el);
    } else {
      if (listBuf.length > 0) {
        result.push(<ul key={`ul-${i}`}>{listBuf}</ul>);
        listBuf = [];
      }
      result.push(el);
    }
  }
  if (listBuf.length > 0) result.push(<ul key="ul-end">{listBuf}</ul>);

  return <>{result}</>;
}

function parseBold(text: string): ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}
