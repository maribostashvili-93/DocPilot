---
name: docpilot-ui-ux-auditor
description: Use for DocPilot UI/UX audits, design analysis, and fixes when working on CSS consistency, layout breakage, multitenant CMS shells, dashboard/content-editor usability, spacing, typography, design decisions, tokens, buttons, cards, sticky/scroll behavior, and responsive cleanup across src/styles.css, src/styles/*.css, src/multitenant/*.css, and related TSX views.
---

# DocPilot UI UX Auditor

Use this skill when the task is to analyze or fix visual consistency, usability, or design direction in DocPilot.

## Goals

- Make the UI function correctly before making it prettier.
- Remove broken inner scroll patterns unless they are clearly intentional.
- Keep one consistent visual language across CMS, client area, admin, dashboards, and editor screens.
- Prefer token-driven fixes over one-off colors, radii, spacing, or shadows.
- Prefer coherent layout systems over isolated per-screen patches.
- Explain why the current UI fails before proposing restyling.

## Start Here

Inspect these files first:

- `src/styles.css`
- `src/styles/tokens.css`
- `src/styles/primitives.css`
- `src/styles/surfaces.css`
- `src/multitenant/company-cms.css`
- `src/multitenant/multitenant.css`
- `src/multitenant/company-admin.css`
- Relevant TSX view for the affected page, usually `src/App.tsx` or `src/multitenant/*.tsx`

Use `rg -n` to find the page shell, class names, and later overrides before editing.

## Audit Order

1. Confirm which shell owns the bug: legacy admin, tenant CMS, client area, company admin, reader, or marketing.
2. Find the layout container causing the issue: grid, flex, sticky pane, min-width, max-height, overflow, or mobile media override.
3. Check for later CSS blocks overriding an earlier fix.
4. Normalize the fix through existing design-system variables when possible.
5. Verify desktop first, then tablet/mobile collapse.
6. If the issue is larger than one selector, propose the owning component or shell contract that should be introduced.

## Priority Rules

Fix in this order:

1. Broken usability: clipped content, vertical text wrapping, inaccessible controls, unusable forms, hidden actions.
2. Scroll bugs: nested scrollbars, sticky elements trapped by overflow, panels with fixed heights that block content.
3. Layout inconsistency: mismatched widths, panels fighting for space, cards/buttons with conflicting sizing.
4. Visual inconsistency: radius, shadows, typography, spacing, color usage.
5. Structural design drift: two screens solving the same UI problem with different patterns.

## Editing Rules

- Prefer changing the narrowest owning selector.
- If the same component style is repeated, consolidate it instead of patching each instance.
- Prefer `min-width: 0`, `overflow-wrap: anywhere`, and sane grid collapse rules over hacks.
- Prefer window/page scroll over multiple competing inner scroll regions.
- Keep buttons and pills vertically centered with `inline-flex` or `flex`.
- Reuse `--ds-*` and existing brand variables before introducing new raw values.
- Avoid adding new design tokens unless repetition proves they are needed.
- If a screen needs redesign, keep the new pattern reusable by at least one more DocPilot view.
- Prefer card, form, table, sidebar, toolbar, and inspector patterns that can become standards.

## Common Hotspots

- Tenant CMS top shell and dashboard: `company-cms.css` plus `src/styles.css`
- Content Editor: `src/App.tsx` + editor rules in `src/styles.css`
- Multitenant client/admin shells: `src/multitenant/*.css`
- Responsive regressions often come from later media-query blocks near the bottom of `src/styles.css`

## Expected Output

When asked for analysis or review:

- Identify the owning view and selector chain.
- Call out the exact cause, not just the symptom.
- Propose the smallest coherent fix.
- If the design itself is weak, separate `bug fix` from `design improvement`.
- Say whether the right move is:
  - local CSS fix
  - shared component cleanup
  - shell-level redesign

When asked to implement:

- Make the CSS/TSX change directly.
- Run `npm.cmd run build` after meaningful UI edits.
- Mention remaining risks if visual verification in a browser was not performed.
- Keep visual improvements intentional, not generic “make it modern” churn.
