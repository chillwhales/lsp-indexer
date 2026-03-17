# S01: Handler Migration

**Goal:** Add infrastructure changes that all Phase 1 handlers depend on: async handler support, a delete queue for DB-level entity removal, a post-verification handler hook (Step 5.
**Demo:** Add infrastructure changes that all Phase 1 handlers depend on: async handler support, a delete queue for DB-level entity removal, a post-verification handler hook (Step 5.

## Must-Haves


## Tasks

- [x] **T01: 01-handler-migration 01** `est:5min`
  - Add infrastructure changes that all Phase 1 handlers depend on: async handler support, a delete queue for DB-level entity removal, a post-verification handler hook (Step 5.5), and topological handler ordering in the registry. These are prerequisite capabilities — no handlers are created in this plan.
- [x] **T02: 01-handler-migration 02** `est:5min`
  - Create totalSupply and ownedAssets as standalone V2 EntityHandlers (HMIG-01, HMIG-02). Port the logic from the dead code in `core/handlerHelpers.ts` into self-contained handler files that use the V2 BatchContext + enrichment queue pattern. Update ID generation functions to use the cleaned-up colon-separated format.
- [x] **T03: 01-handler-migration 03** `est:3min`
  - Rewrite the decimals handler to use the V2 EntityHandler interface with `postVerification: true` (HMIG-03), and create a new FormattedTokenId handler that populates `NFT.formattedTokenId` based on LSP8TokenIdFormat with retroactive update behavior and explicit handler dependency ordering (HMIG-04).
- [x] **T04: 01-handler-migration 04** `est:2min`
  - Delete all legacy code that has been superseded by the V2 EntityHandler pattern and enrichment queue pipeline (HMIG-05). This includes handlerHelpers.ts (dead code replaced by standalone handlers in Plans 02-03), populateHelpers.ts (populate pattern replaced by enrichment queue), and persistHelpers.ts (persist pattern replaced by pipeline Steps 2/4). Update the barrel export and verify zero dangling references.

## Files Likely Touched

- `packages/indexer-v2/src/core/types/handler.ts`
- `packages/indexer-v2/src/core/types/batchContext.ts`
- `packages/indexer-v2/src/core/batchContext.ts`
- `packages/indexer-v2/src/core/pipeline.ts`
- `packages/indexer-v2/src/core/registry.ts`
- `packages/indexer-v2/src/handlers/totalSupply.handler.ts`
- `packages/indexer-v2/src/handlers/ownedAssets.handler.ts`
- `packages/indexer-v2/src/utils/index.ts`
- `packages/indexer-v2/src/handlers/decimals.handler.ts`
- `packages/indexer-v2/src/handlers/formattedTokenId.handler.ts`
- `packages/indexer-v2/src/core/handlerHelpers.ts`
- `packages/indexer-v2/src/core/populateHelpers.ts`
- `packages/indexer-v2/src/core/persistHelpers.ts`
- `packages/indexer-v2/src/core/index.ts`
