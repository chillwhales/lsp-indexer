---
id: S23
parent: M001
milestone: M001
provides:
  - blockNumber/transactionIndex/logIndex columns on all 72 entity types
  - updated EnrichmentRequest interface with block position fields
  - regenerated TypeORM entity classes with new columns
  - OwnedAsset/OwnedToken block→blockNumber rename
  - "All 11 EventPlugins pass real block/tx/log values in enrichment requests"
  - "Pipeline computes earliest block position per address from enrichment queue"
  - "New UP/DA entities receive block fields from earliest enrichment (BORD-04)"
  - "BlockPosition type exported from core/types"
  - "compareBlockPosition helper for tuple ordering"
  - "All ~29 EntityHandlers set real block fields on derived entity constructors"
  - "All enrichment requests from handlers use real block values (no placeholder 0s)"
  - "Metadata fetch handlers propagate parent entity block fields to all sub-entities"
  - "Chillwhales handlers wire block fields from Transfer/TokenIdDataChanged events"
requires: []
affects: []
key_files: []
key_decisions:
  - "Used composite @index on (blockNumber, transactionIndex, logIndex) for all 61 modified entities"
  - "OwnedAsset/OwnedToken 'block' field renamed to 'blockNumber' for consistency with all other entities"
  - "Placeholder blockNumber:0 values used in queueEnrichment calls (replaced in Plans 02/03)"
  - "BlockPosition type defined in core/types/verification.ts (central types barrel) rather than verification.ts to avoid circular imports"
  - "Block position map is optional param on VerifyFn to maintain backward compatibility"
  - "Fallback to 0 for block fields when no block position available (blockPos?.blockNumber ?? 0)"
  - "Merge/spread patterns preserve existing entity block fields (lsp5ReceivedAssets, lsp4Creators, lsp12IssuedAssets) — only new entities get event block fields"
  - "Post-verification handlers cast verified entities to access block fields: (da as { id: string; blockNumber?: number; ... })"
  - "Metadata fetch handlers propagate parent entity block fields to sub-entities rather than using any separate source"
  - "lsp6Controllers shared helper getOrCreateController receives event parameter to thread block fields through"
  - "lsp4MetadataBaseUri treated as Category B (transfer-derived) not Category A (data-key) despite similar name"
patterns_established:
  - "Block ordering triple: every entity carries blockNumber, transactionIndex, logIndex for deterministic ordering"
  - "BORD-04 earliest-enrichment: pipeline computes min(blockNumber, transactionIndex, logIndex) per address and passes to verification for new entity creation"
  - "compareBlockPosition: standard 3-field tuple comparison (blockNumber → transactionIndex → logIndex)"
  - "Parent-to-child block propagation: metadata fetch sub-entities inherit blockNumber/transactionIndex/logIndex from their parent entity"
  - "Dual-trigger handlers (orbLevel, orbFaction, nft) source block fields from whichever event triggered them"
observability_surfaces: []
drill_down_paths: []
duration: 17min
verification_result: passed
completed_at: 2026-03-09
blocker_discovered: false
---
# S23: Block Ordering

**# Phase 19 Plan 01: Block Ordering Schema & Type Foundation Summary**

## What Happened

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

# Phase 19 Plan 02: Wire Block Ordering Through Plugins and Pipeline Summary

**All 11 EventPlugins pass real block data in enrichment requests; pipeline computes earliest-seen block position per address for new UP/DA entity creation (BORD-04 oldest retention)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-09T13:43:58Z
- **Completed:** 2026-03-09T13:52:49Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Replaced placeholder `blockNumber: 0, transactionIndex: 0, logIndex: 0` with real values in all 29 queueEnrichment() calls across 11 EventPlugins
- Pipeline Step 5 now computes earliest block position per address from enrichment queue before verification
- New UP/DA entities created with block fields from their earliest enrichment request (BORD-04 oldest retention guarantee)
- FK stubs confirmed id-only — no risk of block field overwrite during enrichment

## Task Commits

Each task was committed atomically:

1. **Task 1: Update all EventPlugins to pass real block fields** - `9a54f71` (feat)
2. **Task 2: Update pipeline + verification to set block fields on core entities** - `53e693d` (feat)

## Files Created/Modified
- `packages/indexer/src/plugins/events/dataChanged.plugin.ts` - 2 enrichment calls updated with real block values
- `packages/indexer/src/plugins/events/deployedContracts.plugin.ts` - 1 enrichment call updated
- `packages/indexer/src/plugins/events/deployedProxies.plugin.ts` - 1 enrichment call updated
- `packages/indexer/src/plugins/events/executed.plugin.ts` - 3 enrichment calls updated
- `packages/indexer/src/plugins/events/follow.plugin.ts` - 2 enrichment calls updated
- `packages/indexer/src/plugins/events/lsp7Transfer.plugin.ts` - 4 enrichment calls updated
- `packages/indexer/src/plugins/events/lsp8Transfer.plugin.ts` - 5 enrichment calls updated
- `packages/indexer/src/plugins/events/ownershipTransferred.plugin.ts` - 4 enrichment calls updated
- `packages/indexer/src/plugins/events/tokenIdDataChanged.plugin.ts` - 2 enrichment calls updated
- `packages/indexer/src/plugins/events/unfollow.plugin.ts` - 2 enrichment calls updated
- `packages/indexer/src/plugins/events/universalReceiver.plugin.ts` - 3 enrichment calls updated
- `packages/indexer/src/core/types/verification.ts` - Added BlockPosition type
- `packages/indexer/src/core/pipeline.ts` - Added compareBlockPosition, earliest block computation, updated VerifyFn type
- `packages/indexer/src/core/verification.ts` - Updated verifyWithInterface and createVerifyFn to accept/use block position map

## Decisions Made
- BlockPosition type placed in `core/types/verification.ts` (the types barrel) rather than in `verification.ts` directly, to avoid circular imports between pipeline.ts and verification.ts
- VerifyFn signature updated with optional `blockPositionByAddress` parameter for backward compatibility
- Fallback `?? 0` for block fields when no position data available — safe default for edge cases

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 03 (EntityHandlers) is next — will wire block data through handler-created entities
- Uncommitted handler files with block ordering changes observed in working directory (from Plan 03 scope work started previously) — these build correctly but should be committed under Plan 03
- All prerequisite types, pipeline infrastructure, and plugin changes are ready

---
*Phase: 19-block-ordering*
*Completed: 2026-03-09*

# Phase 19 Plan 03: Wire Block Ordering Through EntityHandlers Summary

**All ~29 EntityHandlers set real blockNumber/transactionIndex/logIndex on every derived entity from triggering events, with metadata fetch handlers propagating parent block fields to sub-entities**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-09T13:44:02Z
- **Completed:** 2026-03-09T14:01:04Z
- **Tasks:** 2
- **Files modified:** 28

## Accomplishments
- Replaced placeholder `blockNumber: 0, transactionIndex: 0, logIndex: 0` with real values in all entity constructors and enrichment requests across 21 non-chillwhales handlers (Task 1)
- Updated 4 chillwhales handlers (chillClaimed, orbsClaimed, orbLevel, orbFaction) to use Transfer/TokenIdDataChanged block fields
- Propagated parent entity block fields to 7 sub-entity types in lsp3ProfileFetch, 10 in lsp4MetadataFetch, and 7 in lsp29EncryptedAssetFetch
- Zero `blockNumber: 0` placeholders remain in any handler source (only test files retain fixture values)
- Full indexer build compiles cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Update data-key, event-derived, post-verification, and special handlers** - `87d5b50` (feat)
2. **Task 2: Update metadata fetch and chillwhales handlers** - `3843d8e` (feat)

## Files Created/Modified

### Task 1 (21 handlers)
- `lsp4TokenName.handler.ts` - block fields on entity constructor + enrichment
- `lsp4TokenSymbol.handler.ts` - block fields on entity constructor + enrichment
- `lsp4TokenType.handler.ts` - block fields on entity constructor + enrichment
- `lsp4Creators.handler.ts` - block fields on LSP4CreatorsLength + LSP4Creator + enrichments
- `lsp5ReceivedAssets.handler.ts` - block fields on new entities, preserved on merge/spread
- `lsp6Controllers.handler.ts` - block fields threaded through getOrCreateController helper to LSP6Controller, LSP6Permission, LSP6AllowedCall, LSP6AllowedERC725YDataKey
- `lsp8TokenIdFormat.handler.ts` - block fields on entity constructor + enrichment
- `lsp8ReferenceContract.handler.ts` - block fields on entity constructor + enrichment
- `lsp8MetadataBaseURI.handler.ts` - block fields on entity constructor + enrichment
- `lsp12IssuedAssets.handler.ts` - block fields on new entities, preserved on merge/spread
- `lsp29EncryptedAsset.handler.ts` - block fields on entity constructor + enrichment
- `lsp3Profile.handler.ts` - block fields on entity constructor + enrichment
- `lsp4Metadata.handler.ts` - block fields on entity constructor + enrichment
- `lsp4MetadataBaseUri.handler.ts` - block fields from Transfer/TokenIdDataChanged events
- `nft.handler.ts` - block fields from Transfer events on NFT entity + enrichments
- `totalSupply.handler.ts` - block fields from latest Transfer event
- `follower.handler.ts` - block fields from Follow/Unfollow events
- `ownedAssets.handler.ts` - transactionIndex + logIndex added (blockNumber already present)
- `decimals.handler.ts` - block fields from verified DA entity via cast
- `universalProfileOwner.handler.ts` - block fields from verified UP entity via cast
- `digitalAssetOwner.handler.ts` - block fields from verified DA entity via cast

### Task 2 (7 handlers)
- `chillClaimed.handler.ts` - block fields from Transfer event on entity + enrichments
- `orbsClaimed.handler.ts` - block fields from Transfer event on entity + enrichments
- `orbLevel.handler.ts` - block fields from Transfer (mint) and TokenIdDataChanged (data key) paths
- `orbFaction.handler.ts` - block fields from Transfer (mint) and TokenIdDataChanged (data key) paths
- `lsp3ProfileFetch.handler.ts` - parent entity block fields propagated to 7 sub-entity types
- `lsp4MetadataFetch.handler.ts` - parent entity block fields propagated to 10 sub-entity types
- `lsp29EncryptedAssetFetch.handler.ts` - parent entity block fields propagated to 7 sub-entity types

## Decisions Made
- Merge/spread patterns (lsp5ReceivedAssets, lsp4Creators, lsp12IssuedAssets) preserve existing entity block fields — block position comes from first creation event, not overwritten on merge
- Post-verification handlers cast verified entities to access block fields since TypeScript doesn't know the runtime shape
- lsp4MetadataBaseUri treated differently from lsp8MetadataBaseURI despite similar names (different trigger sources)
- lsp6Controllers shared helper received event parameter to avoid duplicating block field extraction

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 19 (Block Ordering) is COMPLETE — all 3 plans executed
- All entities carry real block position data from their originating events
- Ready for next milestone phase

---
*Phase: 19-block-ordering*
*Completed: 2026-03-09*
