# T02: 03-metadata-fetch-handlers 02

**Slice:** S03 — **Milestone:** M001

## Description

Implement LSP3 and LSP29 metadata fetch handlers that subscribe to the main entity bags, fetch JSON metadata via the worker pool, and parse sub-entities.

Purpose: META-01 requires LSP3 profile metadata fetched and 7 sub-entity types created. META-03 requires LSP29 encrypted asset metadata fetched and 7 sub-entity types created. These two handlers are structurally similar (single trigger, straightforward JSON schema) and can be implemented together.

Output: Two new handler files — `lsp3ProfileFetch.handler.ts` and `lsp29EncryptedAssetFetch.handler.ts` — each using `handleMetadataFetch()` from Plan 01 with handler-specific parsing functions ported from V1.

## Must-Haves

- [ ] 'LSP3 fetch handler creates all 7 sub-entity types matching V1 structure'
- [ ] 'LSP29 fetch handler creates all 7 sub-entity types matching V1 structure'
- [ ] 'LSP29 access control conditions FK chain is respected (clear conditions before encryption)'
- [ ] 'Both handlers use handleMetadataFetch from shared utility'
- [ ] 'Both handlers declare dependsOn their respective base handlers'
- [ ] 'Empty value path (url === null) clears sub-entities in every batch'
- [ ] 'Head-only gating prevents IPFS/HTTP fetches during historical sync'

## Files

- `packages/indexer-v2/src/handlers/lsp3ProfileFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp29EncryptedAssetFetch.handler.ts`
