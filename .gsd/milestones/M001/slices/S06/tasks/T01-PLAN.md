# T01: 05-deployment-validation 01

**Slice:** S06 — **Milestone:** M001

## Description

Build the foundation layer for the V1 vs V2 comparison tool: type definitions, entity registry with all 72 Hasura entity types and known divergence exclusions, and a GraphQL client that can query both aggregate counts and paginated row samples from Hasura endpoints.

Purpose: This foundation enables Plan 02 to build the comparison engine and CLI without worrying about GraphQL query construction or entity type mapping.
Output: Three TypeScript modules in `packages/indexer-v2/src/comparison/` — types, entity registry, GraphQL client.

## Must-Haves

- [ ] 'Entity registry contains all 72 @entity types from schema.graphql'
- [ ] 'GraphQL client can query aggregate counts from a Hasura endpoint'
- [ ] 'GraphQL client can fetch paginated rows by primary key from a Hasura endpoint'
- [ ] 'Known divergences are defined with entity type, field, and reason'

## Files

- `packages/indexer-v2/src/comparison/types.ts`
- `packages/indexer-v2/src/comparison/entityRegistry.ts`
- `packages/indexer-v2/src/comparison/graphqlClient.ts`
