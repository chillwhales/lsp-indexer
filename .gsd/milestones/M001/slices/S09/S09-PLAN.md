# S09: Entity Upsert Pattern Standardization

**Goal:** Create `resolveEntity<T>()` and `resolveEntities<T>()` helpers in handlerHelpers.
**Demo:** Create `resolveEntity<T>()` and `resolveEntities<T>()` helpers in handlerHelpers.

## Must-Haves


## Tasks

- [x] **T01: 05.3-entity-upsert-pattern-standardization 01** `est:2min`
  - Create `resolveEntity<T>()` and `resolveEntities<T>()` helpers in handlerHelpers.ts, write comprehensive unit tests, and delete the old `mergeEntitiesFromBatchAndDb` function.

Purpose: Establishes the foundation helpers that all 13 handler refactors depend on. `resolveEntities` has identical semantics to `mergeEntitiesFromBatchAndDb` but a clearer name. `resolveEntity` is a new single-entity variant.

Output: Updated handlerHelpers.ts with two new exports, new test file, old function removed.
- [ ] **T02: 05.3-entity-upsert-pattern-standardization 02**
  - Fix 3 bugs and 2 cross-batch gaps in Tier 1 handlers by applying the resolve + spread pattern. These are the highest-priority handlers because they have confirmed data loss bugs.

Purpose: Fixes ChillClaimed/OrbsClaimed FK wipe in Phase 2, lsp5ReceivedAssets missing addEntity on cross-batch merge, and orbLevel/orbFaction batch-only lookups.

Output: 5 handler files updated with correct resolve + spread + addEntity pattern.
- [ ] **T03: 05.3-entity-upsert-pattern-standardization 03**
  - Standardize totalSupply, ownedAssets, and nft handlers to use the resolveEntities helper instead of manual store.findBy + batch check patterns.

Purpose: These are core handlers that work correctly but use ad-hoc entity lookup patterns. Standardizing them to resolveEntities makes the codebase consistent and eliminates manual batch + DB merge code.

Output: 3 handler files updated, existing test mocks updated to match new import.
- [ ] **T04: 05.3-entity-upsert-pattern-standardization 04**
  - Complete the standardization by refactoring the 3 Index+Map handlers that use mergeEntitiesFromBatchAndDb, and auditing the 2 address-query handlers (formattedTokenId, lsp4MetadataBaseUri) that cannot use resolveEntities. Eliminates the last references to the old function.

Purpose: Achieves codebase-wide consistency. After this plan, all 13 handlers are audited: 9 use resolveEntity/resolveEntities, 2 use spread with pre-loaded DB entities, 2 are documented address-based query exceptions. mergeEntitiesFromBatchAndDb has zero references.

Output: 3 handler files refactored, 2 handler files audited with comments, 1 test file updated, zero mergeEntitiesFromBatchAndDb references remaining.

## Files Likely Touched

- `packages/indexer-v2/src/core/handlerHelpers.ts`
- `packages/indexer-v2/src/core/__tests__/handlerHelpers.test.ts`
- `packages/indexer-v2/src/handlers/chillwhales/chillClaimed.handler.ts`
- `packages/indexer-v2/src/handlers/chillwhales/orbsClaimed.handler.ts`
- `packages/indexer-v2/src/handlers/lsp5ReceivedAssets.handler.ts`
- `packages/indexer-v2/src/handlers/chillwhales/orbLevel.handler.ts`
- `packages/indexer-v2/src/handlers/chillwhales/orbFaction.handler.ts`
- `packages/indexer-v2/src/handlers/totalSupply.handler.ts`
- `packages/indexer-v2/src/handlers/ownedAssets.handler.ts`
- `packages/indexer-v2/src/handlers/nft.handler.ts`
- `packages/indexer-v2/src/handlers/__tests__/totalSupply.handler.test.ts`
- `packages/indexer-v2/src/handlers/__tests__/ownedAssets.handler.test.ts`
- `packages/indexer-v2/src/handlers/lsp4Creators.handler.ts`
- `packages/indexer-v2/src/handlers/lsp12IssuedAssets.handler.ts`
- `packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts`
- `packages/indexer-v2/src/handlers/formattedTokenId.handler.ts`
- `packages/indexer-v2/src/handlers/lsp4MetadataBaseUri.handler.ts`
- `packages/indexer-v2/src/handlers/__tests__/lsp6Controllers.handler.test.ts`
