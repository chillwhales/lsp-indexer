# S03: Metadata Fetch Handlers

**Goal:** Build the foundation layer for all three metadata fetch handlers: extend FetchResult to preserve error details, port V1 type guards, and create the shared fetch utility.
**Demo:** Build the foundation layer for all three metadata fetch handlers: extend FetchResult to preserve error details, port V1 type guards, and create the shared fetch utility.

## Must-Haves


## Tasks

- [x] **T01: 03-metadata-fetch-handlers 01** `est:7min`
  - Build the foundation layer for all three metadata fetch handlers: extend FetchResult to preserve error details, port V1 type guards, and create the shared fetch utility.

Purpose: All three fetch handlers (LSP3, LSP4, LSP29) share identical patterns for DB backlog queries, worker pool interaction, error tracking, and sub-entity clearing. This plan extracts that shared logic into a reusable utility, preventing 3x code duplication. It also fixes the FetchResult type gap that would silently break cross-batch retry prioritization.

Output: (1) Extended FetchResult type with errorCode/errorStatus, (2) MetadataWorkerPool passing error fields through, (3) Three V1 type guards in V2 utils, (4) Shared `handleMetadataFetch()` utility that handlers will call in Plans 02 and 03.
- [x] **T02: 03-metadata-fetch-handlers 02** `est:4min`
  - Implement LSP3 and LSP29 metadata fetch handlers that subscribe to the main entity bags, fetch JSON metadata via the worker pool, and parse sub-entities.

Purpose: META-01 requires LSP3 profile metadata fetched and 7 sub-entity types created. META-03 requires LSP29 encrypted asset metadata fetched and 7 sub-entity types created. These two handlers are structurally similar (single trigger, straightforward JSON schema) and can be implemented together.

Output: Two new handler files — `lsp3ProfileFetch.handler.ts` and `lsp29EncryptedAssetFetch.handler.ts` — each using `handleMetadataFetch()` from Plan 01 with handler-specific parsing functions ported from V1.
- [x] **T03: 03-metadata-fetch-handlers 03** `est:2min`
  - Implement the LSP4 digital asset metadata fetch handler — the most complex of the three, with 8+2 sub-entity types, Score/Rank extraction, and attribute-level score/rarity fields.

Purpose: META-02 requires LSP4 digital asset metadata fetched and 8 sub-entity types plus Score/Rank created. LSP4 is the most complex standard due to Score/Rank extraction from attributes, the category field, and the richer image/icon/asset structure. This gets its own plan because it's ~250 lines of parsing logic.

Output: `lsp4MetadataFetch.handler.ts` — a fetch handler that uses the shared utility from Plan 01 and creates LSP4MetadataName, Description, Category, Link, Image, Icon, Asset, Attribute, Score, and Rank entities.
- [x] **T04: 03-metadata-fetch-handlers 04** `est:9min`
  - Write unit tests for all three metadata fetch handlers and verify the full build compiles.

Purpose: META-04 requires verification that metadata handlers only fetch at chain head. META-05 requires verification that fetch failures are retried with error tracking. Tests also verify META-01/02/03 sub-entity creation correctness. This plan also serves as the final integration check: build the entire package and run all tests.

Output: Three test files covering empty value path, head-only gating, sub-entity creation, error tracking, and Score/Rank extraction. Build verification passing.

## Files Likely Touched

- `packages/indexer-v2/src/core/types/metadata.ts`
- `packages/indexer-v2/src/core/metadataWorkerPool.ts`
- `packages/indexer-v2/src/utils/index.ts`
- `packages/indexer-v2/src/utils/metadataFetch.ts`
- `packages/indexer-v2/src/handlers/lsp3ProfileFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp29EncryptedAssetFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp4MetadataFetch.handler.ts`
- `packages/indexer-v2/src/handlers/__tests__/lsp3ProfileFetch.handler.test.ts`
- `packages/indexer-v2/src/handlers/__tests__/lsp4MetadataFetch.handler.test.ts`
- `packages/indexer-v2/src/handlers/__tests__/lsp29EncryptedAssetFetch.handler.test.ts`
