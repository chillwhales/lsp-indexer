---
phase: 19-block-ordering
plan: 01
subsystem: database
tags: [typeorm, schema, graphql, codegen, enrichment, block-ordering]

# Dependency graph
requires:
  - phase: 18-docker-compose
    provides: production infrastructure foundation
provides:
  - blockNumber/transactionIndex/logIndex columns on all 72 entity types
  - updated EnrichmentRequest interface with block position fields
  - regenerated TypeORM entity classes with new columns
  - OwnedAsset/OwnedToken block→blockNumber rename
affects: [19-02, 19-03, 21-sorting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Block ordering fields (blockNumber, transactionIndex, logIndex) on every entity"
    - "Composite index on (blockNumber, transactionIndex, logIndex) for efficient ordering queries"
    - "Placeholder 0 values in queueEnrichment calls pending real block data (Plans 02/03)"

key-files:
  created: []
  modified:
    - packages/typeorm/schema.graphql
    - packages/indexer/src/core/types/verification.ts
    - packages/indexer/src/handlers/ownedAssets.handler.ts
    - packages/indexer/src/plugins/events/*.plugin.ts
    - packages/indexer/src/handlers/*.handler.ts

key-decisions:
  - "Used composite @index on (blockNumber, transactionIndex, logIndex) for all 61 modified entities"
  - "OwnedAsset/OwnedToken 'block' field renamed to 'blockNumber' for consistency with all other entities"
  - "Placeholder blockNumber:0 values used in queueEnrichment calls (replaced in Plans 02/03)"

patterns-established:
  - "Block ordering triple: every entity carries blockNumber, transactionIndex, logIndex for deterministic ordering"

requirements-completed: [BORD-05, BORD-06]

# Metrics
duration: 10min
completed: 2026-03-09
---

# Phase 19 Plan 01: Block Ordering Schema & Type Foundation Summary

**Added blockNumber/transactionIndex/logIndex columns to all 72 entity types in schema.graphql, updated EnrichmentRequest interface, regenerated TypeORM entities, and fixed all build errors with placeholder values**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-09T13:30:46Z
- **Completed:** 2026-03-09T13:41:24Z
- **Tasks:** 2
- **Files modified:** 47

## Accomplishments
- All 72 @entity types now have blockNumber, transactionIndex, logIndex fields with individual @index annotations
- 61 modified entities have composite @index(fields: ["blockNumber", "transactionIndex", "logIndex"]) for efficient ordering queries
- EnrichmentRequest interface carries block position fields for the verification pipeline
- OwnedAsset/OwnedToken `block` field renamed to `blockNumber` for consistency
- All ~90 queueEnrichment() calls compile with placeholder 0 values (temporary — replaced in Plans 02/03)
- Both @chillwhales/typeorm and @chillwhales/indexer build cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Add block ordering fields to all entities in schema.graphql** - `0174b46` (feat)
2. **Task 2: Update EnrichmentRequest interface + run codegen + verify build** - `37fdc67` (feat)

## Files Created/Modified
- `packages/typeorm/schema.graphql` - Added 3 block ordering fields + composite index to 61 entity types, renamed block→blockNumber on OwnedAsset/OwnedToken
- `packages/indexer/src/core/types/verification.ts` - Added blockNumber, transactionIndex, logIndex to EnrichmentRequest interface
- `packages/indexer/src/handlers/ownedAssets.handler.ts` - Fixed block→blockNumber rename, added transactionIndex/logIndex to entity constructors
- `packages/indexer/src/plugins/events/*.plugin.ts` (11 files) - Added placeholder block values to queueEnrichment calls
- `packages/indexer/src/handlers/*.handler.ts` (20 files) - Added placeholder block values to queueEnrichment calls
- `packages/indexer/src/handlers/__tests__/*.test.ts` (7 files) - Updated tests with new required fields

## Decisions Made
- Used composite `@index(fields: ["blockNumber", "transactionIndex", "logIndex"])` on all modified entities for efficient blockchain ordering queries
- Placed block fields right after `id` field (before `timestamp`/`address`) in entity definitions
- Used placeholder `blockNumber: 0, transactionIndex: 0, logIndex: 0` in all enrichment calls — Plans 02 and 03 will replace these with real event data

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema and type foundation complete
- Ready for Plan 02 (EventPlugin block data propagation) and Plan 03 (EntityHandler block data propagation)
- Plans 02/03 will replace the placeholder 0 values with real block data from events

## Self-Check: PASSED

All key files verified on disk. Both commit hashes found in git log.

---
*Phase: 19-block-ordering*
*Completed: 2026-03-09*
