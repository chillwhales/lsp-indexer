# T01: 03-metadata-fetch-handlers 01

**Slice:** S03 — **Milestone:** M001

## Description

Build the foundation layer for all three metadata fetch handlers: extend FetchResult to preserve error details, port V1 type guards, and create the shared fetch utility.

Purpose: All three fetch handlers (LSP3, LSP4, LSP29) share identical patterns for DB backlog queries, worker pool interaction, error tracking, and sub-entity clearing. This plan extracts that shared logic into a reusable utility, preventing 3x code duplication. It also fixes the FetchResult type gap that would silently break cross-batch retry prioritization.

Output: (1) Extended FetchResult type with errorCode/errorStatus, (2) MetadataWorkerPool passing error fields through, (3) Three V1 type guards in V2 utils, (4) Shared `handleMetadataFetch()` utility that handlers will call in Plans 02 and 03.

## Must-Haves

- [ ] 'FetchResult includes errorCode and errorStatus fields for cross-batch retry'
- [ ] 'MetadataWorkerPool.fetchBatch() preserves errorCode and errorStatus on failures'
- [ ] 'isVerification, isFileImage, isFileAsset type guards match V1 behavior exactly'
- [ ] 'Shared fetch utility handles empty-value path, head-only gating, and error tracking'
- [ ] 'queryUnfetchedEntities uses 3-tier priority matching V1 exactly'

## Files

- `packages/indexer-v2/src/core/types/metadata.ts`
- `packages/indexer-v2/src/core/metadataWorkerPool.ts`
- `packages/indexer-v2/src/utils/index.ts`
- `packages/indexer-v2/src/utils/metadataFetch.ts`
