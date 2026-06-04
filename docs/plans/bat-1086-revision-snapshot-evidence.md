# bat-1086 Revision And Snapshot Evidence

Date: 2026-05-24
Task: `bat-1086` - AGENT: M1-03: Define immutable revision and publish snapshot model
Parent story: `bat-1064` - US M1-03: Define immutable revision and publish snapshot model

## BA Contract Covered

Source: `docs/plans/docpilot-ba-flow/01-m1-ba-decomposition.md`

- Publish snapshots must be immutable after creation.
- Snapshots capture document content, section order, marker data, locale state, actor, timestamp, readiness outcome, environment, and prior snapshot reference.
- Draft preview and published reader state must be distinguishable.
- Rollback creates a new restorative action instead of mutating old snapshots.
- Readiness blockers prevent publish.

## Implementation

- Extended release records with immutable snapshot metadata:
  - `sourceRevision`
  - `previousSnapshotId`
  - `environment`
  - `readinessScore`
  - `readinessReasons`
  - `snapshot`
  - `immutable`
  - `rollbackOf`
- Added `PublishSnapshot` payloads with cloned document, cloned sections, localization progress, marker targets, readiness result, actor, timestamp, environment, and prior snapshot.
- Replaced publish status toggle with immutable snapshot creation.
- Kept publish blocked by existing readiness checks.
- Added rollback action that creates a new published snapshot instead of mutating historical snapshots.
- Added snapshot metadata to the publishing table so operators can see immutable/draft state, source revision, environment, and readiness score.

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

- Snapshot payloads are now persisted through the server-backed release state from `bat-1084`.
- Action-level write permission for publishing is enforced by `bat-1085`.
- A future deeper implementation can add signed content hashes and a dedicated snapshot comparison view.
