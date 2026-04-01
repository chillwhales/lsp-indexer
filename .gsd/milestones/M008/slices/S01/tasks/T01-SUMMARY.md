---
id: T01
parent: S01
milestone: M008
provides: []
requires: []
affects: []
key_files: ["packages/indexer/scripts/abi-codegen.sh", "packages/indexer/package.json", "packages/indexer/schema.graphql", "packages/indexer/abi/custom/CHILL.json", "packages/indexer/abi/custom/Multicall3.json", "packages/indexer/abi/custom/ORBS.json"]
key_decisions: ["ABI barrel writes to src/abi/index.ts with skip-self guard to avoid clobbering app entry point"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran full verification: pnpm codegen exits 0, src/abi/index.ts barrel exists (48 files > 40), src/model/index.ts barrel exists (80 generated entities > 70). All 5 must-have checks passed."
completed_at: 2026-04-01T08:20:18.462Z
blocker_discovered: false
---

# T01: Move ABI codegen, TypeORM entity codegen, and all dependencies into packages/indexer — both codegen steps produce 48 ABI and 80 entity files

> Move ABI codegen, TypeORM entity codegen, and all dependencies into packages/indexer — both codegen steps produce 48 ABI and 80 entity files

## What Happened
---
id: T01
parent: S01
milestone: M008
key_files:
  - packages/indexer/scripts/abi-codegen.sh
  - packages/indexer/package.json
  - packages/indexer/schema.graphql
  - packages/indexer/abi/custom/CHILL.json
  - packages/indexer/abi/custom/Multicall3.json
  - packages/indexer/abi/custom/ORBS.json
key_decisions:
  - ABI barrel writes to src/abi/index.ts with skip-self guard to avoid clobbering app entry point
duration: ""
verification_result: passed
completed_at: 2026-04-01T08:20:18.463Z
blocker_discovered: false
---

# T01: Move ABI codegen, TypeORM entity codegen, and all dependencies into packages/indexer — both codegen steps produce 48 ABI and 80 entity files

**Move ABI codegen, TypeORM entity codegen, and all dependencies into packages/indexer — both codegen steps produce 48 ABI and 80 entity files**

## What Happened

Copied custom ABI JSONs, created adapted abi-codegen.sh (barrel writes to src/abi/index.ts not src/index.ts), copied schema.graphql, deleted src/model.ts re-export, added 8 new deps + 2 devDeps + 7 scripts to package.json, updated build to run codegen before tsc. Both codegen steps run successfully inside packages/indexer.

## Verification

Ran full verification: pnpm codegen exits 0, src/abi/index.ts barrel exists (48 files > 40), src/model/index.ts barrel exists (80 generated entities > 70). All 5 must-have checks passed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@chillwhales/indexer codegen` | 0 | ✅ pass | 2900ms |
| 2 | `ls packages/indexer/src/abi/index.ts` | 0 | ✅ pass | 50ms |
| 3 | `ls packages/indexer/src/model/index.ts` | 0 | ✅ pass | 50ms |
| 4 | `test $(ls packages/indexer/src/abi/*.ts | wc -l) -gt 40` | 0 | ✅ pass | 50ms |
| 5 | `test $(ls packages/indexer/src/model/generated/*.ts | wc -l) -gt 70` | 0 | ✅ pass | 50ms |


## Deviations

Added skip-self guard in ABI barrel loop to prevent index.ts from re-exporting itself — necessary because barrel now lives inside src/abi/ alongside generated files.

## Known Issues

None.

## Files Created/Modified

- `packages/indexer/scripts/abi-codegen.sh`
- `packages/indexer/package.json`
- `packages/indexer/schema.graphql`
- `packages/indexer/abi/custom/CHILL.json`
- `packages/indexer/abi/custom/Multicall3.json`
- `packages/indexer/abi/custom/ORBS.json`


## Deviations
Added skip-self guard in ABI barrel loop to prevent index.ts from re-exporting itself — necessary because barrel now lives inside src/abi/ alongside generated files.

## Known Issues
None.
