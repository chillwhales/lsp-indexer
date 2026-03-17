---
id: S07
parent: M001
milestone: M001
provides:
  - Case-insensitive contract filter address comparison in pipeline
  - UniversalProfileOwner entity handler (postVerification)
  - DigitalAssetOwner entity handler (postVerification)
  - ChillClaimed handler for tracking Chillwhale NFT claim status
  - OrbsClaimed handler for tracking Orbs NFT claim status
  - Two-phase pattern for mint detection + on-chain verification
requires: []
affects: []
key_files: []
key_decisions:
  - 'Fixed address comparison at pipeline filter level (not in constants)'
  - 'Owner handlers use postVerification: true (need verified UP/DA entities)'
  - 'Entity id = emitting address, address field = newOwner (matches V1 exactly)'
  - 'Two-phase pattern: create entities with value=false on mint, verify and update to value=true at chain head'
  - 'Batch size 500 with 1-second rate limiting matches V1 behavior'
  - 'CHILL contract uses getClaimedStatusFor; ORBS contract uses getChillwhaleClaimStatus'
patterns_established:
  - 'Pipeline contract filter compares addresses case-insensitively'
  - 'PostVerification handlers access verified entities via batchCtx.getVerified()'
  - 'Owner entities created after verification resolves UP/DA FKs'
  - 'Two-phase verification pattern: mint detection (every batch) + on-chain verification (isHead only)'
  - 'Multicall3 batching with graceful error handling and rate limiting'
observability_surfaces: []
drill_down_paths: []
duration: 2 min
verification_result: passed
completed_at: 2026-02-13
blocker_discovered: false
---
# S07: Pipeline Bug Fix Missing Handlers

**# Phase 05.1 Plan 01: Pipeline Bug Fix & Owner Handlers Summary**

## What Happened

# Phase 05.1 Plan 01: Pipeline Bug Fix & Owner Handlers Summary

**Fixed case-sensitive address comparison bug in pipeline.ts and created UniversalProfileOwner/DigitalAssetOwner postVerification handlers**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-13T06:53:40Z
- **Completed:** 2026-02-13T06:55:43Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Fixed pipeline contract filter to use case-insensitive address comparison — unblocks Follow, Unfollow, DeployedContracts, DeployedERC1167Proxies events (previously silenced due to lowercase vs checksummed address mismatch)
- Created UniversalProfileOwner handler that runs post-verification to create owner entities for verified Universal Profiles
- Created DigitalAssetOwner handler that runs post-verification to create owner entities for verified Digital Assets

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix case-sensitive contract filter address comparison** - `e26fd6c` (fix)
2. **Task 2: Create UniversalProfileOwner and DigitalAssetOwner handlers** - `c38148e` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/core/pipeline.ts` - Changed line 207 from strict `!==` to `.toLowerCase()` comparison for contract filter addresses
- `packages/indexer-v2/src/handlers/universalProfileOwner.handler.ts` - PostVerification handler that creates owner entities for verified UPs from OwnershipTransferred events
- `packages/indexer-v2/src/handlers/digitalAssetOwner.handler.ts` - PostVerification handler that creates owner entities for verified DAs from OwnershipTransferred events

## Decisions Made

**Fix location:** Applied case-insensitive comparison at the pipeline filter level (line 205-207) rather than normalizing constants. This is the correct fix point because it's where addresses from two different sources (Subsquid's lowercase log.address vs V2's mixed-case constants) are compared.

**postVerification timing:** Owner handlers must run after Step 5 (VERIFY) because they need to know which addresses are verified UniversalProfiles or DigitalAssets. Running earlier would create owner entities for unverified addresses.

**Entity structure:** Matched V1 exactly — `id` = emitting contract address (NOT the owner address), `address` field = newOwner. This preserves V1's data model where owner entities represent the contract's current owner.

**Deduplication pattern:** Used Map<string, Owner> keyed by event.address for last-writer-wins semantics, matching V1 behavior when multiple OwnershipTransferred events occur for the same contract in one batch.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward implementation following established V2 EntityHandler patterns.

## Next Phase Readiness

**Ready for:** Phase 5.1 Plan 02 (ChillClaimed + OrbsClaimed handlers)

**Status:** Pipeline bug fix unblocks 4 entity types immediately. Owner handlers complete the OwnershipTransferred event flow. After re-indexing, Follow (>100K), Unfollow (>2K), DeployedContracts (>0), and DeployedERC1167Proxies (>35K) entities will populate correctly.

**No blockers** - both fixes are complete and follow established patterns.

---

## Self-Check: PASSED

Verified files exist:

- ✓ packages/indexer-v2/src/handlers/universalProfileOwner.handler.ts
- ✓ packages/indexer-v2/src/handlers/digitalAssetOwner.handler.ts

Verified commits exist:

- ✓ e26fd6c (fix: case-insensitive address comparison)
- ✓ c38148e (feat: owner handlers)

---

_Phase: 05.1-pipeline-bug-fix-missing-handlers_
_Completed: 2026-02-13_

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
