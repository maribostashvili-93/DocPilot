# bat-1089 Accessibility Evidence

Date: 2026-05-24
Task: `bat-1089` - AGENT: M1-06: Add accessible marker and section manipulation alternatives
Parent story: `bat-1067` - US M1-06: Add accessible marker and section manipulation alternatives

## BA Contract Covered

Source: `docs/plans/docpilot-ba-flow/01-m1-ba-decomposition.md`

- Marker movement, resize, and nudge controls are available without pointer dragging.
- Section reorder remains available without drag-drop through explicit move up/down controls.
- Marker placement controls have visible labels and accessible names.
- Focus states are visible for marker controls, section action buttons, and draggable markers.
- Existing keyboard shortcut behavior is not changed.

## Implementation

- Added numeric marker placement controls in the basic marker inspector:
  - X position
  - Y position
  - width
  - height
- Added labeled nudge buttons for moving markers up, down, left, and right in 1% increments.
- Reused the existing `updateMarker` normalization path so numeric and nudge edits preserve the same bounds as pointer movement.
- Added a named accessible placement group with short helper copy.
- Added focus-visible styles for nudge buttons, section action controls, and draggable marker elements.
- Confirmed section manipulation already exposes explicit move up/down buttons in `SectionControllerBar`.

## Verification

Commands run:

```bash
npm run build
npm run lint
git diff --check
```

Results:

- TypeScript/Vite production build passed.
- ESLint passed.
- Git whitespace check passed.

## Residual Notes

- This slice keeps drag-drop and pointer manipulation intact.
- More advanced keyboard-only marker interaction can later be added directly on focused marker previews, but the required no-pointer path is now present through inspector controls.
