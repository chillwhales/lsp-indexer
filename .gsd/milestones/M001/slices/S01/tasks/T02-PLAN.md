# T02: 01-handler-migration 02

**Slice:** S01 — **Milestone:** M001

## Description

Create totalSupply and ownedAssets as standalone V2 EntityHandlers (HMIG-01, HMIG-02). Port the logic from the dead code in `core/handlerHelpers.ts` into self-contained handler files that use the V2 BatchContext + enrichment queue pattern. Update ID generation functions to use the cleaned-up colon-separated format.

## Must-Haves

- [ ] "totalSupply handler listens to ['LSP7Transfer', 'LSP8Transfer']"
- [ ] "ownedAssets handler listens to ['LSP7Transfer', 'LSP8Transfer']"
- [ ] 'Handlers accumulate changes in-memory: read existing state from DB + BatchContext, apply all batch transfers, write final result'
- [ ] 'Clamp totalSupply to zero on underflow (burn > recorded supply), log a warning'
- [ ] 'Delete OwnedAsset records when balance reaches zero'
- [ ] 'Delete OwnedToken records when token is transferred away (sender side)'
- [ ] 'OwnedToken FK to OwnedAsset — delete OwnedTokens FIRST, then OwnedAssets'
- [ ] "ID format change: use '{owner}:{address}' instead of '{owner} - {address}'"
- [ ] 'When enrichment queue targets a deleted entity, log at debug level'
- [ ] 'Queue enrichment for digitalAsset and universalProfile FKs — never set FKs directly'

## Files

- `packages/indexer-v2/src/handlers/totalSupply.handler.ts`
- `packages/indexer-v2/src/handlers/ownedAssets.handler.ts`
- `packages/indexer-v2/src/utils/index.ts`
