# bat-1090 Validation Evidence

Date: 2026-05-24
Task: `bat-1090` - AGENT: M1-07: Add schema validation and safe advanced editing guardrails
Parent story: `bat-1068` - US M1-07: Add schema validation and safe advanced editing guardrails

## BA Contract Covered

Source: `docs/plans/docpilot-ba-flow/01-m1-ba-decomposition.md`

- Slugs, versions, release labels, marker targets, and required metadata validate before save/publish.
- Invalid fields show remediation copy.
- Validation distinguishes draft-save warnings from publish blockers.
- Existing prototype content is flagged without silent deletion.
- Validation feeds publish readiness blockers.

## Implementation

- Added reusable validation issue model with error/warning severity.
- Added document draft validation:
  - required title
  - required owner
  - semantic version format
  - product-scoped document title uniqueness
  - description warning
- Added section draft validation:
  - required title
  - required section order/number
  - slug format
  - document-scoped slug uniqueness
  - unsafe HTML warning
- Added release validation:
  - required label
  - label format
  - semantic version format
  - document-scoped label uniqueness
- Added publish readiness blockers for:
  - broken marker targets
  - unsafe HTML patterns such as scripts, inline event handlers, and `javascript:` URLs
- Added inline validation messages in document, section, and release forms.
- Preserved invalid imported/prototype content while making publish readiness name the issues to correct.

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

- Sanitized diff preview can be expanded in a later editor-specific task.
- This slice establishes the validation model and readiness feed needed by publish, marker, and accessibility follow-up stories.
