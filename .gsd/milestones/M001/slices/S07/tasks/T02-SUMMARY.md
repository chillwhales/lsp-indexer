---
id: T02
parent: S07
milestone: M001
provides:
  - ChillClaimed handler for tracking Chillwhale NFT claim status
  - OrbsClaimed handler for tracking Orbs NFT claim status
  - Two-phase pattern for mint detection + on-chain verification
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 2 min
verification_result: passed
completed_at: 2026-02-13
blocker_discovered: false
---
# T02: 05.1-pipeline-bug-fix-missing-handlers 02

**# Phase 5.1 Plan 02: ChillClaimed and OrbsClaimed Handlers Summary**

## What Happened

# Phase 5.1 Plan 02: ChillClaimed and OrbsClaimed Handlers Summary

**Two-phase Chillwhales game entity handlers with mint detection and Multicall3-verified claim status**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-13T06:56:36Z
- **Completed:** 2026-02-13T06:58:58Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created ChillClaimed handler for tracking which Chillwhale NFTs have claimed their CHILL tokens
- Created OrbsClaimed handler for tracking which Chillwhale NFTs have claimed their Orbs
- Implemented two-phase pattern: mint detection on every batch, on-chain verification at chain head only

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ChillClaimed handler** - `ce9e631` (feat)
2. **Task 2: Create OrbsClaimed handler** - `24a9699` (feat)

**Plan metadata:** (to be added in metadata commit)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/chillwhales/chillClaimed.handler.ts` - ChillClaimed entity handler with CHILL contract verification
- `packages/indexer-v2/src/handlers/chillwhales/orbsClaimed.handler.ts` - OrbsClaimed entity handler with ORBS contract verification

## Decisions Made

**Two-phase verification pattern:**

- Phase 1 (every batch): Detect LSP8 mint transfers from zero address to CHILLWHALES_ADDRESS, create entities with value=false
- Phase 2 (chain head only): Query unclaimed entities, batch verify via Multicall3, update value=true for verified claims
- Rationale: Avoids wasteful RPC calls during historical sync; verification only happens at live chain head

**Multicall batching:**

- Batch size 500 (matching V1)
- 1-second delay between batches for rate limiting
- Graceful error handling: skip failed batches, log warnings, continue processing
- Rationale: Matches V1 behavior exactly for production parity

**Contract differences:**

- ChillClaimed uses `CHILL_ADDRESS` with `CHILL.functions.getClaimedStatusFor`
- OrbsClaimed uses `ORBS_ADDRESS` with `ORBS.functions.getChillwhaleClaimStatus`
- Both mint from CHILLWHALES_ADDRESS (same NFT collection)
- Rationale: Different reward contracts have different ABI function names

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Phase 5.1 completion and Phase 5.2 planning.

**Handler registration:** These handlers need to be registered in the pipeline's handler registry (same pattern as existing chillwhales handlers like orbLevel, orbFaction).

**Testing:** Handlers will be tested during full re-index when Phase 5.1 deploys. Comparison tool will verify ChillClaimed and OrbsClaimed row counts match V1.

---

_Phase: 05.1-pipeline-bug-fix-missing-handlers_
_Completed: 2026-02-13_

## Self-Check: PASSED

All files and commits verified.
