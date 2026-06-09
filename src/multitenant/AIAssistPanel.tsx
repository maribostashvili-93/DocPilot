import { useState } from 'react';
import { useTenant } from './TenantContext';

interface Props {
  sectionId: string;
  sectionHtml: string;
  onApply?: (newHtml: string) => void;
}

type Task = 'rewrite' | 'translate';

export function AIAssistPanel({ sectionId, sectionHtml, onApply }: Props) {
  const tenant = useTenant();
  const [task, setTask] = useState<Task>('rewrite');
  const [instruction, setInstruction] = useState('');
  const [fromLocale, setFromLocale] = useState('en');
  const [toLocale, setToLocale] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const cid = tenant?.companyId ?? '';

  async function run() {
    if (!cid) return;
    setBusy(true);
    setError('');
    setResult('');
    try {
      let url = '';
      let payload: Record<string, string> = {};

      if (task === 'rewrite') {
        url = `/api/v2/companies/${cid}/ai/sections/${sectionId}/rewrite`;
        payload = { body: sectionHtml, instruction: instruction.trim() };
      } else {
        if (!toLocale.trim()) { setError('Target locale is required.'); setBusy(false); return; }
        url = `/api/v2/companies/${cid}/ai/sections/${sectionId}/translate`;
        payload = { body: sectionHtml, fromLocale, toLocale: toLocale.trim() };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { rewrittenBody?: string; translatedBody?: string; error?: string };
      if (!res.ok) { setError(data.error ?? `Error ${res.status}`); return; }
      const output = data.rewrittenBody ?? data.translatedBody ?? '';
      setResult(output);
    } catch {
      setError('Request failed. Check your connection.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="ai-assist-panel">
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--ds-border-default)' }}>
        <p className="ds-eyebrow" style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ds-text-secondary)', margin: '0 0 4px' }}>
          AI Assist
        </p>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Generate draft changes</h3>
        <p style={{ fontSize: 12.5, color: 'var(--ds-text-secondary)', margin: 0 }}>
          Suggestions stay in draft until reviewed and approved.
        </p>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="ds-field">
          <label className="ds-label" htmlFor="ai-task">Task</label>
          <select
            id="ai-task"
            className="ds-select"
            value={task}
            onChange={(e) => setTask(e.target.value as Task)}
          >
            <option value="rewrite">Rewrite / improve clarity</option>
            <option value="translate">Translate to locale</option>
          </select>
        </div>

        {task === 'rewrite' && (
          <div className="ds-field">
            <label className="ds-label" htmlFor="ai-instruction">Custom instruction (optional)</label>
            <input
              id="ai-instruction"
              className="ds-input"
              placeholder="e.g. Make it more concise"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
          </div>
        )}

        {task === 'translate' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="ds-field">
              <label className="ds-label" htmlFor="ai-from">From</label>
              <input id="ai-from" className="ds-input" value={fromLocale} onChange={(e) => setFromLocale(e.target.value)} placeholder="en" />
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="ai-to">To</label>
              <input id="ai-to" className="ds-input" value={toLocale} onChange={(e) => setToLocale(e.target.value)} placeholder="ka" autoFocus />
            </div>
          </div>
        )}

        {error && <div className="ds-alert ds-alert-danger" style={{ fontSize: 13 }}>{error}</div>}

        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-sm"
          onClick={run}
          disabled={busy}
        >
          {busy ? 'Generating…' : '✦ Generate Suggestion'}
        </button>

        {result && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ds-text-secondary)', marginBottom: 6 }}>
              AI suggestion — review before applying:
            </div>
            <div
              style={{
                border: '1px solid var(--ds-border-default)', borderRadius: 8,
                padding: '10px 12px', fontSize: 13, background: 'var(--ds-bg-surface)',
                maxHeight: 260, overflow: 'auto', wordBreak: 'break-word',
              }}
              dangerouslySetInnerHTML={{ __html: result }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="ds-btn ds-btn-secondary ds-btn-sm"
                onClick={() => setResult('')}
              >
                Dismiss
              </button>
              {onApply && (
                <button
                  type="button"
                  className="ds-btn ds-btn-primary ds-btn-sm"
                  onClick={() => { onApply(result); setResult(''); }}
                >
                  Apply to draft
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
