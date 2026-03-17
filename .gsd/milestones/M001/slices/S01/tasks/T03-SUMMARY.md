---
id: T03
parent: S01
milestone: M001
provides:
  - Decimals handler (postVerification, Multicall3 batch reads)
  - FormattedTokenId handler (dependsOn ordering, retroactive DB update)
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 3min
verification_result: passed
completed_at: 2026-02-06
blocker_discovered: false
---
# T03: 01-handler-migration 03

**# Phase 1 Plan 3: Decimals & FormattedTokenId Handlers Summary**

## What Happened

# Phase 1 Plan 3: Decimals & FormattedTokenId Handlers Summary

**Decimals handler rewritten with postVerification Step 5.5 hook + FormattedTokenId handler with dependsOn ordering and retroactive DB update for LSP8 format changes**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-06T10:16:24Z
- **Completed:** 2026-02-06T10:19:46Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Rewrote decimals handler to V2 EntityHandler with `postVerification: true` — runs after DA verification using Multicall3 with batch size 100
- Created formattedTokenId handler with `dependsOn: ['lsp8TokenIdFormat']` and two-path logic: new NFTs get formatted in place, format changes trigger retroactive DB query and reformat of all existing NFTs
- Both handlers follow V2 conventions: entities in BatchContext, enrichment queued for FK resolution, no direct store writes

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite decimals handler for V2 interface** - `716ec55` (feat)
2. **Task 2: Create formattedTokenId handler with retroactive update** - `5e81814` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/decimals.handler.ts` - V2 EntityHandler with postVerification, Multicall3 decimals() reads
- `packages/indexer-v2/src/handlers/formattedTokenId.handler.ts` - New handler with dependsOn, two-path formatting, retroactive update
- `packages/indexer-v2/src/utils/index.ts` - Fixed missing viem imports for formatTokenId (bytesToHex, hexToBytes, hexToString, sliceHex, Hex)

## Decisions Made

- Decimals handler uses `postVerification: true` to access newly verified DigitalAsset entities — same approach as planned
- FormattedTokenId Path 1 mutates NFT entities in-place in BatchContext (they're already there from the NFT handler), Path 2 adds reformatted DB NFTs to BatchContext for pipeline persistence
- Unknown format returns null (not raw tokenId like V1) + warning log per user constraint

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed missing viem imports in utils/index.ts for formatTokenId**

- **Found during:** Task 1 (build verification)
- **Issue:** Plan 01-02 (running in parallel) added `formatTokenId()` to utils/index.ts but the viem imports (`bytesToHex`, `Hex`, `hexToBytes`, `hexToString`, `sliceHex`) were missing, causing build failure
- **Fix:** Added the missing imports to the existing viem import line
- **Files modified:** packages/indexer-v2/src/utils/index.ts
- **Verification:** Build passes with zero errors
- **Committed in:** 716ec55 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary fix for parallel plan convergence. Plan 01-02 will also modify this file — both plans converge on the same correct state.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both handlers compile and follow V2 conventions
- Ready for Plan 01-04 (legacy code cleanup + deletion)
- No blockers

---

## Self-Check: PASSED

---

_Phase: 01-handler-migration_
_Completed: 2026-02-06_
