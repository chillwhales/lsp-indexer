---
id: M006
title: "Fix InvalidHexBooleanError Crash"
status: complete
completed_at: 2026-03-29T09:50:52.202Z
key_decisions:
  - D009: safeHexToBool returns false on error (not null) — matches boolean domain where invalid hex means 'does not support interface'
key_files:
  - packages/indexer/src/utils/index.ts
  - packages/indexer/src/core/verification.ts
  - packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts
  - packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts
lessons_learned:
  - The .gitignore root-level `core` pattern hides packages/indexer/src/core/ from git add — requires `git add -f`. This caused the initial miss of verification.ts as a call site during the first pass.
  - The safe wrapper pattern (safeBigInt, safeHexToNumber, safeHexToBool) in utils/index.ts is the established pattern for any viem decoder that throws on malformed input. Future viem decoders that can throw should get a safe* wrapper here.
---

# M006: Fix InvalidHexBooleanError Crash

**Defensive safeHexToBool wrapper prevents indexer crash on rogue supportsInterface return data at block 7,137,664**

## What Happened

The indexer was stuck in an infinite restart loop at block 7,137,664 — a contract returned a 32-byte non-boolean hex value from `supportsInterface`, and viem's strict `hexToBool()` threw `InvalidHexBooleanError`, crashing the VERIFY step every time.

S01 created a `safeHexToBool(hex: Hex): boolean` utility in `packages/indexer/src/utils/index.ts`, following the existing safe wrapper pattern (`safeBigInt`, `safeHexToNumber`). The wrapper catches any error from viem's `hexToBool` and returns `false` — semantically correct since invalid hex means the contract doesn't properly implement the interface.

All 3 call sites were migrated to `safeHexToBool`: `verification.ts` (the primary crash site in `multicallVerify()`), `orbsClaimed.handler.ts`, and `chillClaimed.handler.ts`. The raw `hexToBool` import was removed from all three files. The `verification.ts` migration was caught during PR review — the initial pass missed it due to the root `.gitignore` `core` pattern hiding `packages/indexer/src/core/` from `git add`.

The indexer package builds cleanly with zero TypeScript errors. No raw `hexToBool` calls remain outside the safe wrapper definition.

## Success Criteria Results

- **pnpm --filter=@chillwhales/indexer build passes**: ✅ Build exits 0 with zero errors
- **All hexToBool call sites use safeHexToBool**: ✅ All 3 call sites (verification.ts, orbsClaimed.handler.ts, chillClaimed.handler.ts) replaced with safeHexToBool.
- **rg hexToBool shows only the safe wrapper definition and its usages**: ✅ Only 3 matches, all in utils/index.ts (import, JSDoc, implementation). Zero raw calls in handlers or core files.

## Definition of Done Results

- **S01 complete**: ✅ S01 marked complete with passing verification
- **S01 summary exists**: ✅ S01-SUMMARY.md written with full narrative, verification, and deviation notes
- **No cross-slice integration needed**: ✅ Single-slice milestone, no integration points

## Requirement Outcomes

- **R015** (Safe supportsInterface return parsing): active → validated — `safeHexToBool` wraps `hexToBool` in try-catch returning false. Build passes. The crash-inducing code path in `verification.ts` now returns false instead of throwing.
- **R016** (All hexToBool call sites hardened): active → validated — All 3 call sites in the indexer use `safeHexToBool`. `rg hexToBool` shows only the wrapper definition in utils/index.ts.

## Deviations

The initial S01 pass missed the `verification.ts` call site. The root `.gitignore` has a `core` entry that hides `packages/indexer/src/core/` from `git add`, which contributed to the oversight. Caught during PR review and fixed in a follow-up commit.

## Follow-ups

None.
