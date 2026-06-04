# DocPilot Reader UI — Refinement Spec

**Date:** 2026-06-02
**Owner:** Nukri Tusishvili
**Status:** Draft — pending user approval
**Scope:** Public documentation reader (`/docs/:docId`). Editor, media library, admin pages out of scope.

---

## 1. Why this exists

The current `DocumentViewerPage` (`src/App.tsx:1666`) renders documentation through `composeManualHtml` / `composeGenericDocumentHtml` and `dangerouslySetInnerHTML`. Live screenshots taken on 2026-06-02 surfaced six classes of issue across header, ToC, section body, page affordances, typography, and footer. The reader needs a refresh aligned with how modern developer docs (Stripe, Linear, Vercel) read, while keeping per-tenant brand flexibility for the DocPilot multi-tenant story.

A side-by-side brainstorm presented three directions. The user picked **Direction B — Stripe/Linear minimal**, refined as `demo-b2.html` with the following confirmed decisions:

| Decision | Locked answer |
|---|---|
| Brand accent | **Admin-configurable per tenant** (CSS variable) |
| Dark mode | **Day-one feature** |
| Mobile sidebar | **Hamburger drawer**, must work at **≥ 320px** width |
| Old dark "Aviator" cover hero | **Dropped entirely** — replaced by compact meta row + title + lede |

Reference demos live in `.superpowers/brainstorm/73247-1780413701/content/demo-b2.html`.

---

## 2. Goals & non-goals

### Goals

1. Replace the current reader chrome (header, hero, ToC, footer) with the Direction B layout.
2. Make accent color and dark/light mode tenant-configurable from existing admin surfaces.
3. Render a usable reader at viewports ≥ 320px wide.
4. Bring section-body content (callouts, tables, figures, code, keycaps) to a consistent visual language.
5. Add reader-grade affordances: prominent search field (UI shell only — backend wiring optional follow-up), in-heading anchor copy, on-page sub-anchor rail, edit/print/report links.

### Non-goals

- Building search backend. We expose a `⌘K` shell that opens a placeholder modal; real index/query lives in a separate plan.
- Editor surface changes.
- Translating UI strings (existing localization keys reused; no new keys unless a brand-new element appears).
- Migrating section HTML strings to a structured block model — sections remain `SectionEntry.html` and are still injected via `dangerouslySetInnerHTML`. Re-skinning happens through CSS scoping (see §6).
- Fixing the "INFO: FIGURE PRESERVED IN HTML MODE" content placeholder bug — tracked separately. Reader CSS will style real figures/tables/markers when they render; placeholder removal is a content/composer task.

---

## 3. Visual language

### Type

- **Body / UI:** Inter (already partially used; standardize on `400 / 500 / 600 / 700`).
- **Monospace:** JetBrains Mono for inline code, code blocks, and `<code>` in tables.
- **No display serif in the reader.** The current Source/Serif headers and the big "Aviator." hero serif are removed from the reader. Sub-section headings (h3) become sans-serif `600` at ~16.5px — fixing the low-contrast "ghost gray serif" issue.

### Color & theming

- All reader styles live under a single wrapping selector: **`.docpilot-reader`** (set in §6). Theme + accent variables are scoped to that root, not to `<html>`.
- Theme controlled by `data-theme="light" | "dark"` on the `.docpilot-reader` element.
- Accent controlled by CSS custom properties: `--accent`, `--accent-2`, `--accent-soft`. Default indigo `#635bff`; per-tenant override (see §7).
- Palette tokens normalize to: `--bg`, `--bg-2`, `--bg-3`, `--ink`, `--ink-2`, `--ink-3`, `--ink-4`, `--line`, `--line-2`, plus semantic `--green`, `--red`, `--amber` for status callouts.
- Shadows: two tiers (`--shadow-sm`, `--shadow`) tuned for both themes.

### Scale (desktop)

- Reading column: **`max-width: 760px`** (down from the current ~880px).
- Sidebar: 260px sticky.
- Right rail (on-this-page + resources): 220px, hidden below 1200px.
- Header: 60px sticky, translucent (`backdrop-filter: blur`), subtle border.
- Body type: 15px / line-height 1.7 / color `--ink`. Lede: 16.5px / line-height 1.6 / color `--ink-2`.

### Mobile (≥ 320px)

- Shell collapses to single column. Sidebar becomes off-canvas drawer (280px wide) toggled by a hamburger in the header. Backdrop dims content.
- Header height stays 60px; nav tabs hide, search compresses, hamburger sits right.
- Body padding tightens to 24px / 0 / 80px.
- Right rail hides; "on this page" links are accessible via the drawer footer (link to top-level + sub-anchors).
- All layout primitives use `min-width: 0` and `overflow: auto` on tables/code so 320px never overflows horizontally.

---

## 4. Components & content treatment

### 4.1 Header (`DocReaderHeader` rewrite)

- Brand (mark + name) on left, linking to tenant home (`/c/<slug>` if logged in, otherwise `/`).
- Nav tabs after brand: **Docs · API · Changelog · Support** — each tab maps to a doc category/group. Hidden below 900px.
- Center: large search field with `⌘K` affordance. Clicking opens a placeholder modal in this scope; real query implementation deferred.
- Right: theme switcher, language switcher, profile menu (existing `UserMenu`), hamburger on mobile.
- Header is sticky, translucent with backdrop blur, never collapses or hides on scroll.

### 4.2 Document head (replaces dark cover)

Compact head above the body, no full-bleed dark hero:

- Doc-meta row: status pill (Live / Draft), version + last-updated date, optional "Edit on GitHub" link.
- Title (`h1`, 32px, weight 700, tracking −0.022em).
- Lede paragraph (16.5px, color `--ink-2`) — sourced from `doc.summary` or first section's first paragraph.
- No "Document · Taxonomy · Audience · Status" tiles. These were internal CMS fields and are removed from the reader.

### 4.3 Sidebar / ToC

- Sticky, scrollable.
- Two levels: doc top (h2) entries plus nested sub-section (h3) entries.
- Sub-anchors generated from `section.html` headings (`h2 id="…"`, `h3 id="…"`) at render time.
- Active state via IntersectionObserver (keep existing logic, swap class names).
- Groupings: e.g. **Aviator · Operator · Reference** — mapped from `doc.gameId` and `docTaxonomy(doc)`.
- Search box at the top of the sidebar (filters list) — UI only in this scope.

### 4.4 Section body

- Wrapping container scoped as `.docpilot-reader` (see §6). All section HTML renders inside.
- `h2` (section heading): 22px / 600 / scroll-margin-top 80px. Hover anchor `#` appears.
- `h3` (sub-section): 16.5px / 600 sans-serif. Scroll-margin matches.
- `p`: 15px / line-height 1.7.
- `code.inline`: mono, 13px, subtle bg + border.
- `kbd`: keycap styling with 1px bottom shadow.
- `pre`: mono, 13.5px, padded card.
- Tables: bordered card, header-row tinted, horizontal scroll on overflow.
- Figures: rounded `.figure-frame` with subtle accent radial-gradient backdrop; captions below at 12.5px.
- Callouts: four variants — `note` (accent), `success` (green), `warn` (amber), `danger` (red). Existing red "warning" callouts and blue "info" callouts both map to these new variants via a one-shot CSS rename pass (see §6).
- The current red `.section-banner` divider between sections is dropped. Section transitions are signalled by the `h2` title plus the `scroll-margin-top` so the heading lands below the sticky header.

### 4.5 Right rail ("on this page")

- Sticky, 220px, only visible on viewports ≥ 1200px.
- Lists the visible section's h3 sub-anchors plus a "Resources" group (Edit on GitHub · Print / PDF · Report an issue).
- Active anchor highlighted via the same IntersectionObserver instance as the left ToC.

### 4.6 Section flow nav

- The runtime DOM-injected `.section-flow-nav` (current implementation in `App.tsx:1789-1811`) is removed.
- A single React-rendered flow nav appears at the bottom of the doc body (not per-section). Two-column grid: prev / next, each linking to sibling doc per `sortDocsForNavigation`.
- When prev or next is missing, the side is rendered empty (no element), not as a dashed-empty box.

### 4.7 Footer

- Border-top, no full-bleed black band.
- Two rows: brand + version on left; next-doc link · status link · support link on right.
- Background uses `--bg`; text uses `--ink-3`; links use `--ink-2` / hover `--accent`. No hard hex values.

### 4.8 Page-level affordances

- Back-to-top fab kept, restyled to match icon-button language.
- Scroll progress: thin 2px bar pinned to the bottom edge of the header, width = `scrollProgress%`, accent color.
- Keyboard: `←` / `→` jump to previous / next section's first `h2`/`h3` (existing logic, kept).
- New: `.` on a focused heading copies its anchor URL to clipboard.

---

## 5. Theme & accent admin surface

### 5.1 What admins control

Per tenant (company in v2 / single-tenant in v1):

- **Accent color**: `--accent` hex. `--accent-2` and `--accent-soft` are derived automatically (HSL adjust).
- **Default theme**: light / dark / "follow system" (uses `prefers-color-scheme`).
- **Logo**: existing `branding.logoUrl` reused; appears in header brand slot.

### 5.2 Where it lives

- Existing `ThemeControls` component in `src/App.tsx:4285` is the closest admin surface. We extend it (or move it to `multitenant/`) to add an "Accent color" field and a "Default theme" radio. No new admin page.
- Persistence: in v1, write to `cms_active_theme_preset_v1` and `cms_theme_presets_v1` (already used). In v2, write to `branding.accent` and `branding.defaultTheme` on the company record (matches the existing `branding.logoUrl` shape returned by `/api/v2/auth/me`).
- The reader reads from one surface only: **v2 (`/api/v2/auth/me`) wins absolutely** when a company is returned. The v1 preset is read only when v2 is unreachable or returns no company (legacy/anonymous case). The two are never merged.

### 5.3 Render-time

- `DocumentViewerPage` resolves the tenant theme on mount and sets `data-theme` + inline `style="--accent: …; --accent-2: …; --accent-soft: …"` on the reader root (`.docpilot-reader`).
- A theme-switcher in the header lets the reader toggle light/dark per-session (stored in `localStorage`, scoped to the company slug). It does **not** override the tenant default for other users.

---

## 6. CSS / file architecture

To avoid touching the 11,939-line `App.tsx` more than necessary and to keep the new reader styles isolated from the existing 7,100-line `styles.css`:

1. New file: `src/reader/reader.css` containing all reader-scoped styles. Every selector is namespaced under `.docpilot-reader` (the wrapping div around `DocumentViewerPage`'s contents).
2. New file: `src/reader/DocReader.tsx` — extracted from `App.tsx:1666-1822`. Contains the new JSX shell: header, sidebar, main, right rail, flow nav, footer. The inner `dangerouslySetInnerHTML` block is unchanged in approach but receives sanitized HTML that may include `<table>`, `<pre>`, `<kbd>`, `<code>`, marker hotspots, etc.
3. **All routes (`/docs/:docId`, including `doc-manual`) render through the new shell.** The legacy `manualHtml` static shell wrapper is no longer used for live rendering. `composeManualHtml` is narrowed to emit just the section HTML (no `<main class="doc-main">` wrapper), so the result drops into `.docpilot-reader main` like every other doc. The old `manualHtml` constant and `.manual-html` rules in `styles.css` remain in the codebase, untouched, only as a reference for the section content authors — they are not wired to any route after this change.
4. Existing `attachMarkerHotspotInteractions` and `attachDocCarouselInteractions` are reused; selectors are unchanged because they target classes inside section HTML, not the chrome.
5. A small CSS "compat layer" in `reader.css` maps legacy class names produced by the section composers (`.callout.info`, `.callout.warning`, `.callout.important`) to the new four variants so existing content renders correctly without a content migration. Drift between old and new class names is documented in `reader.css` header comment.

---

## 7. Tenant theming model

```ts
// src/reader/theme.ts (new)
export type ReaderTheme = {
  accent: string;         // hex, e.g. "#635bff"
  defaultMode: 'light' | 'dark' | 'system';
};

export function resolveReaderTheme(company): ReaderTheme;
export function applyReaderTheme(root: HTMLElement, theme: ReaderTheme, sessionMode?: 'light' | 'dark');
```

- `resolveReaderTheme` reads from v2 company branding, falling back to v1 preset.
- `applyReaderTheme` sets `data-theme` and inline CSS variables on the reader root.
- Session override stored as `docpilot:reader-mode:<slug>` in `localStorage`; reset on logout.

Derived tokens (computed in CSS via `color-mix(in srgb, …)`):

- `--accent-2: color-mix(in srgb, var(--accent) 92%, black)`  — ~8% darker
- `--accent-soft` (light): `color-mix(in srgb, var(--accent) 8%, white)`
- `--accent-soft` (dark):  `color-mix(in srgb, var(--accent) 18%, var(--bg))`

`color-mix` is supported in all evergreen browsers (Chrome 111+, Firefox 113+, Safari 16.2+). We don't ship a JS fallback — if a user's browser is older than 2023, the reader still works but accent-soft renders as `transparent` and surfaces fall back to `--bg`, which is acceptable.

---

## 8. Accessibility

- Color contrast: every text/background combo at AA at minimum (target AAA for body text). Sub-section heading contrast moves from current ~3:1 to ≥ 7:1.
- Focus rings: visible 2px ring in `--accent` on all interactive elements.
- Hamburger drawer: traps focus when open, returns focus to the trigger on close.
- `prefers-reduced-motion`: disables `backdrop-filter` transitions and the back-to-top scroll smoothing.
- Search field uses `<button>` semantics for the trigger and `<dialog>` for the modal shell.
- All icon-only buttons have `aria-label`.

---

## 9. Out-of-scope but adjacent (track separately)

- **Figure/table placeholders bug**: section HTML currently emits `<div class="callout info">…INFO: FIGURE PRESERVED IN HTML MODE…</div>` for unrendered figure/table blocks. Owner: section composer / content pipeline. New reader CSS will render *real* `<figure>` and `<table>` when they appear, so once the composer bug is fixed the reader needs no further work.
- **Real `⌘K` search backend**: index over section titles + body text. Reader provides the trigger and modal shell; the index is its own plan.
- **Print / PDF export**: reader will include the link in the right rail and footer, but the renderer is a separate task.
- **Localization of new admin fields (accent, default theme)**: surface uses existing localization keys plus two new strings to be added.

---

## 10. Acceptance criteria

A reviewer should be able to verify, in order:

1. Navigating to `/docs/doc-manual` shows the new shell: 60px header, 260px left sidebar (nested), 760px reading column, right rail visible on viewport ≥ 1200px. **No dark "Aviator." cover hero.**
2. Resizing to 320px keeps all content inside the viewport — no horizontal scroll. Hamburger toggles the drawer; backdrop dims content; focus is trapped.
3. Toggling the theme switcher in the header swaps `data-theme` and updates `localStorage` for the current company.
4. An admin sets a tenant accent in `ThemeControls`. Reloading the reader (or any other reader page) applies the new accent everywhere `--accent` is used (links, active ToC entry, callouts, search border).
5. A section that emits real `<table>`, `<pre>`, `<kbd>`, or `<figure>` markup renders with the new styling. If the section composer still emits a "INFO: FIGURE PRESERVED IN HTML MODE" callout placeholder, that placeholder renders as a normal info callout in the new visual language — fixing the composer itself is tracked separately in §9.
6. Prev/next flow nav at the bottom of the doc has no empty dashed boxes when there's no sibling on one side.
7. AAA-readable sub-section headings (`h3`) in both light and dark mode.
8. Existing marker hotspots and carousels still work in the new shell.

---

## 11. Open questions for plan phase

Carry into `writing-plans`:

1. Sibling navigation logic (`flow-nav` next/prev) currently uses `sortDocsForNavigation` of *docs in the same gameId*. Confirm we keep doc-level prev/next, or switch to *section-level* prev/next inside the doc (current per-section nav behavior).
2. Should the theme-switcher in the header be visible to anonymous readers, or admins-only?
3. Color contrast checks: do we wire an automated check (e.g., axe in dev) into the build, or hand-verify?
4. `⌘K` modal — empty shell in this PR, or scaffolded with a stub search that hits in-memory section titles only?
