# T03: 19-block-ordering 03

**Slice:** S23 — **Milestone:** M001

## Description

Wire block ordering data through all EntityHandlers for derived entities.

Purpose: EntityHandlers create derived entities (data keys, tallies, NFTs, metadata, etc.) from triggering events. Each derived entity must carry the block position of the event that created it. This plan updates all ~29 handlers to (a) set block fields on derived entity constructors from the triggering event, and (b) pass real block values in enrichment requests. Metadata fetch handlers propagate block fields from parent metadata entities to their sub-entities.

Output: All EntityHandlers populate block ordering fields on every derived entity. Zero placeholder values remain. Full indexer build compiles cleanly.

## Must-Haves

- [ ] "Every EntityHandler sets blockNumber/transactionIndex/logIndex on derived entities from the triggering event"
- [ ] "Every EntityHandler passes real block values in enrichment requests (no placeholder 0s)"
- [ ] "Metadata fetch handlers propagate block fields from parent entity to sub-entities"
- [ ] "Chillwhales handlers propagate block fields from triggering Transfer event"

## Files

- `packages/indexer/src/handlers/lsp4TokenName.handler.ts`
- `packages/indexer/src/handlers/lsp4TokenSymbol.handler.ts`
- `packages/indexer/src/handlers/lsp4TokenType.handler.ts`
- `packages/indexer/src/handlers/lsp4Creators.handler.ts`
- `packages/indexer/src/handlers/lsp5ReceivedAssets.handler.ts`
- `packages/indexer/src/handlers/lsp6Controllers.handler.ts`
- `packages/indexer/src/handlers/lsp8TokenIdFormat.handler.ts`
- `packages/indexer/src/handlers/lsp8ReferenceContract.handler.ts`
- `packages/indexer/src/handlers/lsp8MetadataBaseURI.handler.ts`
- `packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts`
- `packages/indexer/src/handlers/lsp29EncryptedAsset.handler.ts`
- `packages/indexer/src/handlers/lsp3Profile.handler.ts`
- `packages/indexer/src/handlers/lsp4Metadata.handler.ts`
- `packages/indexer/src/handlers/lsp4MetadataBaseUri.handler.ts`
- `packages/indexer/src/handlers/nft.handler.ts`
- `packages/indexer/src/handlers/totalSupply.handler.ts`
- `packages/indexer/src/handlers/follower.handler.ts`
- `packages/indexer/src/handlers/ownedAssets.handler.ts`
- `packages/indexer/src/handlers/decimals.handler.ts`
- `packages/indexer/src/handlers/universalProfileOwner.handler.ts`
- `packages/indexer/src/handlers/digitalAssetOwner.handler.ts`
- `packages/indexer/src/handlers/formattedTokenId.handler.ts`
- `packages/indexer/src/handlers/lsp3ProfileFetch.handler.ts`
- `packages/indexer/src/handlers/lsp4MetadataFetch.handler.ts`
- `packages/indexer/src/handlers/lsp29EncryptedAssetFetch.handler.ts`
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts`
- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts`
- `packages/indexer/src/handlers/chillwhales/orbLevel.handler.ts`
- `packages/indexer/src/handlers/chillwhales/orbFaction.handler.ts`
