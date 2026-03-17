---
id: S24
parent: M001
milestone: M001
provides:
  - All handler files compile against non-generic getEntities() signature
  - Explicit as Map<string, ConcreteType> casts at every handler call site
  - Zero remaining getEntities<T> calls in handler/core/utility source files
  - "EntityRegistry: 71-key type map (compile-time) + ENTITY_CONSTRUCTORS (runtime)"
  - "addEntity<K>: compile-time bag key validation + runtime instanceof check"
  - "getEntities<K>: returns typed Map<string, EntityRegistry[K]> — zero casts at call sites"
  - "resolveEntity/resolveEntities: constructor from registry, no entityClass parameter"
  - "getEntitiesUntyped/hasEntitiesUntyped: for pipeline/fkResolution dynamic iteration"
requires: []
affects: []
key_files: []
key_decisions:
  - "Handlers cast at call site rather than re-introducing generic on interface — makes type-erasure boundary explicit"
  - "Test entities use variable extraction + as Entity cast to bypass excess property checking on object literals"
patterns_established:
  - "getEntities() cast pattern: always cast at handler level where concrete type is known"
  - "Test entity pattern: const e = { id, ...B, extra }; ctx.addEntity(type, id, e as Entity)"
observability_surfaces: []
drill_down_paths: []
duration: 10min
verification_result: passed
completed_at: 2026-03-10
blocker_discovered: false
---
# S24: Type System Tightening

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

# Phase 19.1 Plan 02: Entity Registry + Typed BatchContext Summary

Full entity registry mapping 71 BatchContext bag keys to TypeORM entity classes with compile-time type enforcement and runtime instanceof validation.

## One-liner

71-key entity registry with compile-time bag key validation and runtime instanceof checks on addEntity/getEntities, eliminating all handler casts.

## What Was Done

### Task 1: Created entityRegistry.ts (9c1eafc)
Created `packages/indexer/src/core/entityRegistry.ts` with:
- `EntityRegistry` interface: 71 entries mapping bag keys to concrete TypeORM types
- `ENTITY_CONSTRUCTORS` runtime map: same 71 entries, typed as mapped type for compiler-enforced sync
- `getEntityConstructor<K>()` helper for handlerHelpers DB queries
- `BagKey` type alias: `keyof EntityRegistry`

### Task 2: Updated IBatchContext and EntityHandler (36978ad)
- `addEntity<K>`, `getEntities<K>`, `removeEntity<K>`, `hasEntities` — typed with `keyof EntityRegistry`
- `getEntitiesUntyped`, `hasEntitiesUntyped` — for pipeline/fkResolution dynamic iteration
- `EntityHandler.listensToBag` → `(keyof EntityRegistry)[]`
- `EntityHandler.handle()` `triggeredBy` → `keyof EntityRegistry`

### Task 3: Updated BatchContext implementation (53d5625)
- `addEntity`: runtime `instanceof ENTITY_CONSTRUCTORS[type]` validation before storing
- `getEntities`: spot-check first entity via instanceof on non-empty maps
- `getEntitiesUntyped`/`hasEntitiesUntyped`: raw access without validation

### Task 4: Updated handlerHelpers.ts (7d322c9)
- `resolveEntity<K>`: 5-arg → 4-arg (dropped entityClass), uses `getEntityConstructor(entityType)` for DB queries
- `resolveEntities<K>`: same pattern, return type `Map<string, EntityRegistry[K]>`
- Zero casts remaining

### Task 5: Updated pipeline.ts, fkResolution.ts, metadataFetch.ts (d7d6519)
- pipeline.ts: 4x `getEntities` → `getEntitiesUntyped`, fixed drainTrigger edge case
- fkResolution.ts: 3x `getEntities` → `getEntitiesUntyped`
- metadataFetch.ts: `addToCtx()` helper for justified cast, `getEntitiesUntyped` on line 221

### Task 6: Event plugins (no changes needed)
All 11 plugins already compile clean — ENTITY_TYPE consts inferred as string literal types.

### Task 7: Updated all 25 handlers (bdb69eb)
- Replaced `getTypedEntities()` → `batchCtx.getEntities()` in all handlers
- Removed `entityClass` parameter from all `resolveEntity`/`resolveEntities` calls
- Zero `as Map<string,` casts remaining in handler files

### Task 8: Deleted entityTypeMap.ts (ec7c9ff)
- Deleted `packages/indexer/src/core/entityTypeMap.ts`
- Zero remaining references

### Task 9: Updated all test files (c2b7aaa)
- `batchContext.test.ts`: rewritten with real entity types (DataChanged, Transfer, Follow, Follower)
- `pipeline.test.ts`: replaced all synthetic bag keys and plain objects with real TypeORM entities
- `fkResolution.test.ts`: replaced `addEntity('UniversalProfile', ...)` with `setVerified()`
- `handlerHelpers.test.ts`: added DataChanged import for registry-based assertions
- 3 metadata fetch tests: added `getEntitiesUntyped` to mock BatchContext

### Task 10: Final verification
- Zero `as Map<string,` casts in handler files ✅
- Zero `as Map<string,` casts in handlerHelpers.ts ✅
- Zero getTypedEntities/entityTypeMap references (2 in comments documenting replacement) ✅
- One justified cast in metadataFetch.ts ✅
- Build clean ✅
- 260 tests pass ✅

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Added getEntitiesUntyped to metadata fetch test mocks**
- **Found during:** Task 9
- **Issue:** metadataFetch.ts (updated in Task 5) uses `getEntitiesUntyped()` but 3 handler test files had mock BatchContext without this method
- **Fix:** Added `getEntitiesUntyped` to mock BatchContext in lsp3ProfileFetch, lsp4MetadataFetch, and lsp29EncryptedAssetFetch test files
- **Files modified:** 3 test files
- **Commit:** c2b7aaa (included in Task 9 commit)

**2. [Rule 3 - Blocking] pipeline.test.ts required full rewrite**
- **Found during:** Task 9
- **Issue:** pipeline.test.ts used 9 synthetic bag keys and plain object entities; typed addEntity + runtime instanceof check reject both
- **Fix:** Converted all tests to use real TypeORM entity constructors and valid registry bag keys
- **Files modified:** pipeline.test.ts
- **Commit:** c2b7aaa

## Verification Results

```
Build: pnpm --filter=@chillwhales/indexer build → zero errors
Tests: pnpm --filter=@chillwhales/indexer test → 22 files, 260 tests passed
Cast audit: 0 in handlers, 0 in handlerHelpers, 1 justified in metadataFetch
```

## Self-Check: PASSED

All created/modified files exist. All 8 commits verified in git log.
