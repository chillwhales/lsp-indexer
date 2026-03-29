---
id: T01
parent: S01
milestone: M006
provides: []
requires: []
affects: []
key_files: ["packages/indexer/src/utils/index.ts", "packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts", "packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts"]
key_decisions: ["safeHexToBool returns false on error (not null) matching the boolean domain"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Build passes clean: pnpm --filter=@chillwhales/indexer build exits 0. grep confirms no raw hexToBool calls remain outside the wrapper definition in utils/index.ts."
completed_at: 2026-03-29T09:47:55.699Z
blocker_discovered: false
---

# T01: Add safeHexToBool wrapper and replace all raw hexToBool call sites to fix production crash on invalid Multicall3 return data

> Add safeHexToBool wrapper and replace all raw hexToBool call sites to fix production crash on invalid Multicall3 return data

## What Happened
---
id: T01
parent: S01
milestone: M006
key_files:
  - packages/indexer/src/utils/index.ts
  - packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts
  - packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts
key_decisions:
  - safeHexToBool returns false on error (not null) matching the boolean domain
duration: ""
verification_result: passed
completed_at: 2026-03-29T09:47:55.700Z
blocker_discovered: false
---

# T01: Add safeHexToBool wrapper and replace all raw hexToBool call sites to fix production crash on invalid Multicall3 return data

**Add safeHexToBool wrapper and replace all raw hexToBool call sites to fix production crash on invalid Multicall3 return data**

## What Happened

Created safeHexToBool(hex: Hex): boolean in utils/index.ts following the existing safe wrapper pattern. The wrapper catches any error from viem's hexToBool and returns false. Updated both handler call sites (orbsClaimed.handler.ts and chillClaimed.handler.ts) to use the safe wrapper. The task plan listed 3 call sites but only 2 existed — verification.ts does not use hexToBool.

## Verification

Build passes clean: pnpm --filter=@chillwhales/indexer build exits 0. grep confirms no raw hexToBool calls remain outside the wrapper definition in utils/index.ts.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@chillwhales/indexer build` | 0 | ✅ pass | 3200ms |
| 2 | `rg hexToBool packages/indexer/src/ | grep -v safeHexToBool (only utils lines)` | 0 | ✅ pass | 100ms |


## Deviations

Task plan listed verification.ts as a call site but it doesn't contain hexToBool. Only 2 call sites existed, not 3.

## Known Issues

None.

## Files Created/Modified

- `packages/indexer/src/utils/index.ts`
- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts`
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts`


## Deviations
Task plan listed verification.ts as a call site but it doesn't contain hexToBool. Only 2 call sites existed, not 3.

## Known Issues
None.
