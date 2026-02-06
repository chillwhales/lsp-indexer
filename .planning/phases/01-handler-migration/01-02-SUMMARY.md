---
phase: 01-handler-migration
plan: 02
subsystem: handlers
tags:
  [entityhandler, totalsupply, ownedassets, ownedtoken, transfer, enrichment-queue, delete-queue]

# Dependency graph
requires:
  - phase: 01-handler-migration plan 01
    provides: EntityHandler interface (async handle, queueDelete, postVerification, dependsOn, topological sort)
provides:
  - totalSupply EntityHandler with dual-trigger accumulation and underflow clamping
  - ownedAssets EntityHandler with dual-trigger accumulation, OwnedToken tracking, FK-ordered deletion
  - formatTokenId utility function for LSP8 token ID formatting
  - Colon-separated ID format for OwnedAsset and OwnedToken entities
affects: [01-handler-migration plan 04 (delete dead code), integration-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Dual-trigger handler: listens to multiple bags, aggregates from ALL bags per invocation'
    - 'In-memory accumulation: read DB + BatchContext state, apply all batch changes, write final'
    - 'FK-ordered queueDelete: children (OwnedToken) before parents (OwnedAsset)'
    - 'Direct FK set for non-core entities (OwnedAsset→OwnedToken) vs enrichment queue for core entities (UP, DA, NFT)'

key-files:
  created:
    - packages/indexer-v2/src/handlers/totalSupply.handler.ts
    - packages/indexer-v2/src/handlers/ownedAssets.handler.ts
  modified:
    - packages/indexer-v2/src/utils/index.ts

key-decisions:
  - 'OwnedAsset FK on OwnedToken set directly (not via enrichment queue) since OwnedAsset is handler-created, not a verified core entity'
  - 'Dual-trigger handlers read from ALL bags each invocation to ensure consistency regardless of trigger order'
  - 'tokenId null sentinel used to mark OwnedTokens for deletion (matching V1 pattern)'

patterns-established:
  - 'Dual-trigger accumulation: handler aggregates from multiple bags per invocation'
  - 'Direct FK for handler-created entities vs enrichment queue for verified entities'

# Metrics
duration: 5min
completed: 2026-02-06
---

# Phase 1 Plan 2: TotalSupply + OwnedAssets Handlers Summary

**Two standalone V2 EntityHandlers for transfer-derived tallies: totalSupply with underflow clamping, ownedAssets with OwnedToken tracking and FK-ordered deletion via queueDelete**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-06T10:15:50Z
- **Completed:** 2026-02-06T10:21:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created totalSupply handler: dual-trigger from LSP7+LSP8 bags, mint/burn accumulation, underflow clamped to zero with warning
- Created ownedAssets handler: dual-trigger accumulation, sender decrement/receiver increment, OwnedToken creation/deletion, FK-ordered queueDelete
- Updated ID format to colon-separated (`owner:address`, `owner:address:tokenId`) — already applied by parallel plan 01-03
- Added formatTokenId utility function — already applied by parallel plan 01-03

## Task Commits

Each task was committed atomically:

1. **Task 1: Update ID generation + create totalSupply handler** - `791f57f` (feat)
2. **Task 2: Create ownedAssets handler** - `daed05f` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/totalSupply.handler.ts` - Standalone EntityHandler for TotalSupply entity maintenance
- `packages/indexer-v2/src/handlers/ownedAssets.handler.ts` - Standalone EntityHandler for OwnedAsset/OwnedToken entity maintenance
- `packages/indexer-v2/src/utils/index.ts` - ID format change and formatTokenId (changes already applied by parallel 01-03)

## Decisions Made

- **OwnedAsset FK set directly on OwnedToken:** OwnedAsset is a handler-created entity, not a core verified entity (UP/DA/NFT), so it can't go through the enrichment queue. The ownedAsset FK is set directly when the parent is known to exist.
- **Dual-trigger aggregation pattern:** Both handlers listen to `['LSP7Transfer', 'LSP8Transfer']` and read from ALL bags on each invocation. This ensures consistent results regardless of which trigger fires first.
- **tokenId null sentinel for deletion:** OwnedTokens marked for deletion have `tokenId` set to null, matching the V1 pattern. The handler filters these into the delete queue.

## Deviations from Plan

None — plan executed exactly as written. The ID format changes and formatTokenId utility were already applied by the parallel plan 01-03 execution, making those parts of Task 1 no-ops.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both handlers compile and satisfy the EntityHandler interface
- Ready for plan 01-04 (delete dead code in handlerHelpers.ts)
- All handler migration targets (totalSupply, ownedAssets, formattedTokenId, decimals) are now complete

---

## Self-Check: PASSED

---

_Phase: 01-handler-migration_
_Completed: 2026-02-06_
