# DocPilot UI/UX Audit

## Scope

This audit compares DocPilot's current multitenant UI against the design-system patterns used in the installed `ui-ux-pro-max-skill` references, especially:

- semantic token layering
- consistent button/input/card specs
- accessible focus and interaction states
- responsive shell behavior without nested scroll traps

## Benchmark Rules

The comparison baseline used for this audit:

- Buttons: default `40px` height, `32px` small, `48px` large, centered content, nowrap labels
- Inputs: default `40px` height, shared border/radius/focus ring, no ad hoc paddings per page
- Cards/surfaces: one border language, one shadow language, one radius scale
- Shells: single-page scroll whenever possible, avoid `overflow: hidden` + inner scroll containers
- Typography: one body font, one display font, consistent uppercase label treatment
- Responsive behavior: grids collapse intentionally, controls wrap before clipping

## Critical Findings

### 1. Content Editor had conflicting layout systems

`src/styles.css` defined the editor frame twice with incompatible grid models:

- earlier block used a valid 2-column layout with tree + canvas, then properties below canvas
- later block reintroduced a 3-column layout and squeezed the main canvas

Impact:

- vertical text / collapsed content in the editor
- unusable preview area
- inconsistent behavior across breakpoints

Status: fixed.

## 2. Tenant CMS shell inherited legacy nested scroll behavior

A legacy desktop rule in `src/styles.css` forced:

- `height: 100vh`
- `overflow: hidden`
- inner `.content` scrolling

Impact:

- double scrollbars
- clipped CMS content
- sticky sections fighting the browser viewport

Status: fixed for `.company-cms-shell` via scoped override.

## 3. Primitive controls were fragmented across three shells

Buttons, pills, and form fields were styled separately in:

- `src/styles.css`
- `src/multitenant/company-cms.css`
- `src/multitenant/multitenant.css`

Impact:

- text not vertically centered
- pill widths/heights inconsistent
- different border radii, typography, and focus states on the same product

Status: largely normalized in shared primitives and client-area primitives.

## High-Priority Findings

### 4. Tokens exist, but multitenant views still bypass them

`src/styles/tokens.css` and `src/styles/primitives.css` already provide a usable system, but several multitenant surfaces still hardcode:

- hex colors
- raw `Roboto` / `Sansation` stacks
- one-off radii
- one-off borders and shadows

Impact:

- brand/UI drift between Company Admin, CMS, and Client Area
- expensive maintenance
- harder theming

Status: partially improved. More cleanup still needed.

### 5. Responsive behavior is not yet governed by one shell standard

Current codebase mixes:

- mobile-first sections
- desktop-first overrides
- local breakpoint patches
- sticky panels with page-specific overflow behavior

Impact:

- some pages collapse well, others clip or stack awkwardly
- fixes in one area can regress another

Status: CMS/editor improved; broader responsive pass still needed.

## Medium Findings

### 6. Form language is only partially unified

The project now has closer alignment on input height, focus rings, and radii, but there are still page-specific field treatments in edit modes and auxiliary panels.

Status: in progress.

### 7. Table and management panels need one compact data-view standard

Client/account-management tables and older data views still use slightly different:

- row spacing
- header style
- cell padding
- action alignment

Status: not fully normalized yet.

## What Was Fixed In This Pass

### Shared system

- normalized shared button sizing and centering in `src/styles.css`
- normalized shared input sizing, radius, and focus rings
- normalized pill/badge sizing and status mapping
- aligned design primitives in `src/styles/primitives.css`

### Tenant CMS

- fixed topbar nav pills so labels center correctly
- removed tenant CMS inner-scroll conflicts
- kept CMS content on the browser scroll instead of trapped nested panels

### Content Editor

- removed conflicting late 3-column override
- restored coherent 2-column editor layout
- kept properties panel below the canvas instead of forcing a squeezed third column

### Client Area

- moved landing/client typography toward shared display/body tokens
- unified login inputs and CTA sizing with the core primitive scale
- aligned client header action trigger with shared pill/button language
- upgraded docs panels, stats cards, side cards, search, chips, edit fields, and save bar to the same border/radius/surface logic

## Current Quality Assessment

### Best aligned area

`src/multitenant/company-admin.css`

Why:

- strongest token usage
- cleaner shell structure
- more deliberate spacing and hierarchy

### Previously worst area

Content Editor in `src/styles.css`

Why:

- duplicate conflicting layout definitions
- nested scroll side effects
- broken content readability

Current status:

- structurally much better
- still needs visual simplification and component extraction later

### Most inconsistent remaining area

`src/multitenant/multitenant.css`

Why:

- many historical layers
- dual light/dark/edit-mode overrides
- repeated field/card/button definitions

## Recommended Next Phases

### Phase 3. Component extraction

Create a single component language for:

- buttons
- pills/status badges
- text fields/selects/textareas
- panel/card shells
- topbar action pills

Target:

- shared utility/component classes instead of shell-local duplicates

### Phase 4. Responsive audit per page

Check each flow at:

- 1440px
- 1280px
- 1024px
- 768px
- 480px

Target:

- no clipped headers
- no horizontal overflow
- no vertical text collapse
- no nested scroll without strong reason

### Phase 5. Token completion

Move remaining hardcoded values into tokens:

- surface tones
- shadows
- status colors
- panel radii
- form states

### Phase 6. Unified UI agent

Create a Codex skill/plugin that:

- audits changed CSS/TSX files
- flags non-token colors and fonts
- detects duplicate component styles
- checks button/input/card specs against the design system
- reports responsive risks before merge

This is fully feasible in this repo.

## Feasibility Verdict

Yes, this is absolutely buildable.

The codebase already has enough structure to become a unified UI system:

- token files exist
- the stronger admin shell already shows the direction
- the main problems are inconsistency and legacy layering, not lack of capability

The right approach is not a full rewrite.

The right approach is:

1. stabilize shell behavior
2. normalize primitives
3. extract repeated component patterns
4. enforce the system with a local audit skill
