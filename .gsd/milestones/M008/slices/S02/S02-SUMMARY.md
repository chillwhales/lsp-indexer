---
id: S02
parent: M008
milestone: M008
provides:
  - 6-package workspace with indexer containing all ABI and entity codegen internally
requires:
  - slice: S01
    provides: Indexer with integrated ABI and entity codegen — all imports resolve internally
affects:
  []
key_files:
  - packages/indexer/test/integration/pipeline.test.ts
  - eslint.config.ts
  - pnpm-lock.yaml
key_decisions:
  - Scoped stale reference fixes to code files (ts/json/yaml) only; documentation and config file cleanup deferred
patterns_established:
  - (none)
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M008/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M008/slices/S02/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-01T08:43:39.231Z
blocker_discovered: false
---

# S02: Remove old packages and verify parity

**Deleted packages/abi/ and packages/typeorm/, fixed all stale code references, confirmed 6-package workspace with zero stale imports and full build passing**

## What Happened

T01 deleted the two legacy package directories (packages/abi/ and packages/typeorm/), fixed the stale `@chillwhales/typeorm` import in `packages/indexer/test/integration/pipeline.test.ts` (changed to `@/model`), updated the eslint.config.ts comment to remove the `@chillwhales/typeorm` reference, and ran `pnpm install` to update the lockfile. Both `pnpm --filter=@chillwhales/indexer build` and `pnpm build` exited 0.

T02 ran comprehensive verification: confirmed both directories are gone, exactly 6 package directories remain (comparison-tool, indexer, next, node, react, types), zero `rg` matches for `@chillwhales/abi` or `@chillwhales/typeorm` across ts/json/yaml files (excluding node_modules and .gsd/), indexer build passes, and full workspace build (all 7 projects including docs) passes.

## Verification

All 5 slice-level checks pass: (1) packages/abi/ and packages/typeorm/ do not exist, (2) exactly 6 package directories under packages/, (3) zero rg matches for stale @chillwhales/abi or @chillwhales/typeorm references in ts/json/yaml files, (4) pnpm --filter=@chillwhales/indexer build exits 0 (codegen:abi + codegen:typeorm + tsc), (5) pnpm build exits 0 across all 7 workspace projects including docs.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

Stale @chillwhales/typeorm and @chillwhales/abi references remain in non-code files (AGENTS.md, CI workflow YAML, docs, changeset config). These are documentation/config concerns outside this slice's scope.

## Follow-ups

Clean up stale @chillwhales/abi and @chillwhales/typeorm references in AGENTS.md, CI workflow files, docs pages, and changeset config.

## Files Created/Modified

- `packages/indexer/test/integration/pipeline.test.ts` — Changed @chillwhales/typeorm import to @/model
- `eslint.config.ts` — Removed @chillwhales/typeorm reference from comment
- `pnpm-lock.yaml` — Updated lockfile after removing two workspace packages
