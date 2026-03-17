---
id: T03
parent: S23
milestone: M001
provides:
  - "All ~29 EntityHandlers set real block fields on derived entity constructors"
  - "All enrichment requests from handlers use real block values (no placeholder 0s)"
  - "Metadata fetch handlers propagate parent entity block fields to all sub-entities"
  - "Chillwhales handlers wire block fields from Transfer/TokenIdDataChanged events"
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 17min
verification_result: passed
completed_at: 2026-03-09
blocker_discovered: false
---
# T03: 19-block-ordering 03

**# Phase 19 Plan 03: Wire Block Ordering Through EntityHandlers Summary**

## What Happened

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
