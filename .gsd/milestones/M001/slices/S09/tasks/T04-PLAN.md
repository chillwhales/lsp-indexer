# T04: 05.3-entity-upsert-pattern-standardization 04

**Slice:** S09 — **Milestone:** M001

## Description

Complete the standardization by refactoring the 3 Index+Map handlers that use mergeEntitiesFromBatchAndDb, and auditing the 2 address-query handlers (formattedTokenId, lsp4MetadataBaseUri) that cannot use resolveEntities. Eliminates the last references to the old function.

Purpose: Achieves codebase-wide consistency. After this plan, all 13 handlers are audited: 9 use resolveEntity/resolveEntities, 2 use spread with pre-loaded DB entities, 2 are documented address-based query exceptions. mergeEntitiesFromBatchAndDb has zero references.

Output: 3 handler files refactored, 2 handler files audited with comments, 1 test file updated, zero mergeEntitiesFromBatchAndDb references remaining.

## Must-Haves

- [ ] 'lsp4Creators uses resolveEntities instead of mergeEntitiesFromBatchAndDb'
- [ ] 'lsp12IssuedAssets uses resolveEntities instead of mergeEntitiesFromBatchAndDb'
- [ ] 'lsp6Controllers uses resolveEntities instead of mergeEntitiesFromBatchAndDb'
- [ ] 'formattedTokenId audited — uses address-based queries where resolveEntities is not applicable; no mergeEntitiesFromBatchAndDb to replace'
- [ ] 'lsp4MetadataBaseUri audited — uses address-based queries where resolveEntities is not applicable; no mergeEntitiesFromBatchAndDb to replace'
- [ ] 'Zero references to mergeEntitiesFromBatchAndDb in entire codebase'
- [ ] 'All 13 handlers audited: 9 use resolveEntity/resolveEntities, 2 use spread with pre-loaded DB entities, 2 are documented address-based query exceptions'

## Files

- `packages/indexer-v2/src/handlers/lsp4Creators.handler.ts`
- `packages/indexer-v2/src/handlers/lsp12IssuedAssets.handler.ts`
- `packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts`
- `packages/indexer-v2/src/handlers/formattedTokenId.handler.ts`
- `packages/indexer-v2/src/handlers/lsp4MetadataBaseUri.handler.ts`
- `packages/indexer-v2/src/handlers/__tests__/lsp6Controllers.handler.test.ts`
