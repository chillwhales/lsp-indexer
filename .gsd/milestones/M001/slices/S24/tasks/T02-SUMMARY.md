---
id: T02
parent: S24
milestone: M001
provides:
  - "EntityRegistry: 71-key type map (compile-time) + ENTITY_CONSTRUCTORS (runtime)"
  - "addEntity<K>: compile-time bag key validation + runtime instanceof check"
  - "getEntities<K>: returns typed Map<string, EntityRegistry[K]> — zero casts at call sites"
  - "resolveEntity/resolveEntities: constructor from registry, no entityClass parameter"
  - "getEntitiesUntyped/hasEntitiesUntyped: for pipeline/fkResolution dynamic iteration"
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 
verification_result: passed
completed_at: 
blocker_discovered: false
---
# T02: 19.1-type-system-tightening 02

**# Phase 19.1 Plan 02: Entity Registry + Typed BatchContext Summary**

## What Happened

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
