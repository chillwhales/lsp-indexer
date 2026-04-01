---
id: S01
parent: M008
milestone: M008
provides:
  - packages/indexer self-contains all codegen — no cross-package dependencies for abi or typeorm
  - Dockerfile references only packages/indexer/ — ready for S02 package deletion
requires:
  []
affects:
  - S02
key_files:
  - packages/indexer/scripts/abi-codegen.sh
  - packages/indexer/package.json
  - packages/indexer/schema.graphql
  - packages/indexer/abi/custom/CHILL.json
  - packages/indexer/abi/custom/Multicall3.json
  - packages/indexer/abi/custom/ORBS.json
  - docker/Dockerfile
  - docker/entrypoint.sh
  - package.json
key_decisions:
  - ABI barrel writes to src/abi/index.ts with skip-self guard to avoid clobbering app entry point
  - Replaced @chillwhales/typeorm → @/model and @chillwhales/abi → @/abi using sed bulk rewrite then verified zero remaining
  - Deep imports @chillwhales/abi/lib/abi/Multicall3 → @/abi/Multicall3 for 3 handler files
  - Dockerfile runner stage copies schema.graphql from indexer for runtime migrations
patterns_established:
  - Single-package codegen: both ABI and TypeORM codegen run as npm scripts inside packages/indexer, chained via `pnpm codegen` before tsc
  - ABI barrel at src/abi/index.ts with skip-self guard pattern for generated barrels that live alongside their exports
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M008/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M008/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M008/slices/S01/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-01T08:26:07.039Z
blocker_discovered: false
---

# S01: Merge abi + typeorm into indexer

**Moved ABI codegen, TypeORM entity codegen, all dependencies, and infrastructure references into packages/indexer — single `pnpm --filter=@chillwhales/indexer build` now runs both codegen steps and tsc with zero cross-package imports.**

## What Happened

This slice consolidated two satellite packages (@chillwhales/abi and @chillwhales/typeorm) into the indexer package across three tasks.

**T01** copied the codegen machinery: 3 custom ABI JSONs into `abi/custom/`, an adapted `abi-codegen.sh` script that writes its barrel to `src/abi/index.ts` (with a skip-self guard to avoid clobbering the app entry point), and `schema.graphql` at the package root for squid-typeorm-codegen. Deleted the old `src/model.ts` re-export that would conflict with the generated `src/model/` directory. Added 8 runtime deps, 2 devDeps, and 7 scripts to package.json. Updated the build script to `pnpm codegen && tsc`. Both codegen steps produce output: 48 ABI files and 80 entity files.

**T02** rewrote 71 imports across the indexer source: 57 files `@chillwhales/typeorm` → `@/model`, 11 files `@chillwhales/abi` → `@/abi`, and 3 deep imports `@chillwhales/abi/lib/abi/Multicall3` → `@/abi/Multicall3`. Removed both `workspace:*` dependencies from package.json. Full build (codegen + tsc) passes clean.

**T03** updated infrastructure: Dockerfile no longer copies or builds packages/abi or packages/typeorm — only packages/indexer remains. Added schema.graphql COPY for runtime migrations. Entrypoint now runs migrations from packages/indexer. Root package.json delegates hasura/migration scripts to @chillwhales/indexer.

## Verification

All slice-level verification checks pass:
1. `pnpm --filter=@chillwhales/indexer build` exits 0 (codegen + tsc in ~3.4s)
2. `rg '@chillwhales/abi|@chillwhales/typeorm' packages/indexer/src/ --type ts` returns 0 matches
3. `rg '@chillwhales/typeorm|packages/typeorm|@chillwhales/abi|packages/abi' docker/ package.json` returns 0 matches
4. 48 ABI .ts files generated (> 40 threshold)
5. 80 model .ts files generated (> 70 threshold)
6. schema.graphql at package root: 1179 lines
7. 3 custom ABI JSONs in abi/custom/
8. src/abi/index.ts barrel exists
9. src/model/index.ts barrel exists

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T01: Added skip-self guard in ABI barrel generation loop — barrel now lives inside src/abi/ alongside generated files, so it must exclude itself from re-exports. T02: Initial sed pass missed multi-line imports, required a second pass targeting the string literal directly. T03: Cleaned a stale comment referencing packages/typeorm/db path.

## Known Limitations

packages/abi/ and packages/typeorm/ still exist on disk — they are removed in S02. Until S02 completes, pnpm workspace still resolves them (harmless but redundant).

## Follow-ups

S02: Delete packages/abi/ and packages/typeorm/, remove from pnpm-workspace.yaml, verify root pnpm build and Docker build parity.

## Files Created/Modified

- `packages/indexer/scripts/abi-codegen.sh` — New ABI codegen script adapted from packages/abi — writes barrel to src/abi/index.ts
- `packages/indexer/package.json` — Added 8 deps, 2 devDeps, 7 scripts; updated build to codegen+tsc; removed workspace deps
- `packages/indexer/schema.graphql` — Copied from packages/typeorm — 1179-line schema for squid-typeorm-codegen
- `packages/indexer/abi/custom/CHILL.json` — Custom ABI copied from packages/abi
- `packages/indexer/abi/custom/Multicall3.json` — Custom ABI copied from packages/abi
- `packages/indexer/abi/custom/ORBS.json` — Custom ABI copied from packages/abi
- `packages/indexer/src/model.ts` — Deleted — replaced by generated src/model/index.ts barrel
- `packages/indexer/src/**/*.ts` — 71 import rewrites: @chillwhales/typeorm → @/model, @chillwhales/abi → @/abi
- `docker/Dockerfile` — Removed all packages/abi and packages/typeorm references; added schema.graphql COPY
- `docker/entrypoint.sh` — Changed migration/hasura path from packages/typeorm to packages/indexer
- `package.json` — Root scripts now delegate to @chillwhales/indexer instead of @chillwhales/typeorm
