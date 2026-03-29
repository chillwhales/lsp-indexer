# M006: Fix InvalidHexBooleanError Crash — Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

## Project Description

Fix the production crash in the indexer's VERIFY step where viem's `hexToBool()` throws `InvalidHexBooleanError` when a rogue contract returns non-boolean hex from `supportsInterface`. The indexer is stuck in an infinite restart loop at block 7,137,664.

## Why This Milestone

The indexer is down in production. A contract at block ~7.1M returns `0xd3c07dc6b58504c0828278bf2ed04be835d266d18669fad3b090dd8289b59417` for `supportsInterface` — a 32-byte value that is neither `0x0` nor `0x1`. viem's strict `hexToBool()` throws, crashing the pipeline. The crash is deterministic — every restart hits the same block, same contract, same error.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Run the indexer past block 7,137,664 without crashes
- Contracts returning invalid `supportsInterface` responses are silently treated as "does not support" (false)

### Entry point / environment

- Entry point: `pnpm --filter=@chillwhales/indexer build` (verification via build)
- Environment: Docker container running the indexer against LUKSO mainnet RPC
- Live dependencies involved: LUKSO RPC (read-only via Multicall3)

## Completion Class

- Contract complete means: `safeHexToBool` utility exists, all 3 call sites use it, `pnpm --filter=@chillwhales/indexer build` passes
- Integration complete means: none — this is a local code change, no cross-package wiring
- Operational complete means: none — operational proof requires deploying to production (out of scope for this milestone)

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- All 3 `hexToBool` call sites replaced with `safeHexToBool`
- No raw `hexToBool` imports remain in the codebase
- `pnpm --filter=@chillwhales/indexer build` passes with zero errors

## Risks and Unknowns

- Near-zero risk — this is a targeted defensive fix to error handling in 3 files

## Existing Codebase / Prior Art

- `packages/indexer/src/core/verification.ts` — line 233, `hexToBool(r.returnData)` in `multicallVerify()`. The primary crash site.
- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts` — line 177, identical `hexToBool` pattern in multicall result processing
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts` — line 174, identical `hexToBool` pattern in multicall result processing
- `packages/indexer/src/utils/index.ts` — existing shared utilities file, candidate location for `safeHexToBool`

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R015 — Safe `supportsInterface` return parsing (primary)
- R016 — All `hexToBool` call sites hardened (completeness)

## Scope

### In Scope

- Create a `safeHexToBool` utility that wraps hex-to-boolean conversion with try-catch, returning `false` for invalid values
- Replace all 3 `hexToBool` call sites with `safeHexToBool`
- Ensure the indexer package builds cleanly

### Out of Scope / Non-Goals

- Deploying to production (separate ops process)
- Adding tests (no test infrastructure exists in this project)
- Logging or metrics for invalid hex values (nice-to-have but not required for the fix)

## Technical Constraints

- viem's `hexToBool()` only accepts `0x0` or `0x1` — anything else throws `InvalidHexBooleanError`
- The fix must handle ABI-encoded booleans (32-byte padded `0x...0001` / `0x...0000`) as well as short forms
- `isHex()` check already exists before `hexToBool()` — the issue is that valid hex can still be non-boolean

## Integration Points

- LUKSO RPC via Multicall3 (read-only, no changes to this interaction)

## Open Questions

- None — the fix is straightforward
