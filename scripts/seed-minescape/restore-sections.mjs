#!/usr/bin/env node
// One-off recovery: copy the Minescape section HTML from the pre-migration
// JSON back into SQLite. Needed because an earlier botched regex in
// reseed-markers.mjs stripped all <figure> blocks. After this runs, re-run
// reseed-markers.mjs to apply the new style.

import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', '.docpilot-data', 'docpilot.sqlite');
const JSON_PATH = join(__dirname, '..', '..', '.docpilot-data', 'cms-state.pre-migration.json');

const docId = 'doc-minescape-complete-guide';

const raw = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
const sourceSections = raw.keys.cms_custom_sections_v1.value[docId];
if (!Array.isArray(sourceSections)) {
  console.error('No sections found for doc-minescape-complete-guide in pre-migration JSON.');
  process.exit(1);
}

const db = new Database(DB_PATH);
const docRow = db.prepare("SELECT id FROM documents WHERE slug LIKE '%minescape%' LIMIT 1").get();
if (!docRow) {
  console.error('No Minescape doc in SQLite.');
  process.exit(1);
}

const select = db.prepare('SELECT id, position, title FROM sections WHERE document_id = ? ORDER BY position');
const update = db.prepare('UPDATE sections SET html = ?, updated_at = ? WHERE id = ?');
const now = new Date().toISOString();

const rows = select.all(docRow.id);
let touched = 0;
rows.forEach((row, i) => {
  const src = sourceSections[i];
  if (!src) {
    console.warn(`  position=${row.position} "${row.title}" — no source at index ${i}`);
    return;
  }
  if (!src.html) {
    console.warn(`  position=${row.position} "${row.title}" — source has no html`);
    return;
  }
  update.run(src.html, now, row.id);
  console.log(`  ✓ position=${row.position} "${row.title}" — html restored (${src.html.length} bytes, figures: ${(src.html.match(/<figure/g) || []).length})`);
  touched += 1;
});

console.log(`\nRestored: ${touched}/${rows.length} sections.`);
db.close();
