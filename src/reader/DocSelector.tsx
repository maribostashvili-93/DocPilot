import { useEffect, useMemo, useRef, useState } from 'react';

export type DocSelectorItem = {
  id: string;
  title: string;
  productName: string | null;
};

export function DocSelector({
  items,
  currentDocId,
  onPick,
}: {
  items: DocSelectorItem[];
  currentDocId: string;
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement | null>(null);
  const current = items.find((d) => d.id === currentDocId) ?? items[0];

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? items.filter((d) => d.title.toLowerCase().includes(q) || (d.productName ?? '').toLowerCase().includes(q))
      : items;
    const map = new Map<string, DocSelectorItem[]>();
    filtered.forEach((d) => {
      const key = d.productName ?? 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });
    return Array.from(map.entries());
  }, [items, query]);

  if (!current) return null;

  return (
    <div className="doc-selector" ref={ref}>
      <button
        type="button"
        className="doc-selector-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="doc-selector-label">{current.title}</span>
        <span className="doc-selector-caret" aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div className="doc-selector-popover" role="listbox">
          <input
            autoFocus
            className="doc-selector-search"
            placeholder="Find a document…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="doc-selector-list">
            {grouped.length === 0 ? (
              <div className="doc-selector-empty">No matches</div>
            ) : (
              grouped.map(([group, docs]) => (
                <div key={group} className="doc-selector-group">
                  <div className="doc-selector-group-label">{group}</div>
                  {docs.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      role="option"
                      aria-selected={d.id === currentDocId}
                      className={`doc-selector-item${d.id === currentDocId ? ' active' : ''}`}
                      onClick={() => { onPick(d.id); setOpen(false); }}
                    >
                      {d.title}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
