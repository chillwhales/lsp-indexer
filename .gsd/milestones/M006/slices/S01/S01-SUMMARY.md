---
id: S01
parent: M006
milestone: M006
provides:
  - safeHexToBool utility in packages/indexer/src/utils/index.ts
requires:
  []
affects:
  []
key_files:
  - packages/indexer/src/utils/index.ts
  - packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts
  - packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts
key_decisions:
  - safeHexToBool returns false on error (not null) — matches the boolean domain where invalid hex means 'does not support interface'
patterns_established:
  - safe wrapper pattern extended to hexToBool — any viem decoder that throws on malformed input should get a safe* wrapper in utils/index.ts
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M006/slices/S01/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-29T09:49:00.133Z
blocker_discovered: false
---

# S01: Defensive hexToBool hardening

**Safe hexToBool wrapper replaces all raw call sites, preventing production crash on invalid Multicall3 return data**

## What Happened

Created `safeHexToBool(hex: Hex): boolean` in `packages/indexer/src/utils/index.ts` following the existing safe wrapper pattern (`safeBigInt`, `safeHexToNumber`, `safeJsonStringify`). The wrapper catches any error from viem's `hexToBool` and returns `false`, treating invalid hex as a negative boolean rather than crashing.

Replaced raw `hexToBool` calls in both handler files — `orbsClaimed.handler.ts` and `chillClaimed.handler.ts`. The task plan listed 3 call sites including `verification.ts`, but that file does not contain `hexToBool`. Only 2 actual call sites existed.

The fix unblocks the indexer from its restart loop at block 7,137,664 where `supportsInterface` returned non-boolean hex data that viem's `hexToBool` rejected with `InvalidHexBooleanError`.

## Verification

- `pnpm --filter=@chillwhales/indexer build` exits 0 (tsc clean)
- `rg hexToBool packages/indexer/src/` shows only 3 lines, all inside the wrapper definition in `utils/index.ts` (import, JSDoc, implementation). Zero raw calls remain in handlers or core files.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Task plan listed `packages/indexer/src/core/verification.ts` as a call site, but it does not contain `hexToBool`. Only 2 call sites existed (both in handlers/chillwhales/), not 3.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `packages/indexer/src/utils/index.ts` — Added safeHexToBool wrapper and hexToBool import from viem
- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts` — Replaced raw hexToBool with safeHexToBool import
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts` — Replaced raw hexToBool with safeHexToBool import
