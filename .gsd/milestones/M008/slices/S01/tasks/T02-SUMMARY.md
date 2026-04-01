---
id: T02
parent: S01
milestone: M008
provides: []
requires: []
affects: []
key_files: ["packages/indexer/package.json", "packages/indexer/src/**/*.ts"]
key_decisions: ["Replaced @chillwhales/typeorm → @/model and @chillwhales/abi → @/abi using sed bulk rewrite", "Deep imports @chillwhales/abi/lib/abi/Multicall3 → @/abi/Multicall3 for 3 handler files"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "pnpm --filter=@chillwhales/indexer build exits 0. rg confirms zero @chillwhales/abi or @chillwhales/typeorm references in src/ or package.json."
completed_at: 2026-04-01T08:22:45.323Z
blocker_discovered: false
---

# T02: Replaced 71 @chillwhales/abi and @chillwhales/typeorm imports with local path aliases and removed both workspace deps from package.json — build passes clean

> Replaced 71 @chillwhales/abi and @chillwhales/typeorm imports with local path aliases and removed both workspace deps from package.json — build passes clean

## What Happened
---
id: T02
parent: S01
milestone: M008
key_files:
  - packages/indexer/package.json
  - packages/indexer/src/**/*.ts
key_decisions:
  - Replaced @chillwhales/typeorm → @/model and @chillwhales/abi → @/abi using sed bulk rewrite
  - Deep imports @chillwhales/abi/lib/abi/Multicall3 → @/abi/Multicall3 for 3 handler files
duration: ""
verification_result: passed
completed_at: 2026-04-01T08:22:45.323Z
blocker_discovered: false
---

# T02: Replaced 71 @chillwhales/abi and @chillwhales/typeorm imports with local path aliases and removed both workspace deps from package.json — build passes clean

**Replaced 71 @chillwhales/abi and @chillwhales/typeorm imports with local path aliases and removed both workspace deps from package.json — build passes clean**

## What Happened

Rewrote all imports from the two workspace packages to local path aliases: 57 files @chillwhales/typeorm → @/model, 11 files @chillwhales/abi → @/abi, 3 files deep import @chillwhales/abi/lib/abi/Multicall3 → @/abi/Multicall3. Removed both workspace:* dependencies from package.json. Build (codegen + tsc) passes clean with zero remaining old imports.

## Verification

pnpm --filter=@chillwhales/indexer build exits 0. rg confirms zero @chillwhales/abi or @chillwhales/typeorm references in src/ or package.json.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@chillwhales/indexer build` | 0 | ✅ pass | 7000ms |
| 2 | `rg '@chillwhales/abi|@chillwhales/typeorm' packages/indexer/src/ --type ts | wc -l` | 0 | ✅ pass (0 matches) | 500ms |
| 3 | `rg '@chillwhales/abi|@chillwhales/typeorm' packages/indexer/package.json` | 1 | ✅ pass (no matches) | 200ms |


## Deviations

Initial sed pass missed multi-line imports — required a second pass targeting the string literal directly.

## Known Issues

None.

## Files Created/Modified

- `packages/indexer/package.json`
- `packages/indexer/src/**/*.ts`


## Deviations
Initial sed pass missed multi-line imports — required a second pass targeting the string literal directly.

## Known Issues
None.
