// Strip ALL markers from the Minescape doc sections in the local DB.
//
// WHY THIS EXISTS
// ---------------
// The Minescape documentation content + its annotation markers live in the
// SQLite database (.docpilot-data/docpilot.sqlite), NOT in the source code.
// The `DEFAULT_MINESCAPE_INTERFACE_SECTIONS` constant in src/App.tsx is dead
// code and is never rendered. Editing it does nothing to what the reader sees.
// The database is gitignored, so it never travels through git — the only way
// to change the rendered doc is to run a script like this against the local DB.
//
// WHAT IT DOES
// ------------
// For every section of the Minescape document it removes:
//   - marker spans       <span class="doc-marker ...">...</span>
//   - marker description  <div class="marker-description-list">...</div>
// It KEEPS the <img>, the <figcaption>, and all prose/tables intact. Figures
// remain — just without the overlay chips and their description lists.
//
// USAGE
// -----
//   node scripts/seed-minescape/strip-markers.mjs
//
// Idempotent: running it again on already-stripped sections is a no-op.

import Database from 'better-sqlite3';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', '.docpilot-data', 'docpilot.sqlite');

// Remove every <span class="doc-marker ...">...</span> (the overlay chips) and
// every <div class="marker-description-list">...</div> (their captions list).
// Both are non-nested in the generated markup, so a non-greedy match is safe.
function stripMarkers(html) {
  if (!html) return html;
  let out = html;
  // Marker overlay chips inside .annotated-image.
  out = out.replace(/<span class="doc-marker[\s\S]*?<\/span>/g, '');
  // The description list block that mirrors the markers.
  out = out.replace(/<div class="marker-description-list">[\s\S]*?<\/div>\s*(?=<figcaption|<\/figure)/g, '');
  // Collapse the now-empty whitespace left between <img> and </div>.
  out = out.replace(/(<img[^>]*>)\s+(<\/div>)/g, '$1$2');
  return out;
}

function main() {
  const db = new Database(DB_PATH);

  const docRow = db
    .prepare("SELECT id, title FROM documents WHERE slug LIKE '%minescape%' LIMIT 1")
    .get();
  if (!docRow) {
    console.error('No Minescape doc found in the database. Nothing to strip.');
    process.exit(1);
  }

  const select = db.prepare(
    'SELECT id, position, title, html FROM sections WHERE document_id = ? ORDER BY position',
  );
  const update = db.prepare('UPDATE sections SET html = ?, updated_at = ? WHERE id = ?');
  const now = new Date().toISOString();

  const rows = select.all(docRow.id);
  let changed = 0;
  let markersRemoved = 0;

  const tx = db.transaction(() => {
    for (const row of rows) {
      const before = row.html || '';
      const markerHits = (before.match(/<span class="doc-marker/g) || []).length;
      const after = stripMarkers(before);
      if (after !== before) {
        update.run(after, now, row.id);
        changed += 1;
        markersRemoved += markerHits;
        console.log(`  ✓ ${row.title || row.id}: removed ${markerHits} marker(s)`);
      }
    }
  });
  tx();

  console.log(
    `\nDone. Doc "${docRow.title}": ${changed} section(s) updated, ${markersRemoved} marker(s) removed total.`,
  );
  if (changed === 0) {
    console.log('No markers found — sections were already clean.');
  }
  db.close();
}

main();
