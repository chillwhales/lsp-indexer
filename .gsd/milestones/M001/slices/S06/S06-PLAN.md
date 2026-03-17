# S06: Deployment Validation

**Goal:** Build the foundation layer for the V1 vs V2 comparison tool: type definitions, entity registry with all 72 Hasura entity types and known divergence exclusions, and a GraphQL client that can query both aggregate counts and paginated row samples from Hasura endpoints.
**Demo:** Build the foundation layer for the V1 vs V2 comparison tool: type definitions, entity registry with all 72 Hasura entity types and known divergence exclusions, and a GraphQL client that can query both aggregate counts and paginated row samples from Hasura endpoints.

## Must-Haves


## Tasks

- [x] **T01: 05-deployment-validation 01** `est:2 min`
  - Build the foundation layer for the V1 vs V2 comparison tool: type definitions, entity registry with all 72 Hasura entity types and known divergence exclusions, and a GraphQL client that can query both aggregate counts and paginated row samples from Hasura endpoints.

Purpose: This foundation enables Plan 02 to build the comparison engine and CLI without worrying about GraphQL query construction or entity type mapping.
Output: Three TypeScript modules in `packages/indexer-v2/src/comparison/` — types, entity registry, GraphQL client.
- [ ] **T02: 05-deployment-validation 02**
  - Build the comparison engine, colored terminal reporter, and CLI entry point that ties everything together. The user will be able to run `pnpm --filter=@chillwhales/indexer-v2 compare --v1=URL --v2=URL` and get a full parity report with pass/fail verdict.

Purpose: This is the core deliverable of Phase 5 — the production cutover gate. It proves V2 produces identical data to V1.
Output: Comparison engine, reporter, CLI entry point, and a `compare` script in package.json.

## Files Likely Touched

- `packages/indexer-v2/src/comparison/types.ts`
- `packages/indexer-v2/src/comparison/entityRegistry.ts`
- `packages/indexer-v2/src/comparison/graphqlClient.ts`
- `packages/indexer-v2/src/comparison/comparisonEngine.ts`
- `packages/indexer-v2/src/comparison/reporter.ts`
- `packages/indexer-v2/src/comparison/cli.ts`
- `packages/indexer-v2/src/comparison/index.ts`
- `packages/indexer-v2/package.json`
