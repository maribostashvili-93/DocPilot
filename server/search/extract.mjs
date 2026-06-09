// Strip HTML tags and normalise whitespace for FTS indexing.
export function htmlToPlain(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract a short summary snippet from plain text (first ~180 chars).
export function makeSummary(plain, maxLen = 180) {
  if (!plain) return '';
  const s = plain.slice(0, maxLen * 2).replace(/\s+/g, ' ').trim();
  const cut = s.slice(0, maxLen);
  return cut.length < s.length ? `${cut.trimEnd()}…` : cut;
}

// Return a highlighted snippet around the first keyword match.
export function makeSnippet(plain, query, contextChars = 120) {
  if (!plain || !query) return plain.slice(0, contextChars);
  const term = query.trim().split(/\s+/)[0];
  const idx = plain.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return plain.slice(0, contextChars);
  const start = Math.max(0, idx - 40);
  const end = Math.min(plain.length, idx + contextChars);
  return `${start > 0 ? '…' : ''}${plain.slice(start, end)}${end < plain.length ? '…' : ''}`;
}
