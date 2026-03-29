---
id: T01
parent: S01
milestone: M006
provides: []
requires: []
affects: []
key_files:
  - packages/indexer/src/utils/index.ts
  - packages/indexer/src/core/verification.ts
  - packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts
  - packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts
key_decisions:
  - safeHexToBool returns false on error (not null) matching the boolean domain
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: passed
completed_at: 2026-03-29T09:47:55.700Z
blocker_discovered: false
---

# T01: Add safeHexToBool wrapper and replace all raw hexToBool call sites

**Add safeHexToBool wrapper and replace all raw hexToBool call sites to fix production crash on invalid Multicall3 return data**

## What Happened

Created `safeHexToBool(hex: Hex): boolean` in `utils/index.ts` following the existing safe wrapper pattern. The wrapper catches any error from viem's `hexToBool` and returns `false`. Updated all 3 call sites — `verification.ts` (primary crash site), `orbsClaimed.handler.ts`, and `chillClaimed.handler.ts` — to use the safe wrapper. The `verification.ts` fix was added during PR review after the initial pass missed it due to the root `.gitignore` `core` pattern.

## Verification

Build passes clean: `pnpm --filter=@chillwhales/indexer build` exits 0. `rg hexToBool packages/indexer/src/` confirms no raw `hexToBool` calls remain outside the wrapper definition in `utils/index.ts`.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@chillwhales/indexer build` | 0 | ✅ pass | 3200ms |
| 2 | `rg hexToBool packages/indexer/src/` (only utils lines) | 0 | ✅ pass | 100ms |

## Deviations

Initial pass missed `verification.ts` as a call site — caught during PR review. The root `.gitignore` `core` entry hid `packages/indexer/src/core/` from `git add`.

## Known Issues

None.

## Files Created/Modified

- `packages/indexer/src/utils/index.ts`
- `packages/indexer/src/core/verification.ts`
- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts`
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts`
