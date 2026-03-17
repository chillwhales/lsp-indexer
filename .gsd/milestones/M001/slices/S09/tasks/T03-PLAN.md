# T03: 05.3-entity-upsert-pattern-standardization 03

**Slice:** S09 — **Milestone:** M001

## Description

Standardize totalSupply, ownedAssets, and nft handlers to use the resolveEntities helper instead of manual store.findBy + batch check patterns.

Purpose: These are core handlers that work correctly but use ad-hoc entity lookup patterns. Standardizing them to resolveEntities makes the codebase consistent and eliminates manual batch + DB merge code.

Output: 3 handler files updated, existing test mocks updated to match new import.

## Must-Haves

- [ ] 'totalSupply uses resolveEntities instead of manual store.findBy + batch check'
- [ ] 'ownedAssets uses resolveEntities instead of manual store.findBy + batch check'
- [ ] 'nft uses resolveEntities instead of mergeEntitiesFromBatchAndDb (drop-in rename)'
- [ ] 'All three handlers maintain identical runtime behavior after refactor'

## Files

- `packages/indexer-v2/src/handlers/totalSupply.handler.ts`
- `packages/indexer-v2/src/handlers/ownedAssets.handler.ts`
- `packages/indexer-v2/src/handlers/nft.handler.ts`
- `packages/indexer-v2/src/handlers/__tests__/totalSupply.handler.test.ts`
- `packages/indexer-v2/src/handlers/__tests__/ownedAssets.handler.test.ts`
