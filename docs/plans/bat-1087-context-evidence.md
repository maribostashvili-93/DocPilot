# bat-1087 Product/Document Context Evidence

Date: 2026-05-24
Task: `bat-1087` - AGENT: M1-04: Normalize product/document context across admin
Parent story: `bat-1065` - US M1-04: Normalize product/document context across admin

## BA Contract Covered

Source: `docs/plans/docpilot-ba-flow/01-m1-ba-decomposition.md`

- Admin screens show active DocPilot workspace context and selected product/document context.
- Aviator remains sample product content, while DocPilot is the platform identity.
- Context switching warns when draft/review workflow state exists.
- Admin language uses workspace, product, document, section, locale, and release/snapshot terminology.
- Empty/no-product states provide guided setup instead of ambiguous blank screens.

## Implementation

- Added a persistent admin context bar above every admin page.
- Context bar shows:
  - Workspace: DocPilot
  - Selected product
  - Document count for the selected product
  - Workflow state, including draft/review warning
- Added guarded product context switching from dashboard/document controls.
- Switching product context now warns when the current product has draft/review sections or draft release state.
- Kept DocPilot as platform shell identity and Aviator as sample product content.

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
- Diff whitespace check passed.

## Residual Notes

- This slice adds the shared context model and product-switch protection.
- Deeper dirty-form tracking inside currently open modal forms can be added later if needed, but product-level draft/review state is now guarded.
