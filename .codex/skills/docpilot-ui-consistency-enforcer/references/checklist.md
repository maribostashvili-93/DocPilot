# UI Enforcement Checklist

Use this file only when running a consistency audit or review.

## Quick Grep Targets

Use `rg -n` against likely owners:

- `btn|btn-|ds-btn|company-admin-btn|company-client-edit-toggle`
- `input|select|textarea|focus`
- `pill|badge|status`
- `card|panel|surface|shadow|border-radius`
- `overflow|sticky|height: 100vh|min-height|max-height`
- `@media (max-width`
- `#[0-9a-fA-F]{3,8}`
- `font-family`

## Expected Shared Contracts

Prefer these shared layers:

- `src/styles.css` for cross-shell contracts
- `src/styles/primitives.css` for base button/input rules
- `src/styles/tokens.css` for token ownership
- multitenant shell files only for shell-specific layout and branding

## Failure Patterns

Flag these immediately:

- same component redefined three or more times in different shells
- one-off pill/button heights that break vertical centering
- topbars that rely on clipping instead of wrapping
- sidebar or editor panes trapped by nested scroll
- mobile rules that switch to `width: 100%` but forget spacing or wrapping
- dark/light mode overrides that bypass the token system

## Responsive Minimums

Check these at least in code review:

- `1440px`: no oversized empty gaps or overly stretched panels
- `1280px`: desktop grids still balanced
- `1024px`: sidebars/tables/actions still usable
- `768px`: header actions wrap cleanly
- `480px`: actions and filters can stack without clipping
