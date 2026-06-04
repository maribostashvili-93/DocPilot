# bat-1088 Marker Inspector Evidence

Date: 2026-05-24
Task: `bat-1088` - AGENT: M1-05: Refactor marker editor into basic and advanced inspector tiers
Parent story: `bat-1066` - US M1-05: Refactor marker editor into basic and advanced inspector tiers

## BA Contract Covered

Source: `docs/plans/docpilot-ba-flow/01-m1-ba-decomposition.md`

- Default marker creation exposes basic inspector behavior first.
- Advanced controls for color, opacity, dialog behavior, CTA behavior, and pointer controls are collapsed by default.
- Style defaults come from approved presets before freeform styling.
- Screenshot and annotated-image paths continue to use the shared `MarkerDraft` model.

## Implementation

- Added a collapsed advanced marker inspector state.
- Renamed the secondary marker panel to advanced style/link behavior.
- Kept the default view focused on basic marker fields and approved visual presets.
- Added a compact approved-preset strip in the collapsed inspector.
- Advanced freeform controls now require explicit expansion:
  - color controls
  - opacity controls
  - dialog/CTA behavior
  - pointer fine controls
  - custom preset save/remove controls
- Existing marker model and serialized HTML path remain unchanged.

## Verification

Commands run:

```bash
npm run build
npm run lint
```

Results:

- TypeScript/Vite production build passed.
- ESLint passed.

## Residual Notes

- Marker type-change destructive confirmation can be deepened later; compatible value preservation already remains in the existing type-switch code.
- Keyboard/numeric marker manipulation is handled by the next planned task, `bat-1089`.
