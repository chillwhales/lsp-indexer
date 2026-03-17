---
id: S08
parent: M001
milestone: M001
provides:
  - OwnedAsset handler correctly filters by triggeredBy parameter
  - LSP8ReferenceContract marked as known V1 divergence
  - Unit tests proving no double-processing occurs
  - Orb NFT mint-time default entities (OrbLevel=0, OrbCooldownExpiry=0, OrbFaction='Neutral')
  - Dual-trigger support in orbLevel and orbFaction handlers (LSP8Transfer + TokenIdDataChanged)
  - LSP4Metadata base URI derivation handler creating ~84K missing entities
  - Dual trigger paths (mint detection + base URI change)
  - Per-token metadata URL derivation from LSP8TokenMetadataBaseURI + NFT tokenIds
requires: []
affects: []
key_files: []
key_decisions:
  - 'Mint detection via LSP8Transfer from zero address matches V1 behavior exactly'
  - 'Default entity overwrites via addEntity() when TokenIdDataChanged arrives (Map.set() semantics)'
  - 'Both mint and TokenIdDataChanged branches queue same enrichment for digitalAsset/nft FKs'
  - 'Entity ID format: "BaseURI - {address} - {tokenId}" matching V1 exactly'
  - 'URL derivation: baseUri.endsWith("/") ? baseUri + tokenId : baseUri + "/" + tokenId'
  - 'formattedTokenId fallback: use raw tokenId when formattedTokenId is null'
  - 'Base URI change path queries ALL NFTs from DB + batch for comprehensive derivation'
  - 'Mint path checks DB + batch for base URI (batch takes priority)'
  - 'Deduplication via Map prevents duplicate entities in same batch'
patterns_established:
  - 'Dual-trigger handler pattern: branch on triggeredBy parameter to handle mint vs data changes'
  - 'Mint detection: filter LSP8Transfer to ORBS_ADDRESS + from=zeroAddress'
  - 'Base URI → per-token URL derivation (V1 utils/lsp4MetadataBaseUri.ts pattern)'
  - 'DB merge pattern: query DB entities, overlay batch entities (batch priority)'
observability_surfaces: []
drill_down_paths: []
duration: 38min
verification_result: passed
completed_at: 2026-02-13
blocker_discovered: false
---
# S08: Lsp4 Base Uri Count Parity

**# Phase 05.2 Plan 01: OwnedAsset triggeredBy Fix + LSP8ReferenceContract Divergence Summary**

## What Happened

# Phase 05.2 Plan 01: OwnedAsset triggeredBy Fix + LSP8ReferenceContract Divergence Summary

**One-liner:** Fixed OwnedAsset double-processing bug (GAP-08) via triggeredBy filtering and marked LSP8ReferenceContract count mismatch (GAP-07) as known V1 divergence

## What Was Built

### GAP-08: OwnedAsset Double-Processing Bug Fix

**Root Cause:** The ownedAssets.handler.ts had `_triggeredBy` parameter (unused prefix) and always read BOTH `LSP7Transfer` and `LSP8Transfer` bags regardless of which trigger invoked it. Since the handler listens to both bags, it gets called twice per batch — once for `LSP7Transfer`, once for `LSP8Transfer`. Reading both bags each time = 2x processing of all transfers.

**Impact:** Doubled balances prevented legitimate zero-balance deletions, inflating OwnedAsset count by ~14K entities.

**Fix:**

- Changed `_triggeredBy` to `triggeredBy` (removed unused prefix)
- Replaced dual-bag read (lines 45-48) with conditional filtering:
  - `triggeredBy === 'LSP7Transfer'` → only process LSP7Transfer bag
  - `triggeredBy === 'LSP8Transfer'` → only process LSP8Transfer bag
- Follows the same pattern used by nft.handler.ts which correctly branches on `triggeredBy`

**Code Change:**

```typescript
// BEFORE (lines 43-48):
async handle(hctx: HandlerContext, _triggeredBy: string): Promise<void> {
  const lsp7 = hctx.batchCtx.getEntities<Transfer>('LSP7Transfer');
  const lsp8 = hctx.batchCtx.getEntities<Transfer>('LSP8Transfer');
  const allTransfers: Transfer[] = [...lsp7.values(), ...lsp8.values()];

// AFTER:
async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
  const allTransfers: Transfer[] =
    triggeredBy === 'LSP7Transfer'
      ? [...hctx.batchCtx.getEntities<Transfer>('LSP7Transfer').values()]
      : triggeredBy === 'LSP8Transfer'
        ? [...hctx.batchCtx.getEntities<Transfer>('LSP8Transfer').values()]
        : [];
```

### GAP-07: LSP8ReferenceContract Known V1 Divergence

**Root Cause:** V1 has a switch statement fall-through bug where unrelated `DataChanged` events (LSP4Creators[].length, LSP5ReceivedAssets[].length, AddressPermissions[].length) fall through to the LSP8ReferenceContract case, creating phantom entities.

**V2 Behavior:** Correctly scoped — only creates LSP8ReferenceContract entities when LSP8ReferenceContract data key is actually changed.

**Action:** Added entry to `V1_V2_DIVERGENCES` array in entityRegistry.ts to document this as a V1 bug, not a V2 gap.

**Added Entry:**

```typescript
{
  entityType: 'LSP8ReferenceContract',
  field: 'count',
  reason: 'V1 switch fall-through bug creates phantom entities from unrelated DataChanged events (LSP4Creators[].length, LSP5ReceivedAssets[].length, AddressPermissions[].length fall through to LSP8ReferenceContract case)',
}
```

### Unit Tests

Added comprehensive test suite for triggeredBy filtering behavior:

1. **Test: "processes only LSP7Transfer when triggered by LSP7Transfer"**

   - Seeds batch with BOTH LSP7 and LSP8 transfers
   - Calls handler with `triggeredBy: 'LSP7Transfer'`
   - Asserts only LSP7 transfers were processed
   - Asserts LSP8 transfers were NOT processed

2. **Test: "processes only LSP8Transfer when triggered by LSP8Transfer"**

   - Seeds batch with BOTH LSP7 and LSP8 transfers
   - Calls handler with `triggeredBy: 'LSP8Transfer'`
   - Asserts only LSP8 transfers were processed
   - Asserts LSP7 transfers were NOT processed

3. **Test: "does not double-count when called for both triggers sequentially"**
   - LSP7 transfer: mint 100 tokens to address A
   - LSP8 transfer: mint 1 NFT to address B
   - Calls handler for LSP7Transfer, then LSP8Transfer
   - **Critical assertions:**
     - Address A has balance 100 (not 200 from double-processing)
     - Address B has balance 1 (not 2 from double-processing)

**Test Infrastructure Fix:** Wrapped `queueDelete` and `queueEnrichment` with `vi.fn()` in createMockBatchCtx to enable spy assertions (fixed 3 pre-existing test failures).

**Results:** All 13 tests pass (10 original + 3 new).

## Task Commits

| Task | Name                                                                        | Commit  | Files                                                                                                   |
| ---- | --------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| 1    | Fix OwnedAsset triggeredBy filtering + add LSP8ReferenceContract divergence | 222398e | packages/indexer-v2/src/handlers/ownedAssets.handler.ts, packages/comparison-tool/src/entityRegistry.ts |
| 2    | Add unit tests for triggeredBy filtering behavior                           | ea5eeaa | packages/indexer-v2/src/handlers/**tests**/ownedAssets.handler.test.ts                                  |

## Verification Results

✅ **All tests pass:** 13/13 tests passing in ownedAssets.handler.test.ts
✅ **No underscore prefix:** `grep -c '_triggeredBy'` returns 0
✅ **Divergence registered:** LSP8ReferenceContract entry exists in V1_V2_DIVERGENCES

## Decisions Made

1. **Use triggeredBy parameter to filter bags**

   - **Context:** Handler is invoked twice per batch (once per bag key: LSP7Transfer, LSP8Transfer)
   - **Decision:** Conditionally select only the triggered bag's transfers per invocation
   - **Rationale:** Dual-bag read caused 2x processing since handler runs twice per batch
   - **Impact:** Eliminates double-processing, reducing OwnedAsset count by ~14K

2. **Mark LSP8ReferenceContract as known V1 divergence**
   - **Context:** V1 has switch fall-through bug creating phantom entities
   - **Decision:** Document in comparison tool's V1_V2_DIVERGENCES array
   - **Rationale:** This is V1 incorrect behavior, not a V2 gap to fix
   - **Impact:** Comparison tool won't flag this as a V2 bug

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

**Blockers:** None

**Ready for:**

- ✅ 05.2-02 (Orb handler mint detection defaults)
- ✅ 05.2-03 (LSP4 base URI derivation handler)

**Notes:**

- OwnedAsset handler now correctly uses triggeredBy filtering
- LSP8ReferenceContract count mismatch documented as V1 bug
- Comparison tool will skip LSP8ReferenceContract in v1-v2 mode with this divergence

---

## Self-Check: PASSED

**Created files:** None (plan only modified existing files)
**Modified files verified:**

- ✅ packages/indexer-v2/src/handlers/ownedAssets.handler.ts (triggeredBy logic updated)
- ✅ packages/comparison-tool/src/entityRegistry.ts (LSP8ReferenceContract divergence added)
- ✅ packages/indexer-v2/src/handlers/**tests**/ownedAssets.handler.test.ts (3 new tests added)

**Commits verified:**

- ✅ 222398e exists in git log
- ✅ ea5eeaa exists in git log

# Phase 05.2 Plan 02: Orb Mint Detection Summary

**Orb handlers now create mint-time defaults (OrbLevel=0, OrbCooldownExpiry=0, OrbFaction='Neutral') matching V1 behavior**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-13T13:04:36Z
- **Completed:** 2026-02-13T13:08:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- orbLevel.handler.ts creates OrbLevel(value=0) and OrbCooldownExpiry(value=0) on Orb NFT mint
- orbFaction.handler.ts creates OrbFaction(value='Neutral') on Orb NFT mint
- Both handlers listen to LSP8Transfer and TokenIdDataChanged with triggeredBy branching
- Mint defaults are overwritten when TokenIdDataChanged events arrive (same Map.set() semantics as V1)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add LSP8Transfer mint detection to orbLevel handler** - `3eb0279` (feat)
2. **Task 2: Add LSP8Transfer mint detection to orbFaction handler** - `21fbfb2` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/chillwhales/orbLevel.handler.ts` - Added LSP8Transfer to listensToBag, mint detection branch creates OrbLevel(0) and OrbCooldownExpiry(0) defaults
- `packages/indexer-v2/src/handlers/chillwhales/orbFaction.handler.ts` - Added LSP8Transfer to listensToBag, mint detection branch creates OrbFaction('Neutral') default

## Decisions Made

1. **Mint detection via LSP8Transfer from zero address** - Matches V1's orbsLevelHandler.ts lines 35-84 exactly
2. **Default entity overwrites via addEntity()** - When TokenIdDataChanged arrives, addEntity() replaces the default entity in the batch bag (same Map.set() semantics as V1)
3. **Enrichment queued in both branches** - Both mint detection and TokenIdDataChanged queue enrichment for digitalAsset and nft FKs to ensure FKs resolve correctly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation followed nft.handler.ts dual-trigger pattern successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Orb mint detection complete, closing count gaps for OrbLevel, OrbCooldownExpiry, and OrbFaction entities
- Ready for 05.2-03 (LSP4 Base URI derivation handler)
- No blockers or concerns

## Self-Check: PASSED

---

_Phase: 05.2-lsp4-base-uri-count-parity_
_Completed: 2026-02-13_

# Phase 05.2 Plan 03: LSP4 Base URI Derivation Summary

**LSP4 metadata base URI handler creates ~84K missing LSP4Metadata entities by deriving per-token URLs from LSP8TokenMetadataBaseURI + NFT tokenIds**

## Performance

- **Duration:** 38 min
- **Started:** 2026-02-13T13:11:32Z
- **Completed:** 2026-02-13T13:49:50Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Created lsp4MetadataBaseUri.handler.ts with dual trigger paths (LSP8Transfer mints + LSP8TokenMetadataBaseURI changes)
- Path 1: On base URI change, derives URLs for ALL existing NFTs (queries DB + batch)
- Path 2: On mint, checks if parent collection has base URI and derives per-token URL
- Entity ID format matches V1: `BaseURI - {address} - {tokenId}`
- URL derivation handles trailing slash correctly (no double-slash)
- Uses formattedTokenId when available, falls back to raw tokenId
- Comprehensive unit tests cover both trigger paths, URL edge cases, and fallback behavior
- All 7 test cases pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lsp4MetadataBaseUri handler with dual trigger paths** - `bafdb34` (feat)
2. **Task 2: Unit tests for lsp4MetadataBaseUri handler** - `042930c` (test)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/lsp4MetadataBaseUri.handler.ts` - New handler implementing V1's utils/lsp4MetadataBaseUri.ts flow: dual trigger paths (mint + base URI change), URL derivation with formattedTokenId fallback, deduplication, enrichment queueing
- `packages/indexer-v2/src/handlers/__tests__/lsp4MetadataBaseUri.handler.test.ts` - 7 comprehensive test cases covering both trigger paths, URL derivation edge cases, formattedTokenId fallback, and enrichment queueing

## Decisions Made

1. **Entity ID format matches V1** - `BaseURI - {address} - {tokenId}` ensures LSP4Metadata entities created by this handler have distinct IDs from LSP4Metadata entities created by lsp4Metadata.handler.ts (which uses `{address}` or `{address} - {tokenId}` for direct data key metadata)
2. **URL derivation with trailing slash handling** - Matches V1 lines 103-106: `value.endsWith('/') ? value + formattedTokenId : value + '/' + formattedTokenId` prevents double-slash when base URI already ends with `/`
3. **formattedTokenId fallback to raw tokenId** - When formattedTokenId is null (unknown format), use raw tokenId for URL construction (matches V1 behavior where formattedTokenId always has a value, even if unknown format returns raw tokenId)
4. **Base URI change path queries ALL NFTs from DB + batch** - Ensures comprehensive derivation when base URI changes — every existing NFT gets a new LSP4Metadata entity (V1 extractFromBaseUri pattern)
5. **Mint path checks DB + batch for base URI** - Batch takes priority over DB when same address exists in both (most recent base URI wins)
6. **Deduplication via Map** - Prevents duplicate LSP4Metadata entities when same NFT appears in both mint and base URI change paths within the same batch
7. **Handler depends on formattedTokenId handler** - Declared in dependsOn to ensure formattedTokenId is populated before this handler runs, maximizing use of formatted IDs in URLs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation followed established dual-trigger handler pattern (nft.handler.ts, orbLevel.handler.ts) and DB merge pattern (mergeEntitiesFromBatchAndDb).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- LSP4 base URI derivation complete, closing GAP-06 (~84K missing LSP4Metadata entities)
- Phase 5.2 complete (all 3 plans executed)
- Created entities are automatically fetched by existing lsp4MetadataFetch.handler.ts
- Ready for production re-index to verify entity count parity with V1
- No blockers or concerns

## Self-Check: PASSED

All created files exist:

- ✓ packages/indexer-v2/src/handlers/lsp4MetadataBaseUri.handler.ts
- ✓ packages/indexer-v2/src/handlers/**tests**/lsp4MetadataBaseUri.handler.test.ts

All commits exist:

- ✓ bafdb34 (feat)
- ✓ 042930c (test)

---

_Phase: 05.2-lsp4-base-uri-count-parity_
_Completed: 2026-02-13_
