---
id: T01
parent: S02
milestone: M008
provides: []
requires: []
affects: []
key_files: ["packages/indexer/test/integration/pipeline.test.ts", "eslint.config.ts", "pnpm-lock.yaml"]
key_decisions: ["Scoped reference fixes to the two code files specified in plan; remaining stale references in docs/config are for later tasks"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Verified directories deleted, zero grep matches for @chillwhales/typeorm in pipeline.test.ts and eslint.config.ts, zero lockfile references, indexer build exit 0, full workspace build exit 0."
completed_at: 2026-04-01T08:39:45.940Z
blocker_discovered: false
---

# T01: Deleted packages/abi/ and packages/typeorm/, fixed stale @chillwhales/typeorm import and comment, full workspace build passes

> Deleted packages/abi/ and packages/typeorm/, fixed stale @chillwhales/typeorm import and comment, full workspace build passes

## What Happened
---
id: T01
parent: S02
milestone: M008
key_files:
  - packages/indexer/test/integration/pipeline.test.ts
  - eslint.config.ts
  - pnpm-lock.yaml
key_decisions:
  - Scoped reference fixes to the two code files specified in plan; remaining stale references in docs/config are for later tasks
duration: ""
verification_result: passed
completed_at: 2026-04-01T08:39:45.943Z
blocker_discovered: false
---

# T01: Deleted packages/abi/ and packages/typeorm/, fixed stale @chillwhales/typeorm import and comment, full workspace build passes

**Deleted packages/abi/ and packages/typeorm/, fixed stale @chillwhales/typeorm import and comment, full workspace build passes**

## What Happened

Deleted the packages/abi/ and packages/typeorm/ directories. Fixed the stale import in pipeline.test.ts from @chillwhales/typeorm to @/model. Updated the eslint.config.ts comment to remove the @chillwhales/typeorm reference. Ran pnpm install to update the lockfile (0 references to deleted packages remain). Confirmed pnpm --filter=@chillwhales/indexer build and pnpm build both exit 0 with all 7 workspace projects building successfully.

## Verification

Verified directories deleted, zero grep matches for @chillwhales/typeorm in pipeline.test.ts and eslint.config.ts, zero lockfile references, indexer build exit 0, full workspace build exit 0.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test ! -d packages/abi && test ! -d packages/typeorm` | 0 | ✅ pass | 100ms |
| 2 | `pnpm install` | 0 | ✅ pass | 6600ms |
| 3 | `pnpm --filter=@chillwhales/indexer build` | 0 | ✅ pass | 3200ms |
| 4 | `pnpm build` | 0 | ✅ pass | 24700ms |


## Deviations

None.

## Known Issues

Remaining stale @chillwhales/typeorm and @chillwhales/abi references in non-code files (AGENTS.md, CI workflow, docs, changeset config) — documentation/config concerns for later tasks.

## Files Created/Modified

- `packages/indexer/test/integration/pipeline.test.ts`
- `eslint.config.ts`
- `pnpm-lock.yaml`


## Deviations
None.

## Known Issues
Remaining stale @chillwhales/typeorm and @chillwhales/abi references in non-code files (AGENTS.md, CI workflow, docs, changeset config) — documentation/config concerns for later tasks.
