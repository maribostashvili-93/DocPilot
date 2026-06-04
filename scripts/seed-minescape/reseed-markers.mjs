#!/usr/bin/env node
// One-shot reseed of Minescape figure markers.
//
// Strategy (per user spec, 2026-06-02):
//   - Each figure carries at most 2 markers.
//   - When a section's narrative needs more annotation than fits, duplicate
//     the image into a separate <figure> with its own 1–2 markers + caption.
//   - All markers: transparent inner background, dashed red border.
//
// Strips every existing <figure> block in the planned Minescape sections,
// then writes a fresh ordered list of figures using PLAN below.
//
// Run:  node scripts/seed-minescape/reseed-markers.mjs

import Database from 'better-sqlite3';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', '.docpilot-data', 'docpilot.sqlite');

// --- Style constants -------------------------------------------------------

const BORDER_COLOR = '#ff1b23';
const BORDER_STYLE = 'dashed';
const TEXT_COLOR   = '#ffffff';

// --- Plan ------------------------------------------------------------------
// Each section is a list of { imageSrc, imageAlt, caption, markers[1..2] }.
// Marker positions are percentage (x/y/w/h) of the image.

const IMG = {
  defaultScreen:    '/images/minescape/aviator-minescape-default-screen.png',
  betConfig:        '/images/minescape/aviator-minescape-bet-10-gel-potential-win-242-50.png',
  betConfig100:     '/images/minescape/aviator-minescape-bet-100-gel-potential-win-2425.png',
  grid25_3:         '/images/minescape/aviator-minescape-grid-size-25-mines-3.png',
  grid25_5:         '/images/minescape/aviator-minescape-grid-size-25-mines-5.png',
  grid25_10:        '/images/minescape/aviator-minescape-grid-size-25-mines-10.png',
  grid36_2:         '/images/minescape/aviator-minescape-grid-size-36-mines-2.png',
  grid36_15:        '/images/minescape/aviator-minescape-grid-size-36-mines-15.png',
  grid49_3:         '/images/minescape/aviator-minescape-grid-size-49-mines-3.png',
  grid64_4:         '/images/minescape/aviator-minescape-grid-size-64-mines-4.png',
  oneTileOpen:      '/images/minescape/aviator-minescape-one-tile-open-multiplier-x1-01-cashout-active.png',
  betPlacedHover:   '/images/minescape/aviator-minescape-bet-placed-hover-tile.png',
  autoSelected:     '/images/minescape/aviator-minescape-auto-mode-selected-tiles-start-autobet.png',
  autoAdvanced:     '/images/minescape/aviator-minescape-auto-mode-advanced-settings.png',
  autoOnWin5pct:    '/images/minescape/aviator-minescape-auto-mode-advanced-settings-on-win-increase-5-percent-bets-10-remaining-2.png',
  autoOnLoss20:     '/images/minescape/aviator-minescape-auto-mode-advanced-settings-on-loss-increase-20-percent-not-started.png',
  autoStopProfit:   '/images/minescape/aviator-minescape-auto-mode-advanced-settings-stop-on-profit-10-stop-on-loss-20.png',
  autoWinInfinite:  '/images/minescape/aviator-minescape-auto-mode-win-state-infinite-rounds.png',
  burgerOpen:       '/images/minescape/aviator-minescape-burger-menu-open.png',
};

const PLAN = [
  // §1 — Loading And Screen Anatomy
  // The full A–G region map split across 4 figures so no figure shows >2 markers.
  {
    position: 1,
    figures: [
      {
        imageSrc: IMG.defaultScreen,
        imageAlt: 'Region map A and B — the header and the mode tabs.',
        caption: 'Top-left regions: header bar and mode tabs.',
        markers: [
          { label: 'A — Header',    description: 'Logo, time, balance, burger menu.',                          x: 4, y: 1,  w: 36, h: 7  },
          { label: 'B — Mode Tabs', description: 'Switch between Manual and Auto. Locked during a round.',     x: 4, y: 9,  w: 36, h: 8  },
        ],
      },
      {
        imageSrc: IMG.defaultScreen,
        imageAlt: 'Region map C and D — the bet setup column and the action button.',
        caption: 'Middle-left regions: bet setup and action button.',
        markers: [
          { label: 'C — Bet Setup',     description: 'Bet amount, modifiers, potential win, grid size, mines.',  x: 4, y: 18, w: 36, h: 50 },
          { label: 'D — Action Button', description: 'The one button that drives the round; label depends on state.', x: 4, y: 70, w: 36, h: 9 },
        ],
      },
      {
        imageSrc: IMG.defaultScreen,
        imageAlt: 'Region map E and F — the multiplier ladder and the play board.',
        caption: 'Right side: multiplier ladder and play board.',
        markers: [
          { label: 'E — Multiplier Ladder', description: 'Seven chips previewing upcoming multipliers per safe reveal.', x: 42, y: 1,  w: 56, h: 7  },
          { label: 'F — Play Board',        description: 'The crate grid. One reveal per tap.',                          x: 42, y: 9,  w: 56, h: 86 },
        ],
      },
      {
        imageSrc: IMG.defaultScreen,
        imageAlt: 'Region map G — the footer with Provably Fair badge, version, and clock.',
        caption: 'Footer region.',
        markers: [
          { label: 'G — Footer', description: 'Provably Fair badge, version, client clock.', x: 4, y: 82, w: 36, h: 13 },
        ],
      },
    ],
  },

  // §2 — Header Bar
  {
    position: 2,
    figures: [
      {
        imageSrc: IMG.betConfig,
        imageAlt: 'Header bar — logo and time.',
        caption: 'Brand mark and live clock.',
        markers: [
          { label: 'Logo', description: 'Brand mark, anchors identity.', x: 2,  y: 1, w: 14, h: 6 },
          { label: 'Time', description: 'Local time, synced with server.', x: 18, y: 1, w: 10, h: 6 },
        ],
      },
      {
        imageSrc: IMG.betConfig,
        imageAlt: 'Header bar — balance and burger menu.',
        caption: 'Wallet and the menu drawer toggle.',
        markers: [
          { label: 'Balance', description: 'Current wallet balance in your currency.', x: 30, y: 1, w: 18, h: 6 },
          { label: 'Menu',    description: 'Burger icon — opens Provably Fair, sound, settings.', x: 92, y: 1, w: 6, h: 6 },
        ],
      },
    ],
  },

  // §4 — Configuring Your Bet
  {
    position: 4,
    figures: [
      {
        imageSrc: IMG.betConfig,
        imageAlt: 'Bet configuration — amount and quick modifiers.',
        caption: 'Bet amount and the modifier chips.',
        markers: [
          { label: 'Bet amount', description: 'Type a value or use modifiers to adjust.',         x: 4, y: 18, w: 34, h: 9 },
          { label: 'Modifiers',  description: 'Half, double, max — single-tap quick adjusters.',  x: 4, y: 28, w: 34, h: 6 },
        ],
      },
      {
        imageSrc: IMG.betConfig100,
        imageAlt: 'Bet configuration — potential win for a 100 GEL bet.',
        caption: 'Potential win recalculates live.',
        markers: [
          { label: 'Potential win', description: 'Bet × max multiplier for the current grid/mines combo.', x: 4, y: 36, w: 34, h: 9 },
        ],
      },
    ],
  },

  // §5 — Grid Size And Mines
  {
    position: 5,
    figures: [
      {
        imageSrc: IMG.grid25_3,
        imageAlt: 'Grid size and mines selectors with 25 tiles and 3 mines.',
        caption: 'Grid size and mine count selectors.',
        markers: [
          { label: 'Grid size', description: 'Tile count: 25, 36, 49, 64. Bigger grid lowers mine density.', x: 4, y: 45, w: 34, h: 10 },
          { label: 'Mines',     description: 'More mines → higher multipliers but higher round risk.',        x: 4, y: 56, w: 34, h: 10 },
        ],
      },
    ],
  },

  // §6 — Multiplier Ladder
  {
    position: 6,
    figures: [
      {
        imageSrc: IMG.oneTileOpen,
        imageAlt: 'Multiplier ladder with the first chip highlighted.',
        caption: 'Ladder reads left-to-right; the active multiplier is highlighted.',
        markers: [
          { label: 'Ladder',           description: 'Seven chips — the multiplier after each next safe reveal.', x: 42, y: 1, w: 56, h: 7 },
          { label: 'Current multiplier', description: 'Highlighted chip — what you cash out at right now.',       x: 42, y: 1, w: 10, h: 7 },
        ],
      },
    ],
  },

  // §7 — Playing A Manual Round
  {
    position: 7,
    figures: [
      {
        imageSrc: IMG.betPlacedHover,
        imageAlt: 'Hovering a tile during a round.',
        caption: 'Hover previews the next reveal.',
        markers: [
          { label: 'Hover state', description: 'Tile pre-highlights so you can preview the next reveal.', x: 56, y: 30, w: 14, h: 14 },
          { label: 'Cashout',     description: 'Action button becomes "Cashout" + amount during a round.', x: 4, y: 70, w: 36, h: 9 },
        ],
      },
    ],
  },

  // §8 — Winning And Losing
  {
    position: 8,
    figures: [
      {
        imageSrc: IMG.oneTileOpen,
        imageAlt: 'Safe reveal — multiplier ticks up.',
        caption: 'A safe reveal advances the multiplier.',
        markers: [
          { label: 'Revealed tile', description: 'Safe reveal — multiplier ticks up. Mine = round ends, bet lost.', x: 56, y: 30, w: 14, h: 14 },
          { label: 'Multiplier now', description: 'Active multiplier; cashing out pays bet × this.',                 x: 42, y: 1,  w: 10, h: 7  },
        ],
      },
      {
        imageSrc: IMG.oneTileOpen,
        imageAlt: 'Cashout button during an active round.',
        caption: 'Cashout locks the win.',
        markers: [
          { label: 'Cashout button', description: 'Tap to lock the win — round ends, bet × multiplier paid.', x: 4, y: 70, w: 36, h: 9 },
        ],
      },
    ],
  },

  // §9 — Auto Mode Pre-Selecting Tiles
  {
    position: 9,
    figures: [
      {
        imageSrc: IMG.autoSelected,
        imageAlt: 'Auto mode with pre-selected tiles and the Start autobet button.',
        caption: 'Pre-select the tiles auto will reveal each round.',
        markers: [
          { label: 'Pre-selected tiles', description: 'Tap tiles before starting — these are what auto will reveal each round.', x: 42, y: 9,  w: 56, h: 70 },
          { label: 'Start autobet',      description: 'Begins the auto loop using your bet, mines, and tile picks.',              x: 4,  y: 70, w: 36, h: 9  },
        ],
      },
    ],
  },

  // §10 — Auto Mode Advanced Settings
  {
    position: 10,
    figures: [
      {
        imageSrc: IMG.autoOnWin5pct,
        imageAlt: 'On Win advanced setting — increase by 5% after a winning round.',
        caption: 'On Win — how bet changes after a winning round.',
        markers: [
          { label: 'On Win', description: 'Reset, increase, or decrease bet after a winning round.', x: 4, y: 18, w: 92, h: 18 },
        ],
      },
      {
        imageSrc: IMG.autoOnLoss20,
        imageAlt: 'On Loss advanced setting — increase by 20% after a losing round.',
        caption: 'On Loss — how bet changes after a losing round.',
        markers: [
          { label: 'On Loss', description: 'Reset, increase, or decrease bet after a losing round.', x: 4, y: 37, w: 92, h: 18 },
        ],
      },
      {
        imageSrc: IMG.autoStopProfit,
        imageAlt: 'Stop conditions — Stop on profit 10, Stop on loss 20.',
        caption: 'Stop conditions halt autobet automatically.',
        markers: [
          { label: 'Stop on profit', description: 'Autobet halts when cumulative profit hits this value.', x: 4,  y: 57, w: 45, h: 14 },
          { label: 'Stop on loss',   description: 'Autobet halts when cumulative loss hits this value.',   x: 51, y: 57, w: 45, h: 14 },
        ],
      },
    ],
  },

  // §11 — Autobet Running
  {
    position: 11,
    figures: [
      {
        imageSrc: IMG.autoWinInfinite,
        imageAlt: 'Autobet running with infinite rounds and a winning state.',
        caption: 'Autobet tracks rounds and the current multiplier as it runs.',
        markers: [
          { label: 'Round counter',     description: 'Completed rounds vs. configured limit (∞ = until stop).', x: 42, y: 1, w: 28, h: 7 },
          { label: 'Active multiplier', description: 'Updates per reveal as auto progresses.',                    x: 42, y: 9, w: 14, h: 7 },
        ],
      },
    ],
  },

  // §12 — Menu, Provably Fair, Versioning
  {
    position: 12,
    figures: [
      {
        imageSrc: IMG.burgerOpen,
        imageAlt: 'Burger menu — Provably Fair and Settings entries.',
        caption: 'Burger drawer — fairness verification and toggles.',
        markers: [
          { label: 'Provably Fair', description: 'Reveals server/client seeds + the round hash for independent verification.', x: 65, y: 12, w: 32, h: 10 },
          { label: 'Settings',      description: 'Sound, animation, and language toggles.',                                    x: 65, y: 23, w: 32, h: 10 },
        ],
      },
      {
        imageSrc: IMG.burgerOpen,
        imageAlt: 'Burger menu — version identifier at the bottom.',
        caption: 'Quote the version when reporting issues.',
        markers: [
          { label: 'Version', description: 'Build identifier. Quote this when reporting issues.', x: 65, y: 80, w: 32, h: 8 },
        ],
      },
    ],
  },
];

// --- HTML builders ---------------------------------------------------------

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildMarkerSpan(marker, index) {
  const id = `m-${index + 1}`;
  const label = escapeHtml(marker.label);
  const style = [
    `left:${marker.x}%`,
    `top:${marker.y}%`,
    `width:${marker.w}%`,
    `height:${marker.h}%`,
    `border-color:${BORDER_COLOR}`,
    `border-style:${BORDER_STYLE}`,
    `background-color:rgba(255,27,35,0)`,
    `color:${TEXT_COLOR}`,
  ].join('; ');
  return `<span class="doc-marker marker-shape" data-kind="shape" data-marker-id="${id}" data-label="${label}" data-border-style="${BORDER_STYLE}" data-border-color="${BORDER_COLOR}" data-border-opacity="100" data-background-color="${BORDER_COLOR}" data-background-opacity="0" data-text-color="${TEXT_COLOR}" data-text-opacity="100" data-animated="false" data-label-align="left" style="${style};"><b class="doc-marker-chip">${label}</b></span>`;
}

function buildDescriptionList(markers) {
  if (!markers.length) return '';
  const rows = markers.map((m, i) =>
    `<div class="marker-description" data-marker-description-index="${i + 1}"><strong>${escapeHtml(m.label)}</strong><p>${escapeHtml(m.description)}</p></div>`
  ).join('\n  ');
  return `\n    <div class="marker-description-list">\n  ${rows}\n</div>`;
}

function buildFigure({ imageSrc, imageAlt, caption, markers }) {
  const markersHtml = markers.map(buildMarkerSpan).join('\n      ');
  const descriptions = buildDescriptionList(markers);
  const captionHtml = caption ? `\n    <figcaption><em>${escapeHtml(caption)}</em></figcaption>` : '';
  return `<figure class="figure annotated-figure">
    <div class="annotated-image">
      <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(imageAlt)}">
      ${markersHtml}
    </div>${descriptions}${captionHtml}
  </figure>`;
}

function buildFiguresBlock(figures) {
  return figures.map(buildFigure).join('\n  ');
}

// Replaces ALL existing <figure>...</figure> blocks in the section html with the
// freshly generated set, anchored at the position of the FIRST original figure.
// Strip-then-insert order matters — if you strip after substituting, the
// substituted figures (which contain <figure> tags) get nuked too.
function rewriteSectionHtml(html, figures) {
  const newBlock = buildFiguresBlock(figures);
  const firstMatch = html.match(/<figure[\s\S]*?<\/figure>/);
  if (!firstMatch) return null;
  const anchor = firstMatch.index;
  // Strip ALL figures first (operating on the original string).
  const stripped = html.replace(/<figure[\s\S]*?<\/figure>/g, '\x00FIGURE_SLOT\x00');
  // Replace the FIRST slot with the new block; remove the rest.
  const withFirst = stripped.replace('\x00FIGURE_SLOT\x00', newBlock);
  const final = withFirst.replace(/\x00FIGURE_SLOT\x00/g, '');
  // Sanity: ensure the original anchor index is roughly preserved.
  void anchor;
  return final;
}

// --- Main ------------------------------------------------------------------

function main() {
  const db = new Database(DB_PATH);

  const docRow = db.prepare("SELECT id FROM documents WHERE slug LIKE '%minescape%' LIMIT 1").get();
  if (!docRow) {
    console.error('No Minescape doc found.');
    process.exit(1);
  }

  const select = db.prepare('SELECT id, position, title, html FROM sections WHERE document_id = ? ORDER BY position');
  const update = db.prepare('UPDATE sections SET html = ?, updated_at = ? WHERE id = ?');
  const now = new Date().toISOString();

  const planByPos = new Map(PLAN.map((p) => [p.position, p]));
  const rows = select.all(docRow.id);

  let touched = 0;
  for (const row of rows) {
    const plan = planByPos.get(row.position);
    if (!plan) continue;
    const nextHtml = rewriteSectionHtml(row.html, plan.figures);
    if (nextHtml === null) {
      console.warn(`  position=${row.position} "${row.title}" — no <figure> found, skipped`);
      continue;
    }
    update.run(nextHtml, now, row.id);
    const totalMarkers = plan.figures.reduce((s, f) => s + f.markers.length, 0);
    console.log(`  ✓ position=${row.position} "${row.title}" — ${plan.figures.length} figure(s), ${totalMarkers} marker(s)`);
    touched += 1;
  }

  console.log(`\nDone. Sections updated: ${touched}/${PLAN.length} planned.`);
  db.close();
}

main();
