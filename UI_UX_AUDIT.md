# DocPilot UI/UX Audit

## Scope

This audit tracks the design system state and UI quality across all DocPilot shells:

- Company Admin (`/c/:slug/admin`)
- Tenant CMS (`/c/:slug/admin/cms`)
- Client Area (`/c/:slug`)
- SuperAdmin (`/superadmin`)
- AI Research Center (`/c/:slug/research`)
- Public Marketing (`/`)

Benchmark rules applied:

- Buttons: `40px` default / `32px` small / `48px` large, centered content, nowrap labels
- Inputs: `40px` default height, shared border/radius/focus ring, no per-page ad hoc padding
- Cards/surfaces: one border language, one shadow language, one radius scale
- Shells: single-page scroll, no `overflow: hidden` + inner scroll traps
- Typography: `var(--ds-font-display)` / `var(--ds-font-body)` only — no raw font stacks
- Colors: `var(--ds-*)` tokens only — no raw hex values in shell CSS
- Responsive: grids collapse intentionally at 1024 / 768 / 480px

---

## Design System Assets — Current State

### Tokens (`src/styles/tokens.css`) ✅

Complete token layer covering:

- Color scales: brand (red), blue, green, amber, slate
- Semantic tokens: `--ds-bg-*`, `--ds-text-*`, `--ds-accent-*`, `--ds-status-*`, `--ds-border-*`, `--ds-shadow-*`, `--ds-focus-ring`
- Typography: font families, scale (xs → 4xl), weights, leading
- Spacing scale (4px base grid)
- Radius scale (xs → 3xl + pill)
- Z-index scale
- Transitions
- Layout constants (sidebar width, topbar heights, content max)
- Legacy alias bridge for old `--c-*` var names

Status: **production-ready. No changes needed in Phase 3.**

### Primitives (`src/styles/primitives.css`) ✅

Component utility classes:

| Class | Status |
|-------|--------|
| `.ds-btn` + variants (primary, secondary, outline, ghost, danger) | ✅ |
| `.ds-btn-sm` / `.ds-btn-lg` | ✅ |
| `.ds-btn-pill` / `.ds-btn-icon` | ✅ |
| `.ds-input` / `.ds-select` / `.ds-textarea` | ✅ |
| `.ds-field` / `.ds-label` / `.ds-helper-text` | ✅ |
| `.ds-card` + `.ds-card-body` / `.ds-card-panel` / `.ds-card-feature` / `.ds-card-interactive` | ✅ |
| `.ds-badge` / `.ds-status` + semantic variants | ✅ |
| `.ds-table` + `th` / `td` rules | ✅ |
| `.ds-nav-group` / `.ds-nav-item` (with `active` + `aria-current` states) | ✅ |
| `.ds-stat` / `.ds-stat-label` / `.ds-stat-value` / `.ds-stat-delta` | ✅ |

**Missing primitives (to add in Phase 3A):**

| Missing | Where currently duplicated |
|---------|--------------------------|
| `.ds-topbar-pill` | multitenant.css, company-cms.css, company-admin.css |
| `.ds-empty-state` | inline in App.tsx render branches |
| `.ds-page-header` | inline per shell |
| `.ds-table-actions` | inline per data table |
| `.ds-section-card` | App.tsx styles.css |
| `.ds-inline-editor` | App.tsx styles.css |
| `.ds-status-approved` | missing from badge variants |
| `.ds-status-staged` | missing from badge variants |

### Surfaces (`src/styles/surfaces.css`)

Shell-level surface rules. Status: applied. Minor gaps in research.css and legacy styles.css.

---

## Shell-by-Shell Audit

### Company Admin (`src/multitenant/company-admin.css`)

**Rating: Best aligned shell** ✅

- Strongest token usage across the codebase
- Clean shell structure: topbar + sidebar + content layout
- Good spacing and visual hierarchy
- Status badges use ds-status classes

**Remaining issues:**

| Issue | Severity |
|-------|----------|
| Table action buttons use inline styles in some rows | Low |
| Audit log table has raw border color `#e3e8ed` instead of `var(--ds-border-subtle)` | Low |
| User invite modal padding is page-specific, not using `.ds-card-body` | Low |

---

### Tenant CMS Shell (`src/multitenant/company-cms.css`)

**Rating: Improved, some legacy layers remain** ⚠️

Post-fix status:

- Scroll conflict resolved — no more nested scroll trap
- Topbar nav pills centered
- Token usage improved

**Remaining issues:**

| Issue | Severity |
|-------|----------|
| Topbar pill active state uses `background: rgba(255,255,255,0.15)` instead of a token | Medium |
| CMS sidebar still has raw `#2d3748` as background fallback | Medium |
| Nav item hover uses raw `rgba(255,255,255,0.08)` — no token equivalent for dark inverse surfaces | Medium |
| Mobile breakpoint for CMS topbar not defined | High |

**Recommendation:** Add `--ds-bg-inverse-soft` and `--ds-bg-inverse-hover` tokens to tokens.css for dark shell surfaces, then replace raw rgba values.

---

### Content Editor (`src/styles.css`)

**Rating: Large file, structurally fixed, token coverage partial** ⚠️

Post-fix status:

- Conflicting 3-column override removed
- Coherent 2-column editor layout restored
- Properties panel below canvas

**Remaining issues:**

| Issue | Severity |
|-------|----------|
| Many raw hex colors remain (`#f5f8fb`, `#2d3a45`, `#e3f0f7`, etc.) | High |
| Raw `'Sansation'` and `'Roboto'` font stacks in ~12 places | High |
| Raw `box-shadow` values not using `var(--ds-shadow-*)` | Medium |
| Raw `border-radius: 6px / 8px` not using `var(--ds-radius-*)` | Medium |
| Section card hover states use raw rgba instead of token | Medium |
| Translation table row states have custom color logic, not `.ds-status-*` | Medium |
| Release environment badges use hardcoded background | Medium |
| Editor toolbar buttons do not use `.ds-btn` — fully custom | High |

**Estimate:** ~60–80 targeted replacements to reach full token compliance.

---

### Multitenant Base (`src/multitenant/multitenant.css`)

**Rating: Most complex file, still has historical layers** ⚠️

- Many overlapping rule sets from different build phases
- Dual light/dark/edit-mode overrides create specificity conflicts

**Remaining issues:**

| Issue | Severity |
|-------|----------|
| `--c-sky-blue`, `--c-red` legacy vars used directly instead of `--ds-*` equivalents | Medium |
| Button definitions duplicated from primitives (`.client-action`, `.help-btn`, `.edit-trigger`) | High |
| Card/surface rules duplicated from primitives | High |
| Login form inputs have per-page padding/radius not delegating to `.ds-input` | Medium |
| Branding preview panel uses raw RGB fallbacks | Low |
| `@media` breakpoints inconsistent with 4-breakpoint system | High |

**Recommendation:** This file needs the most work. Target in Phase 3B.

---

### Client Area (`src/multitenant/CompanyClientArea.tsx` + `multitenant.css`)

**Rating: Most improved area from last pass** ✅⚠️

**What was fixed:**

- Login inputs and CTA align with shared primitive scale
- Welcome block typography uses display/body tokens
- Doc card surface/border/radius uses shared language
- Stats cards, search chips, and save bar aligned

**Remaining issues:**

| Issue | Severity |
|-------|----------|
| Doc card status badge uses custom inline style in TSX instead of `.ds-status-*` | Medium |
| Account manager card still uses raw `#63cdff` for accent | Low |
| Staging card background uses hardcoded gradient | Low |

---

### AI Research Center (`src/multitenant/research.css`)

**Rating: Not integrated into design system** ❌

Currently a standalone CSS file that does not reference any design tokens.

**Issues found:**

| Issue | Severity |
|-------|----------|
| All colors hardcoded — no `var(--ds-*)` references | Critical |
| Custom button styles instead of `.ds-btn` | High |
| Custom input styles instead of `.ds-input` | High |
| Custom card/panel styles instead of `.ds-card` | High |
| Custom nav item styles instead of `.ds-nav-item` | High |
| Custom badge/status styles instead of `.ds-status-*` | High |
| No responsive rules defined | High |

**Recommendation:** Phase 3D — reduce research.css to layout-only rules. All component styles delegated to primitives.

---

### SuperAdmin Shell (`src/multitenant/superadmin.css`)

**Rating: Minimal, reasonably aligned** ✅

- Small file, not much to change
- Uses some token vars correctly

**Minor issues:**

| Issue | Severity |
|-------|----------|
| Company list table uses raw hover color | Low |
| Create company button is `.sa-action-btn` not `.ds-btn-primary` | Low |

---

## Cross-Shell Issues

### 1. Workflow status badges not standardized

| Shell | How status is rendered |
|-------|----------------------|
| Company Admin | `.ds-status-{draft,review,published}` ✅ |
| Content Editor | Custom `.status-pill` class with inline color map |
| Client Area doc cards | Inline `style={{ background: ... }}` in TSX |
| Translation tab | Custom `.t-status-pill` class |
| Release panel | Custom `.rel-env-label` class |

**Fix:** Replace all status rendering with `.ds-status-draft`, `.ds-status-review`, `.ds-status-approved`, `.ds-status-published`, `.ds-status-archived`, `.ds-status-staged`, `.ds-status-rolled-back`.

Add missing variants to primitives.css: `approved`, `staged`, `rolled-back`.

### 2. Topbar action pills — three separate implementations

The topbar nav pill pattern (navigation items that look like pills in the shell topbar) appears in:

- `company-cms.css` → `.cms-topbar-nav .cms-nav-pill`
- `company-admin.css` → `.ca-topbar-tab`
- `multitenant.css` → `.client-topbar-item`

All three do the same thing with slightly different heights, fonts, and active states.

**Fix:** Create `.ds-topbar-pill` in primitives.css. Replace all three.

### 3. Empty state blocks

Every page with an empty list renders its own empty state block (`No documents yet`, `No users found`, etc.) with inline or page-specific styles.

**Fix:** Create `.ds-empty-state` with `.ds-empty-state-icon`, `.ds-empty-state-title`, `.ds-empty-state-body`, `.ds-empty-state-action`. One pattern, all pages.

### 4. Modal/dialog layer

Two dialogs currently in use: one based on a `<div class="modal-overlay">` pattern in styles.css and one in multitenant.css. No shared primitive.

**Fix:** Create `.ds-dialog`, `.ds-dialog-header`, `.ds-dialog-body`, `.ds-dialog-footer` in primitives.css.

### 5. Focus management

- Some interactive elements use custom focus outlines
- Some use `outline: none` with no replacement
- `.ds-btn` and `.ds-input` have correct `focus-visible` rings

**Fix:** Remove `outline: none` from all non-`.ds-*` controls. Add `focus-visible` ring matching the token pattern.

---

## Responsive State

| Shell | 1440px | 1280px | 1024px | 768px | 480px |
|-------|--------|--------|--------|-------|-------|
| Company Admin | ✅ | ✅ | ✅ | ⚠️ table clips | ❌ not audited |
| CMS Shell | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| Content Editor | ✅ | ✅ | ⚠️ 2-col | ❌ | ❌ |
| Client Area | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| Research App | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| SuperAdmin | ✅ | ✅ | ✅ | ✅ | ⚠️ |

Priority responsive fixes:

1. CMS Shell topbar — needs hamburger/collapse at 768px
2. Content Editor — 2-column layout must switch to single column at 1024px
3. Research App — sidebar nav must collapse at 1024px
4. Company Admin user table — must switch to card stack at 768px

---

## Fixes Already Applied (Previous Pass)

### Structural

- Removed conflicting late 3-column override from `src/styles.css`
- Restored 2-column editor layout
- Fixed CMS shell nested scroll conflict
- Kept CMS content on browser scroll instead of trapped inner panel

### Primitive normalization

- Normalized shared button sizing and centering
- Normalized input sizing, radius, and focus rings
- Normalized pill/badge sizing and status mapping
- Aligned design primitives in `src/styles/primitives.css`

### CMS Topbar

- Fixed topbar nav pill label centering
- Removed scroll-fighting behavior from sticky topbar

### Client Area

- Moved landing/client typography to shared display/body tokens
- Unified login inputs and CTA sizing with the core primitive scale
- Aligned header action trigger with shared pill/button language
- Upgraded doc panels, stats cards, side cards, search, chips, edit fields, and save bar

---

## Phase 3 Roadmap

### Phase 3A — Component Extraction

Add missing primitives to `src/styles/primitives.css`:

- `.ds-topbar-pill` (+ active, hover states)
- `.ds-empty-state` + children
- `.ds-page-header` (title + subtitle + actions row)
- `.ds-table-actions` (row-level action group)
- `.ds-section-card` (editor section card)
- `.ds-dialog` + children
- `.ds-status-approved`, `.ds-status-staged`, `.ds-status-rolled-back`

Replace all shell-local duplicates.

**Estimate: 1 session**

### Phase 3B — Token Completion Pass

Target files:

1. `src/multitenant/multitenant.css` — highest priority
2. `src/styles.css` — largest file, most replacements
3. `src/multitenant/research.css` — full rework

Process per file:
1. Search for hex patterns (`#[0-9a-fA-F]{3,6}`, `rgba(`)
2. Map each to nearest `var(--ds-*)` equivalent
3. Search for raw font stacks and replace
4. Search for raw `border-radius:`, `box-shadow:`, `transition:` and replace

**Estimate: 2 sessions**

### Phase 3C — Responsive Audit

For each shell at 1024 / 768 / 480px:

- Check header overflow
- Check sidebar collapse behavior
- Check table → card stack conversion
- Check form layout (inline → stacked)
- Check modal sizing

**Estimate: 1 session**

### Phase 3D — ResearchApp Integration

Reduce `research.css` to layout-only rules.

Steps:
1. Map all custom components to nearest `.ds-*` primitive
2. Update `ResearchApp.tsx` classNames
3. Keep only layout grid rules in research.css

**Estimate: 1 session**

---

## Quality Assessment — Current

| Shell | Token compliance | Responsive | Component reuse | Overall |
|-------|-----------------|------------|-----------------|---------|
| Company Admin | 85% | 80% | 75% | **B+** |
| CMS Shell | 70% | 55% | 65% | **C+** |
| Content Editor | 60% | 55% | 50% | **C** |
| Client Area | 75% | 70% | 70% | **B** |
| Research App | 5% | 40% | 5% | **F** |
| SuperAdmin | 70% | 85% | 60% | **B-** |

**Target after Phase 3:** All shells at B+ or higher.

---

## Feasibility Verdict

The codebase has everything needed to reach full design system compliance:

- Token system is complete and production-ready
- Primitive component layer is solid
- The strong Company Admin shell proves the direction works
- Remaining work is mechanical replacement, not architectural rethinking

The right path:
1. Extract remaining repeated patterns into primitives
2. Replace shell-local duplicates with utility references
3. Complete the token pass on the two large files
4. Wire ResearchApp into the system

This is achievable incrementally without a full rewrite of any shell.
