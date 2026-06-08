---
name: docpilot-ui-consistency-enforcer
description: Enforce DocPilot UI consistency and regression checks when Codex is auditing, reviewing, or changing CSS, TSX, layout, responsive behavior, design tokens, buttons, forms, tables, cards, sidebars, inspectors, or multitenant shells. Use for pre-merge UI review, post-fix regression checks, responsive audits, duplicate-style cleanup, token drift detection, and any task where visual rules must stay unified across src/styles.css, src/styles/*.css, src/multitenant/*.css, and related views.
---

# DocPilot UI Consistency Enforcer

Run a strict regression audit after UI changes or before new UI work.

Keep this skill focused on enforcement, not exploration. Use `docpilot-ui-ux-auditor` to discover and repair issues. Use this skill to verify that the result stays coherent.

Primary question: did the change create a reusable DocPilot pattern or just another page-local exception?

## Audit Targets

Inspect these first:

- `src/styles.css`
- `src/styles/tokens.css`
- `src/styles/primitives.css`
- `src/styles/surfaces.css`
- `src/multitenant/company-cms.css`
- `src/multitenant/company-admin.css`
- `src/multitenant/multitenant.css`
- owning TSX files in `src/` or `src/multitenant/`

Read [references/checklist.md](references/checklist.md) for grep targets and failure patterns.

## Enforcement Workflow

1. Identify the owning shell: legacy admin, tenant CMS, client area, company admin, reader, or marketing.
2. Find the shared primitive or component contract that should own the styling.
3. Check whether the change reintroduced duplicated rules, raw values, or breakpoint-only patches.
4. Check responsive behavior at `1440`, `1280`, `1024`, `768`, and `480` widths by reading the relevant media blocks.
5. Confirm the change still follows token, spacing, typography, and surface rules.
6. Run `npm.cmd run build` after meaningful UI edits.
7. Check whether the same interaction pattern now exists in conflicting forms elsewhere.

## Hard Rules

- Prefer one owning selector chain over repeated shell-local copies.
- Prefer `--ds-*` tokens and existing brand variables over raw hex colors, raw shadows, or raw radii.
- Prefer shared button, input, pill, card, and table rules over page-specific restyling.
- Prefer one standard inspector, toolbar, metric-card, and action-group pattern per shell.
- Prefer page scroll over nested inner scroll unless the container is explicitly meant to scroll.
- Prefer `min-width: 0`, wrapping, and grid collapse rules over fixed widths that clip.
- Treat late-file overrides as suspicious until proven necessary.

## Regression Checks

Reject or flag changes that introduce any of these without a clear reason:

- duplicate button systems for the same shell
- duplicate field sizing or focus-ring logic
- new hardcoded `#` colors where tokens already exist
- mixed font stacks for the same product family
- `overflow: hidden` on layout containers that also host sticky children
- fixed heights on content panels that can clip forms or editors
- mobile fixes that only patch one breakpoint and ignore nearby breakpoints
- table layouts that lose access to cells/actions on small screens
- a new one-off visual language for a screen that should inherit an existing DocPilot pattern

## Required Review Output

When reviewing, report in this order:

1. Broken usability regressions
2. Scroll/sticky/overflow regressions
3. Component consistency drift
4. Token and typography drift
5. Responsive risks
6. Pattern duplication or shell drift

For each finding, name:

- owning file
- selector or component
- exact regression
- smallest coherent fix

If no findings are present, say so explicitly and mention any testing gap, usually lack of visual browser verification.

## When Implementing Fixes

- Patch the owning shared rule first.
- Only add a shell-local override if the shared contract would harm another shell.
- Keep comments short and only where the layout logic is not obvious.
- Re-run the build after edits.
