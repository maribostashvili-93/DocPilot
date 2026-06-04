import { useEffect, useMemo, useRef, useState } from 'react';

type Anchor = { id: string; title: string; section: string };

export function SearchModal({
  open, onClose, anchors,
}: { open: boolean; onClose: () => void; anchors: Anchor[] }) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return anchors.slice(0, 8);
    return anchors
      .filter((a) => a.title.toLowerCase().includes(q) || a.section.toLowerCase().includes(q))
      .slice(0, 12);
  }, [anchors, query]);

  return (
    <dialog
      ref={ref}
      className="search-modal"
      aria-label="Search"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className="search-modal-inner">
        <input
          autoFocus
          type="text"
          placeholder="Search section titles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul>
          {results.map((a) => (
            <li key={a.id}>
              <a href={`#${a.id}`} onClick={onClose}>
                <strong>{a.title}</strong>
                <span>{a.section}</span>
              </a>
            </li>
          ))}
          {!results.length ? <li className="empty">No matches</li> : null}
        </ul>
      </div>
    </dialog>
  );
}
