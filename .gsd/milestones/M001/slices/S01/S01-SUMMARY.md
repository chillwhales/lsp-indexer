---
id: S01
parent: M001
milestone: M001
provides:
  - Async handler support (void | Promise<void>)
  - Delete queue for DB-level entity removal (Step 4a)
  - Post-verification handler hook (Step 5.5)
  - Topological handler ordering by dependsOn
  - postVerification flag for handlers needing verified entities
  - totalSupply EntityHandler with dual-trigger accumulation and underflow clamping
  - ownedAssets EntityHandler with dual-trigger accumulation, OwnedToken tracking, FK-ordered deletion
  - formatTokenId utility function for LSP8 token ID formatting
  - Colon-separated ID format for OwnedAsset and OwnedToken entities
  - Decimals handler (postVerification, Multicall3 batch reads)
  - FormattedTokenId handler (dependsOn ordering, retroactive DB update)
  - Clean core/ module with no legacy populate/persist/handlerHelpers code
  - Barrel export (core/index.ts) reduced to 7 re-exports
  - Zero dangling references to legacy patterns
requires: []
affects: []
key_files: []
key_decisions:
  - 'queueDelete() separate from removeEntity() to distinguish DB-level vs in-memory bag removal'
  - 'postVerification as opt-in boolean flag — existing handlers unaffected'
  - 'topologicalSort called on both discoverHandlers() and registerEntityHandler()'
  - 'OwnedAsset FK on OwnedToken set directly (not via enrichment queue) since OwnedAsset is handler-created, not a verified core entity'
  - 'Dual-trigger handlers read from ALL bags each invocation to ensure consistency regardless of trigger order'
  - 'tokenId null sentinel used to mark OwnedTokens for deletion (matching V1 pattern)'
  - 'Decimals uses postVerification: true to run after DA verification in Step 5.5'
  - 'FormattedTokenId mutates NFT entities in-place in BatchContext for Path 1'
  - 'FormattedTokenId adds reformatted existing NFTs to BatchContext for Path 2 persistence'
  - "JSDoc 'Port from v1' references annotated with deletion note rather than removed entirely — preserves provenance trail"
patterns_established:
  - 'Opt-in handler capabilities via optional properties (postVerification, dependsOn)'
  - 'Pipeline step numbering: 4a (deletes) before 4b (upserts), 5.5 (post-verify handlers)'
  - 'Dual-trigger accumulation: handler aggregates from multiple bags per invocation'
  - 'Direct FK for handler-created entities vs enrichment queue for verified entities'
  - 'postVerification: true handler that reads getVerified().newEntities'
  - "dependsOn: ['handlerName'] for explicit handler execution ordering"
  - 'Retroactive update: query DB for existing entities when a data key changes'
  - 'All handler logic lives in standalone handler files — no shared helper modules for handler business logic'
observability_surfaces: []
drill_down_paths: []
duration: 2min
verification_result: passed
completed_at: 2026-02-06
blocker_discovered: false
---
# S01: Handler Migration

**# Phase 1 Plan 01: Infrastructure Summary**

## What Happened

# Phase 1 Plan 01: Infrastructure Summary

**Async handler support, delete queue (Step 4a), post-verification hook (Step 5.5), and topological handler ordering via Kahn's algorithm**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-06T10:07:34Z
- **Completed:** 2026-02-06T10:12:55Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- EntityHandler.handle() now supports async implementations (void | Promise<void>)
- Pipeline awaits all handler.handle() calls in both Step 3 and Step 5.5
- Delete queue enables DB-level entity removal in Step 4a before upserts
- Post-verification hook (Step 5.5) allows handlers to run after core entities are verified/persisted
- Registry topologically sorts handlers by dependsOn using Kahn's algorithm with cycle detection
- All 15+ existing handlers compile without changes (new features are opt-in via optional properties)

## Task Commits

Each task was committed atomically:

1. **Task 1: Async handler interface + delete queue + postVerification + dependsOn** - `cdb3bfd` (feat)
2. **Task 2: Pipeline changes — await handlers, Step 4a deletes, Step 5.5 hook** - `4f84934` (feat)
3. **Task 3: Registry topological sort for handler dependencies** - `06614bd` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/core/types/handler.ts` - Extended EntityHandler with async handle(), postVerification, dependsOn
- `packages/indexer-v2/src/core/types/batchContext.ts` - Added DeleteRequest/StoredDeleteRequest types, queueDelete/getDeleteQueue to IBatchContext
- `packages/indexer-v2/src/core/batchContext.ts` - Implemented delete queue storage and methods
- `packages/indexer-v2/src/core/pipeline.ts` - Added Step 4a deletes, Step 5.5 post-verification hook, await handler.handle()
- `packages/indexer-v2/src/core/registry.ts` - Added topologicalSort() with Kahn's algorithm, called after discovery and manual registration

## Decisions Made

- Used `queueDelete()` instead of overloading `removeEntity()` to keep in-memory bag removal and DB-level deletion distinct
- `postVerification` is a simple boolean opt-in flag rather than a separate interface — keeps all handlers as one type
- Topological sort runs on every `registerEntityHandler()` call (not just discovery) to support test scenarios

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All infrastructure changes are in place for Phase 1 handler implementations
- Ready for 01-02-PLAN.md (totalSupply + ownedAssets handlers)
- Handlers can now use postVerification, dependsOn, and queueDelete() in their implementations

## Self-Check: PASSED

---

_Phase: 01-handler-migration_
_Completed: 2026-02-06_

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

# Phase 1 Plan 3: Decimals & FormattedTokenId Handlers Summary

**Decimals handler rewritten with postVerification Step 5.5 hook + FormattedTokenId handler with dependsOn ordering and retroactive DB update for LSP8 format changes**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-06T10:16:24Z
- **Completed:** 2026-02-06T10:19:46Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Rewrote decimals handler to V2 EntityHandler with `postVerification: true` — runs after DA verification using Multicall3 with batch size 100
- Created formattedTokenId handler with `dependsOn: ['lsp8TokenIdFormat']` and two-path logic: new NFTs get formatted in place, format changes trigger retroactive DB query and reformat of all existing NFTs
- Both handlers follow V2 conventions: entities in BatchContext, enrichment queued for FK resolution, no direct store writes

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite decimals handler for V2 interface** - `716ec55` (feat)
2. **Task 2: Create formattedTokenId handler with retroactive update** - `5e81814` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/decimals.handler.ts` - V2 EntityHandler with postVerification, Multicall3 decimals() reads
- `packages/indexer-v2/src/handlers/formattedTokenId.handler.ts` - New handler with dependsOn, two-path formatting, retroactive update
- `packages/indexer-v2/src/utils/index.ts` - Fixed missing viem imports for formatTokenId (bytesToHex, hexToBytes, hexToString, sliceHex, Hex)

## Decisions Made

- Decimals handler uses `postVerification: true` to access newly verified DigitalAsset entities — same approach as planned
- FormattedTokenId Path 1 mutates NFT entities in-place in BatchContext (they're already there from the NFT handler), Path 2 adds reformatted DB NFTs to BatchContext for pipeline persistence
- Unknown format returns null (not raw tokenId like V1) + warning log per user constraint

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed missing viem imports in utils/index.ts for formatTokenId**

- **Found during:** Task 1 (build verification)
- **Issue:** Plan 01-02 (running in parallel) added `formatTokenId()` to utils/index.ts but the viem imports (`bytesToHex`, `Hex`, `hexToBytes`, `hexToString`, `sliceHex`) were missing, causing build failure
- **Fix:** Added the missing imports to the existing viem import line
- **Files modified:** packages/indexer-v2/src/utils/index.ts
- **Verification:** Build passes with zero errors
- **Committed in:** 716ec55 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary fix for parallel plan convergence. Plan 01-02 will also modify this file — both plans converge on the same correct state.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both handlers compile and follow V2 conventions
- Ready for Plan 01-04 (legacy code cleanup + deletion)
- No blockers

---

## Self-Check: PASSED

---

_Phase: 01-handler-migration_
_Completed: 2026-02-06_

# Phase 1 Plan 4: Legacy Code Cleanup Summary

**Deleted handlerHelpers.ts, populateHelpers.ts, and persistHelpers.ts — 593 lines of legacy code removed, zero dangling references**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-06T10:24:09Z
- **Completed:** 2026-02-06T10:26:32Z
- **Tasks:** 1
- **Files modified:** 6 (3 deleted, 1 edited, 2 JSDoc updated)

## Accomplishments

- Deleted handlerHelpers.ts (updateTotalSupply, updateOwnedAssets — 335 lines, replaced by standalone handlers in Plans 02-03)
- Deleted populateHelpers.ts (populateByUP, populateByDA, enrichEntityFk, populateByUPAndDA, populateNFTs — 125 lines, replaced by enrichment queue)
- Deleted persistHelpers.ts (insertEntities, upsertEntities, insertNewEntities, mergeUpsertEntities — 131 lines, replaced by pipeline Steps 2/4)
- Updated core/index.ts barrel export from 10 to 7 re-exports
- Verified zero dangling imports or function references across entire codebase
- Build passes clean with zero type errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify zero imports, delete legacy files, update barrel export** - `d0499fa` (refactor)

## Files Created/Modified

- `packages/indexer-v2/src/core/handlerHelpers.ts` - DELETED (updateTotalSupply, updateOwnedAssets)
- `packages/indexer-v2/src/core/populateHelpers.ts` - DELETED (populateByUP, populateByDA, enrichEntityFk, populateByUPAndDA, populateNFTs)
- `packages/indexer-v2/src/core/persistHelpers.ts` - DELETED (insertEntities, upsertEntities, insertNewEntities, mergeUpsertEntities)
- `packages/indexer-v2/src/core/index.ts` - Barrel export updated, removed 3 re-export lines
- `packages/indexer-v2/src/handlers/totalSupply.handler.ts` - JSDoc updated to note source file deletion
- `packages/indexer-v2/src/handlers/ownedAssets.handler.ts` - JSDoc updated to note source file deletion

## Decisions Made

- JSDoc "Port from v1" comments annotated with "(deleted in 01-04)" rather than removed entirely — preserves the provenance trail for future developers tracing code origins

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated stale JSDoc references in handler files**

- **Found during:** Task 1 (final verification grep)
- **Issue:** totalSupply.handler.ts and ownedAssets.handler.ts had "Port from v1" JSDoc references to core/handlerHelpers.ts which no longer exists
- **Fix:** Annotated references with "(deleted in 01-04)" to preserve provenance while marking them as historical
- **Files modified:** packages/indexer-v2/src/handlers/totalSupply.handler.ts, packages/indexer-v2/src/handlers/ownedAssets.handler.ts
- **Verification:** grep confirms no live references remain
- **Committed in:** d0499fa (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug — stale documentation references)
**Impact on plan:** Minimal — updated 2 JSDoc comments. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Phase 1 complete:** All 4 plans executed successfully
  - Plan 01: Core infrastructure (EntityHandler interface, dependsOn, postVerification, queueDelete, topological sort)
  - Plan 02: Transfer-derived handlers (totalSupply, ownedAssets)
  - Plan 03: Data-key-derived handlers (decimals, formattedTokenId)
  - Plan 04: Legacy code cleanup (this plan)
- **Ready for Phase 2:** New Handlers & Structured Logging
- **No blockers or concerns**

---

## Self-Check: PASSED

_Phase: 01-handler-migration_
_Completed: 2026-02-06_
