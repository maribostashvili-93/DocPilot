import { useCallback, useEffect, useState } from 'react';
import { useTenant } from './TenantContext';

/* ── Types ─────────────────────────────────────────────────────────── */

interface TranslationLocale {
  id: string;
  locale: string;
  status: string;
  completion_pct: number;
}

interface TranslationString {
  id: string;
  key: string;
  source_value: string;
  translated_value: string | null;
  status: string;
}

/* ── Constants ─────────────────────────────────────────────────────── */

const LOCALE_NAMES: Record<string, string> = {
  'ka':    'Georgian',
  'ka-GE': 'Georgian (Georgia)',
  'en':    'English',
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'ru':    'Russian',
  'ru-RU': 'Russian (Russia)',
  'tr':    'Turkish',
  'tr-TR': 'Turkish (Turkey)',
  'de':    'German',
  'de-DE': 'German (Germany)',
  'fr':    'French',
  'fr-FR': 'French (France)',
  'es':    'Spanish',
  'es-ES': 'Spanish (Spain)',
  'uk':    'Ukrainian',
  'uk-UA': 'Ukrainian (Ukraine)',
  'pl':    'Polish',
  'ar':    'Arabic',
  'zh':    'Chinese',
  'zh-CN': 'Chinese (Simplified)',
  'ja':    'Japanese',
};

const STATUS_BADGE: Record<string, string> = {
  'not-started': 'ds-badge-neutral',
  'in-progress': 'ds-badge-info',
  'complete':    'ds-badge-success',
  'needs-review':'ds-badge-warning',
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

/* ── TranslationLocaleManager ──────────────────────────────────────── */

export function TranslationLocaleManager({
  documentId,
  sectionIds = [],
}: {
  documentId: string;
  sectionIds?: string[];
}) {
  const tenant = useTenant();
  const [locales, setLocales] = useState<TranslationLocale[]>([]);
  const [activeLocale, setActiveLocale] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [addingLocale, setAddingLocale] = useState(false);
  const [newLocale, setNewLocale] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!tenant) return;
    setLoading(true); setErr(null);
    try {
      const data = await apiJson<{ locales: TranslationLocale[] }>(
        `/api/v2/companies/${tenant.companyId}/documents/${documentId}/locales`,
      );
      setLocales(data.locales);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load locales.');
    } finally {
      setLoading(false);
    }
  }, [tenant, documentId]);

  useEffect(() => { load(); }, [load]);

  async function addLocale() {
    if (!tenant || !newLocale.trim()) return;
    setAdding(true); setErr(null);
    try {
      await apiJson(`/api/v2/companies/${tenant.companyId}/documents/${documentId}/locales`, {
        method: 'POST',
        body: JSON.stringify({ locale: newLocale.trim() }),
      });
      setNewLocale('');
      setAddingLocale(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to add locale.');
    } finally {
      setAdding(false);
    }
  }

  const belowThreshold = locales.filter((l) => l.completion_pct < 90);

  if (!tenant) return null;

  return (
    <div className="tlm-root">
      <div className="tlm-header">
        <h3 className="tlm-title">Translations</h3>
        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-sm"
          onClick={() => setAddingLocale(true)}
        >
          + Add Language
        </button>
      </div>

      {err && <div className="ds-alert ds-alert-danger">{err}</div>}

      {belowThreshold.length > 0 && (
        <div className="ds-alert ds-alert-warning tlm-threshold-warn">
          ⚠ {belowThreshold.length === 1
            ? `${LOCALE_NAMES[belowThreshold[0].locale] ?? belowThreshold[0].locale} is below the 90% release threshold (${belowThreshold[0].completion_pct}%)`
            : `${belowThreshold.length} languages are below the 90% release threshold`}
        </div>
      )}

      {loading && <p className="tlm-loading">Loading…</p>}

      {locales.length === 0 && !loading && (
        <div className="ds-empty-state">
          <div className="ds-empty-state-icon">🌐</div>
          <h3 className="ds-empty-state-title">No languages yet</h3>
          <p className="ds-empty-state-body">Add a language to start managing translations for this document.</p>
        </div>
      )}

      <div className="tlm-locale-list">
        {locales.map((loc) => (
          <button
            key={loc.locale}
            type="button"
            className={`tlm-locale-item${activeLocale === loc.locale ? ' is-active' : ''}`}
            onClick={() => setActiveLocale(activeLocale === loc.locale ? null : loc.locale)}
          >
            <div className="tlm-locale-top">
              <span className="tlm-locale-name">
                {LOCALE_NAMES[loc.locale] ?? loc.locale}
                <span className="tlm-locale-code">{loc.locale}</span>
              </span>
              <span className={`ds-badge ${STATUS_BADGE[loc.status] ?? 'ds-badge-neutral'}`}>
                {loc.status.replace(/-/g, ' ')}
              </span>
            </div>
            <div className="tlm-progress-row">
              <div className="ds-progress">
                <div
                  className={`ds-progress-fill ${loc.completion_pct >= 90 ? 'success' : loc.completion_pct >= 50 ? 'warning' : 'danger'}`}
                  style={{ width: `${loc.completion_pct}%` }}
                />
              </div>
              <span className="tlm-pct">{loc.completion_pct}%</span>
            </div>
          </button>
        ))}
      </div>

      {activeLocale && sectionIds.length > 0 && (
        <TranslationStringsEditor
          locale={activeLocale}
          sectionIds={sectionIds}
          localeName={LOCALE_NAMES[activeLocale] ?? activeLocale}
        />
      )}

      {addingLocale && (
        <div className="ds-dialog-backdrop" onClick={() => !adding && setAddingLocale(false)}>
          <div className="ds-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ds-dialog-header">
              <h3 className="ds-dialog-title">Add Language</h3>
            </div>
            <div className="ds-dialog-body">
              <div className="ds-field">
                <label className="ds-label" htmlFor="tlm-locale-input">Language code</label>
                <input
                  id="tlm-locale-input"
                  className="ds-input"
                  value={newLocale}
                  onChange={(e) => setNewLocale(e.target.value)}
                  placeholder="e.g. ka, ru, de, fr"
                  list="tlm-locale-options"
                  autoFocus
                />
                <datalist id="tlm-locale-options">
                  {Object.entries(LOCALE_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </datalist>
              </div>
            </div>
            <div className="ds-dialog-footer">
              <button
                type="button"
                className="ds-btn ds-btn-ghost ds-btn-sm"
                onClick={() => setAddingLocale(false)}
                disabled={adding}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={addLocale}
                disabled={adding || !newLocale.trim()}
              >
                {adding ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── TranslationStringsEditor ──────────────────────────────────────── */

function TranslationStringsEditor({
  locale,
  sectionIds,
  localeName,
}: {
  locale: string;
  sectionIds: string[];
  localeName: string;
}) {
  const tenant = useTenant();
  const [activeSectionId, setActiveSectionId] = useState(sectionIds[0] ?? '');
  const [strings, setStrings] = useState<TranslationString[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadStrings = useCallback(async () => {
    if (!tenant || !activeSectionId) return;
    setLoading(true); setErr(null); setDrafts({});
    try {
      const data = await apiJson<{ strings: TranslationString[] }>(
        `/api/v2/companies/${tenant.companyId}/sections/${activeSectionId}/strings/${locale}`,
      );
      setStrings(data.strings);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load strings.');
    } finally {
      setLoading(false);
    }
  }, [tenant, activeSectionId, locale]);

  useEffect(() => { loadStrings(); }, [loadStrings]);

  async function saveString(key: string) {
    if (!tenant) return;
    const value = drafts[key];
    if (value === undefined) return;
    setSaving(key); setErr(null);
    try {
      await apiJson(
        `/api/v2/companies/${tenant.companyId}/sections/${activeSectionId}/strings/${locale}`,
        { method: 'PUT', body: JSON.stringify({ key, value }) },
      );
      await loadStrings();
      setDrafts((prev) => { const next = { ...prev }; delete next[key]; return next; });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="tse-root">
      <div className="tse-header">
        <strong className="tse-title">{localeName}</strong>
        {sectionIds.length > 1 && (
          <select
            className="ds-select"
            value={activeSectionId}
            onChange={(e) => setActiveSectionId(e.target.value)}
          >
            {sectionIds.map((sid, i) => (
              <option key={sid} value={sid}>Section {i + 1}</option>
            ))}
          </select>
        )}
      </div>

      {err && <div className="ds-alert ds-alert-danger">{err}</div>}
      {loading && <p className="tse-loading">Loading strings…</p>}

      <div className="tse-strings">
        {strings.map((s) => (
          <div key={s.key} className="tse-row">
            <div className="tse-source">
              <span className="tse-key">{s.key}</span>
              <p className="tse-source-text">{s.source_value}</p>
            </div>
            <div className="tse-translation">
              <textarea
                className="ds-textarea tse-textarea"
                value={drafts[s.key] ?? s.translated_value ?? ''}
                placeholder="Enter translation…"
                rows={2}
                onChange={(e) => setDrafts((p) => ({ ...p, [s.key]: e.target.value }))}
              />
              {drafts[s.key] !== undefined && drafts[s.key] !== (s.translated_value ?? '') && (
                <button
                  type="button"
                  className="ds-btn ds-btn-primary ds-btn-sm"
                  onClick={() => saveString(s.key)}
                  disabled={saving === s.key}
                >
                  {saving === s.key ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
          </div>
        ))}
        {!loading && strings.length === 0 && (
          <p className="tse-empty">No translatable strings in this section yet.</p>
        )}
      </div>
    </div>
  );
}
