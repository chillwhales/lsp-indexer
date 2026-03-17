# T01: 05.3-entity-upsert-pattern-standardization 01

**Slice:** S09 — **Milestone:** M001

## Description

Create `resolveEntity<T>()` and `resolveEntities<T>()` helpers in handlerHelpers.ts, write comprehensive unit tests, and delete the old `mergeEntitiesFromBatchAndDb` function.

Purpose: Establishes the foundation helpers that all 13 handler refactors depend on. `resolveEntities` has identical semantics to `mergeEntitiesFromBatchAndDb` but a clearer name. `resolveEntity` is a new single-entity variant.

Output: Updated handlerHelpers.ts with two new exports, new test file, old function removed.

## Must-Haves

- [ ] 'resolveEntity returns batch entity when present, DB entity when not in batch, null when neither'
- [ ] 'resolveEntities returns merged map of batch + DB entities for requested IDs'
- [ ] 'resolveEntities is a drop-in replacement for mergeEntitiesFromBatchAndDb'
- [ ] 'mergeEntitiesFromBatchAndDb is deleted from handlerHelpers.ts'

## Files

- `packages/indexer-v2/src/core/handlerHelpers.ts`
- `packages/indexer-v2/src/core/__tests__/handlerHelpers.test.ts`
