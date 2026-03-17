---
id: T01
parent: S07
milestone: M001
provides:
  - Case-insensitive contract filter address comparison in pipeline
  - UniversalProfileOwner entity handler (postVerification)
  - DigitalAssetOwner entity handler (postVerification)
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
# T01: 05.1-pipeline-bug-fix-missing-handlers 01

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
