# T01: 05.2-lsp4-base-uri-count-parity 01

**Slice:** S08 — **Milestone:** M001

## Description

Fix OwnedAsset double-processing bug and mark LSP8ReferenceContract as known V1 divergence.

Purpose: GAP-08 — OwnedAsset handler ignores `triggeredBy` and reads BOTH transfer bags on every invocation. Since it listens to both `LSP7Transfer` and `LSP8Transfer`, it gets called twice per batch, doubling balances. This inflates OwnedAsset count by ~14K because doubled balances prevent legitimate zero-balance deletions. GAP-07 — LSP8ReferenceContract count mismatch is a V1 bug (switch fall-through), not a V2 gap.

Output: Fixed ownedAssets.handler.ts that only processes the triggered bag's transfers + updated entityRegistry.ts with LSP8ReferenceContract divergence + unit tests.

## Must-Haves

- [ ] "OwnedAsset handler processes only the triggered bag's transfers per invocation, not both bags"
- [ ] 'LSP8ReferenceContract is marked as known V1 divergence in comparison tool'
- [ ] 'OwnedAsset count no longer inflated by double-processing'

## Files

- `packages/indexer-v2/src/handlers/ownedAssets.handler.ts`
- `packages/indexer-v2/src/handlers/__tests__/ownedAssets.handler.test.ts`
- `packages/comparison-tool/src/entityRegistry.ts`
