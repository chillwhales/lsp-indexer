---
id: T01
parent: S24
milestone: M001
provides:
  - All handler files compile against non-generic getEntities() signature
  - Explicit as Map<string, ConcreteType> casts at every handler call site
  - Zero remaining getEntities<T> calls in handler/core/utility source files
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 10min
verification_result: passed
completed_at: 2026-03-10
blocker_discovered: false
---
# T01: 19.1-type-system-tightening 01

**# Phase 19.1 Plan 01: getEntities Generic Removal Summary**

## What Happened

# Phase 19.1 Plan 01: getEntities Generic Removal Summary

**Replaced unchecked `getEntities<T>()` generic with explicit `as Map<string, ConcreteType>` casts across 28 consumer files, fixing all 331 TypeScript compilation errors**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-10T13:35:20Z
- **Completed:** 2026-03-10T13:46:09Z
- **Tasks:** 2
- **Files modified:** 28

## Accomplishments
- Removed all `getEntities<T>()` generics from fkResolution.ts (3 call sites), metadataFetch.ts (1 call site), and pipeline.test.ts (2 call sites)
- Fixed 21 pipeline test errors by extracting inline objects and adding `as Entity` / `as Map<string, T>` casts
- Applied mechanical `getEntities(key) as Map<string, T>` transformation to all 25 handler files (41 call sites total)
- Build passes with zero TypeScript errors; all 260 tests pass across 22 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix core/utility files and pipeline test** - `747980b` (fix)
2. **Task 2: Fix all handler files — mechanical generic removal** - `28834f2` (fix)

## Files Created/Modified
- `packages/indexer/src/core/fkResolution.ts` - Removed redundant `<Entity>` generic from 3 getEntities calls
- `packages/indexer/src/utils/metadataFetch.ts` - Replaced `getEntities<TEntity>` with explicit `as Map<string, TEntity>` cast
- `packages/indexer/src/core/__tests__/pipeline.test.ts` - Fixed 21 errors: variable extraction for addEntity, cast patterns for getEntities
- `packages/indexer/src/handlers/lsp4TokenName.handler.ts` - Example simple handler fix
- `packages/indexer/src/handlers/lsp4TokenSymbol.handler.ts` - Same pattern
- `packages/indexer/src/handlers/lsp4TokenType.handler.ts` - Same pattern
- `packages/indexer/src/handlers/lsp8TokenIdFormat.handler.ts` - Same pattern
- `packages/indexer/src/handlers/lsp8ReferenceContract.handler.ts` - Same pattern
- `packages/indexer/src/handlers/lsp8MetadataBaseURI.handler.ts` - Same pattern
- `packages/indexer/src/handlers/lsp3Profile.handler.ts` - Same pattern
- `packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts` - Same pattern
- `packages/indexer/src/handlers/lsp29EncryptedAsset.handler.ts` - Same pattern
- `packages/indexer/src/handlers/digitalAssetOwner.handler.ts` - Same pattern (uses `batchCtx` directly)
- `packages/indexer/src/handlers/universalProfileOwner.handler.ts` - Same pattern (uses `batchCtx` directly)
- `packages/indexer/src/handlers/lsp5ReceivedAssets.handler.ts` - Same pattern
- `packages/indexer/src/handlers/lsp4Creators.handler.ts` - Same pattern
- `packages/indexer/src/handlers/lsp4Metadata.handler.ts` - Multi-call handler (2 getEntities calls)
- `packages/indexer/src/handlers/lsp4MetadataBaseUri.handler.ts` - Multi-call handler (5 getEntities calls)
- `packages/indexer/src/handlers/totalSupply.handler.ts` - Multi-call handler (2 getEntities calls, ternary pattern)
- `packages/indexer/src/handlers/ownedAssets.handler.ts` - Multi-call handler (2 getEntities calls, spread pattern)
- `packages/indexer/src/handlers/nft.handler.ts` - Multi-call handler (3 getEntities calls)
- `packages/indexer/src/handlers/follower.handler.ts` - Multi-call handler (2 getEntities calls)
- `packages/indexer/src/handlers/formattedTokenId.handler.ts` - Multi-call handler (3 getEntities calls)
- `packages/indexer/src/handlers/lsp6Controllers.handler.ts` - Complex handler (3 getEntities calls including Entity & { controller } intersection)
- `packages/indexer/src/handlers/chillwhales/orbFaction.handler.ts` - Multi-call handler (2 getEntities calls)
- `packages/indexer/src/handlers/chillwhales/orbLevel.handler.ts` - Multi-call handler (2 getEntities calls)
- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts` - Single call handler (uses `batchCtx` directly)
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts` - Single call handler (uses `batchCtx` directly)

## Decisions Made
- Used `as Map<string, ConcreteType>` cast at each handler call site rather than reintroducing generic — makes the type-erasure boundary explicit and honest
- In pipeline.test.ts, extracted inline object literals to variables before passing to `addEntity()` — this bypasses TypeScript's excess property checking on object literals while maintaining runtime correctness

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 19.1 complete (single plan phase) — all type system tightening changes applied
- Ready for Phase 20 (Monitoring & Docker Image Release)

---
*Phase: 19.1-type-system-tightening*
*Completed: 2026-03-10*
