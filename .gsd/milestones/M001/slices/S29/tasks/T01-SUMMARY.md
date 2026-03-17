---
id: T01
parent: S29
milestone: M001
provides:
  - Consistent newest/oldest block-order sorting across all 12 domain types and services
  - Deterministic pagination via block-order tiebreaker on all non-block sort fields
  - Default newest-first ordering when no sort parameter is passed
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 8min
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---
# T01: 21-sorting-consumer-package-release 01

**# Phase 21 Plan 01: Sorting Consumer Package Release Summary**

## What Happened

# Phase 21 Plan 01: Sorting Consumer Package Release Summary

**Consistent newest/oldest block-order sorting with deterministic pagination tiebreakers across all 12 domain types and services**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-12T05:24:58Z
- **Completed:** 2026-03-12T05:33:52Z
- **Tasks:** 3
- **Files modified:** 20

## Accomplishments
- All 12 SortFieldSchemas updated with `newest`/`oldest` as first two entries, removing individual `block`/`timestamp` fields
- All 12 buildOrderBy functions handle `newest → desc`, `oldest → asc` via buildBlockOrderSort
- All non-block sort fields across all 12 domains have block-order tiebreaker for deterministic pagination
- All fetch/subscription functions default to newest-first when no sort parameter is passed
- All 4 consumer packages (types, node, react, next) build successfully — sort fields propagate through full stack

## Task Commits

Each task was committed atomically:

1. **Task 1: Update SortFieldSchemas for 8 domains in types package** - `cce5afc` (feat)
2. **Task 2: Wire buildBlockOrderSort into 8 new domain services** - `856fdf5` (feat)
3. **Task 3: Add block-order tiebreaker to 4 existing domain services** - `86f6249` (feat)

## Files Created/Modified
- `packages/types/src/profiles.ts` - Added newest/oldest to ProfileSortFieldSchema
- `packages/types/src/digital-assets.ts` - Added newest/oldest to DigitalAssetSortFieldSchema
- `packages/types/src/nfts.ts` - Added newest/oldest to NftSortFieldSchema
- `packages/types/src/owned-assets.ts` - Added newest/oldest, removed timestamp/block from OwnedAssetSortFieldSchema
- `packages/types/src/owned-tokens.ts` - Added newest/oldest, removed block/timestamp from OwnedTokenSortFieldSchema
- `packages/types/src/creators.ts` - Added newest/oldest, removed timestamp from CreatorSortFieldSchema
- `packages/types/src/issued-assets.ts` - Added newest/oldest, removed timestamp from IssuedAssetSortFieldSchema
- `packages/types/src/encrypted-assets.ts` - Added newest/oldest, removed timestamp from EncryptedAssetSortFieldSchema
- `packages/node/src/services/profiles.ts` - Added newest/oldest cases, tiebreaker, default fallback
- `packages/node/src/services/digital-assets.ts` - Added newest/oldest cases, tiebreaker, default fallback
- `packages/node/src/services/nfts.ts` - Added newest/oldest cases, tiebreaker, default fallback
- `packages/node/src/services/owned-assets.ts` - Added newest/oldest cases, removed block/timestamp cases, tiebreaker, default fallback
- `packages/node/src/services/owned-tokens.ts` - Added newest/oldest cases, removed block/timestamp cases, tiebreaker, default fallback
- `packages/node/src/services/creators.ts` - Added newest/oldest cases, removed timestamp case, tiebreaker, default fallback
- `packages/node/src/services/issued-assets.ts` - Added newest/oldest cases, removed timestamp case, tiebreaker, default fallback
- `packages/node/src/services/encrypted-assets.ts` - Added newest/oldest cases, removed timestamp case, tiebreaker, default fallback
- `packages/node/src/services/followers.ts` - Added tiebreaker to 4 non-block sort fields
- `packages/node/src/services/data-changed-events.ts` - Added tiebreaker to 2 non-block sort fields
- `packages/node/src/services/token-id-data-changed-events.ts` - Added tiebreaker to 2 non-block sort fields
- `packages/node/src/services/universal-receiver-events.ts` - Added tiebreaker to 3 non-block sort fields

## Decisions Made
- Removed `block`, `timestamp`, `transactionIndex`, `logIndex` as individual sort fields — replaced by deterministic `newest`/`oldest` using `buildBlockOrderSort`
- Block-order tiebreaker (`...buildBlockOrderSort('desc')`) appended to ALL non-block sort fields for deterministic pagination
- Default sort is `buildBlockOrderSort('desc')` (newest-first) when no sort parameter passed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All sorting changes complete and verified across full stack
- Ready for Phase 21 Plan 02 (changeset release of consumer packages)

## Self-Check: PASSED

All 20 modified files verified on disk. All 3 task commits (cce5afc, 856fdf5, 86f6249) verified in git log.

---
*Phase: 21-sorting-consumer-package-release*
*Completed: 2026-03-12*
