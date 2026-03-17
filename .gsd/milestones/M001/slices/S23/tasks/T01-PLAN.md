# T01: 19-block-ordering 01

**Slice:** S23 — **Milestone:** M001

## Description

Add block ordering fields to the schema and type system foundation.

Purpose: Every indexed entity needs `blockNumber`, `transactionIndex`, and `logIndex` columns for deterministic blockchain ordering. This plan updates the GraphQL schema, the EnrichmentRequest interface, runs codegen, and verifies the full build compiles.

Output: Updated schema.graphql with ~59 entity types carrying block ordering fields, updated EnrichmentRequest type, regenerated TypeORM entities, clean build.

## Must-Haves

- [ ] "Every @entity type in schema.graphql has blockNumber, transactionIndex, and logIndex fields"
- [ ] "OwnedAsset and OwnedToken 'block' field renamed to 'blockNumber' for consistency"
- [ ] "EnrichmentRequest interface carries blockNumber, transactionIndex, logIndex"
- [ ] "TypeORM codegen produces entity classes with the new columns"
- [ ] "indexer package builds cleanly after codegen"

## Files

- `packages/typeorm/schema.graphql`
- `packages/typeorm/src/model/generated/*.ts  # codegen output`
- `packages/indexer/src/core/types/verification.ts`
- `packages/indexer/src/handlers/ownedAssets.handler.ts  # block → blockNumber rename`
- `packages/indexer/src/plugins/events/*.plugin.ts  # placeholder 0 values for build`
- `packages/indexer/src/handlers/*.handler.ts  # placeholder 0 values for build`
