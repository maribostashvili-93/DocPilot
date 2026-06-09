import { useCallback, useEffect, useRef, useState } from 'react';
import { useTenant } from './TenantContext';

interface Comment {
  id: string;
  author_id: string;
  author_name: string | null;
  author_email: string | null;
  body: string;
  is_blocking: 0 | 1;
  resolved: 0 | 1;
  resolved_by: string | null;
  resolved_at: string | null;
  parent_id: string | null;
  created_at: string;
}

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

export function SectionCommentPanel({ sectionId }: { sectionId: string }) {
  const tenant = useTenant();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    if (!tenant) return;
    setLoading(true); setErr(null);
    try {
      const data = await apiJson<{ comments: Comment[] }>(
        `/api/v2/companies/${tenant.companyId}/sections/${sectionId}/comments`,
      );
      setComments(data.comments);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load comments.');
    } finally {
      setLoading(false);
    }
  }, [tenant, sectionId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function submit() {
    if (!tenant || !body.trim()) return;
    setSubmitting(true); setErr(null);
    try {
      await apiJson(`/api/v2/companies/${tenant.companyId}/sections/${sectionId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: body.trim(), isBlocking }),
      });
      setBody('');
      setIsBlocking(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function resolve(commentId: string) {
    if (!tenant) return;
    try {
      await apiJson(`/api/v2/companies/${tenant.companyId}/comments/${commentId}/resolve`, {
        method: 'PUT',
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to resolve comment.');
    }
  }

  const blockingCount = comments.filter((c) => c.is_blocking && !c.resolved).length;
  const totalOpen = comments.filter((c) => !c.resolved).length;

  if (!tenant) return null;

  return (
    <div className="sc-panel">
      <button
        type="button"
        className={`sc-toggle${open ? ' is-open' : ''}${blockingCount > 0 ? ' has-blocking' : ''}`}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setTimeout(() => textareaRef.current?.focus(), 120);
        }}
        aria-expanded={open}
      >
        <span className="sc-toggle-icon" aria-hidden="true">💬</span>
        <span className="sc-toggle-label">
          Comments
          {totalOpen > 0 && <span className="sc-count">{totalOpen}</span>}
          {blockingCount > 0 && (
            <span className="ds-badge ds-badge-danger sc-blocking-badge">{blockingCount} blocking</span>
          )}
        </span>
        <span className="sc-chevron" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="sc-body">
          {err && <div className="ds-alert ds-alert-danger sc-err">{err}</div>}

          <div className="sc-list" aria-live="polite">
            {loading && <p className="sc-loading">Loading…</p>}
            {!loading && comments.length === 0 && (
              <p className="sc-empty">No comments yet. Be the first.</p>
            )}
            {comments.map((c) => (
              <div
                key={c.id}
                className={`ds-section-comment${c.is_blocking ? ' is-blocking' : ''}${c.resolved ? ' is-resolved' : ''}`}
              >
                <div className="sc-comment-meta">
                  <span className="sc-comment-author">
                    {c.author_name ?? c.author_email ?? 'Unknown'}
                  </span>
                  <span className="sc-comment-time">{fmtTime(c.created_at)}</span>
                  {c.is_blocking === 1 && !c.resolved && (
                    <span className="ds-badge ds-badge-danger">Blocking</span>
                  )}
                  {c.resolved === 1 && (
                    <span className="ds-badge ds-badge-neutral">Resolved</span>
                  )}
                </div>
                <p className="sc-comment-body">{c.body}</p>
                {c.resolved === 0 && (
                  <button
                    type="button"
                    className="ds-btn ds-btn-sm ds-btn-ghost sc-resolve-btn"
                    onClick={() => resolve(c.id)}
                  >
                    ✓ Resolve
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="sc-form">
            <textarea
              ref={textareaRef}
              className="ds-textarea sc-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a comment…"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
              }}
            />
            <div className="sc-form-row">
              <label className="sc-blocking-label">
                <input
                  type="checkbox"
                  checked={isBlocking}
                  onChange={(e) => setIsBlocking(e.target.checked)}
                />
                Mark as blocking
              </label>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={submit}
                disabled={submitting || !body.trim()}
              >
                {submitting ? 'Posting…' : 'Comment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
