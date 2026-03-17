# T02: 19-block-ordering 02

**Slice:** S23 — **Milestone:** M001

## Description

Wire block ordering data through EventPlugins and the core entity verification pipeline.

Purpose: EventPlugins have direct access to block/transaction/log context from decoded events. This plan replaces the placeholder 0 values (from Plan 01) with real block data in all plugin enrichment requests, then updates the verification and pipeline to set block fields on newly created UP/DA/NFT entities from the earliest enrichment request per address. Implements BORD-04's "oldest retention" guarantee.

Output: All 11 EventPlugins pass real block data in enrichment requests. Pipeline sets block position on new core entities from earliest enrichment. Existing core entities' block fields are never overwritten.

## Must-Haves

- [ ] "Every EventPlugin passes real block/tx/log values in enrichment requests (no placeholder 0s)"
- [ ] "New UP/DA entities get blockNumber/transactionIndex/logIndex from the earliest enrichment request for that address"
- [ ] "Existing UP/DA entities are NOT overwritten when re-encountered in later batches"
- [ ] "NFT entities get block fields from the earliest enrichment request for that tokenId"

## Files

- `packages/indexer/src/plugins/events/dataChanged.plugin.ts`
- `packages/indexer/src/plugins/events/deployedContracts.plugin.ts`
- `packages/indexer/src/plugins/events/deployedProxies.plugin.ts`
- `packages/indexer/src/plugins/events/executed.plugin.ts`
- `packages/indexer/src/plugins/events/follow.plugin.ts`
- `packages/indexer/src/plugins/events/lsp7Transfer.plugin.ts`
- `packages/indexer/src/plugins/events/lsp8Transfer.plugin.ts`
- `packages/indexer/src/plugins/events/ownershipTransferred.plugin.ts`
- `packages/indexer/src/plugins/events/tokenIdDataChanged.plugin.ts`
- `packages/indexer/src/plugins/events/unfollow.plugin.ts`
- `packages/indexer/src/plugins/events/universalReceiver.plugin.ts`
- `packages/indexer/src/core/pipeline.ts`
- `packages/indexer/src/core/verification.ts`
