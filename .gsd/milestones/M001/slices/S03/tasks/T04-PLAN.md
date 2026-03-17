# T04: 03-metadata-fetch-handlers 04

**Slice:** S03 — **Milestone:** M001

## Description

Write unit tests for all three metadata fetch handlers and verify the full build compiles.

Purpose: META-04 requires verification that metadata handlers only fetch at chain head. META-05 requires verification that fetch failures are retried with error tracking. Tests also verify META-01/02/03 sub-entity creation correctness. This plan also serves as the final integration check: build the entire package and run all tests.

Output: Three test files covering empty value path, head-only gating, sub-entity creation, error tracking, and Score/Rank extraction. Build verification passing.

## Must-Haves

- [ ] 'All three fetch handlers have unit tests covering empty value, head-only, success, and failure paths'
- [ ] 'Tests verify sub-entity creation matches V1 structure (correct types, FK references, field values)'
- [ ] 'Tests verify Score/Rank extraction from LSP4 attributes'
- [ ] 'Tests verify isHead gating: no workerPool.fetchBatch calls when isHead === false'
- [ ] 'Tests verify error tracking: failed fetches update entity error fields and increment retryCount'
- [ ] 'Build compiles and all tests pass'

## Files

- `packages/indexer-v2/src/handlers/__tests__/lsp3ProfileFetch.handler.test.ts`
- `packages/indexer-v2/src/handlers/__tests__/lsp4MetadataFetch.handler.test.ts`
- `packages/indexer-v2/src/handlers/__tests__/lsp29EncryptedAssetFetch.handler.test.ts`
