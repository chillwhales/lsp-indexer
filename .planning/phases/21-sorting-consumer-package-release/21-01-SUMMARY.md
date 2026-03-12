---
phase: 21-sorting-consumer-package-release
plan: 01
subsystem: api
tags: [sorting, hasura, zod, block-order, pagination]

# Dependency graph
requires:
  - phase: 19.1-event-domains-consumer-release
    provides: 4 existing domain services with newest/oldest pattern (followers, data-changed-events, token-id-data-changed-events, universal-receiver-events)
provides:
  - Consistent newest/oldest block-order sorting across all 12 domain types and services
  - Deterministic pagination via block-order tiebreaker on all non-block sort fields
  - Default newest-first ordering when no sort parameter is passed
affects: [react, next, changeset-release]

# Tech tracking
tech-stack:
  added: []
  patterns: [block-order-tiebreaker-on-all-sort-fields, newest-first-default-sort]

key-files:
  created: []
  modified:
    - packages/types/src/profiles.ts
    - packages/types/src/digital-assets.ts
    - packages/types/src/nfts.ts
    - packages/types/src/owned-assets.ts
    - packages/types/src/owned-tokens.ts
    - packages/types/src/creators.ts
    - packages/types/src/issued-assets.ts
    - packages/types/src/encrypted-assets.ts
    - packages/node/src/services/profiles.ts
    - packages/node/src/services/digital-assets.ts
    - packages/node/src/services/nfts.ts
    - packages/node/src/services/owned-assets.ts
    - packages/node/src/services/owned-tokens.ts
    - packages/node/src/services/creators.ts
    - packages/node/src/services/issued-assets.ts
    - packages/node/src/services/encrypted-assets.ts
    - packages/node/src/services/followers.ts
    - packages/node/src/services/data-changed-events.ts
    - packages/node/src/services/token-id-data-changed-events.ts
    - packages/node/src/services/universal-receiver-events.ts

key-decisions:
  - "Removed block, timestamp, transactionIndex, logIndex as individual sort fields — replaced by deterministic newest/oldest"
  - "Block-order tiebreaker appended to ALL non-block sort fields for deterministic pagination"
  - "Default sort is buildBlockOrderSort('desc') when no sort parameter passed"

patterns-established:
  - "Block-order tiebreaker: every non-newest/oldest sort case appends ...buildBlockOrderSort('desc')"
  - "Default fallback: ?? buildBlockOrderSort('desc') on all fetch/subscription config functions"

requirements-completed: [SORT-01, SORT-02, SORT-03, SORT-04, SORT-05]

# Metrics
duration: 8min
completed: 2026-03-12
---

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
