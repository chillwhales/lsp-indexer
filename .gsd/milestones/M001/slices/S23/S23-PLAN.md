# S23: Block Ordering

**Goal:** Add block ordering fields to the schema and type system foundation.
**Demo:** Add block ordering fields to the schema and type system foundation.

## Must-Haves


## Tasks

- [x] **T01: 19-block-ordering 01** `est:10min`
  - Add block ordering fields to the schema and type system foundation.

Purpose: Every indexed entity needs `blockNumber`, `transactionIndex`, and `logIndex` columns for deterministic blockchain ordering. This plan updates the GraphQL schema, the EnrichmentRequest interface, runs codegen, and verifies the full build compiles.

Output: Updated schema.graphql with ~59 entity types carrying block ordering fields, updated EnrichmentRequest type, regenerated TypeORM entities, clean build.
- [x] **T02: 19-block-ordering 02** `est:8min`
  - Wire block ordering data through EventPlugins and the core entity verification pipeline.

Purpose: EventPlugins have direct access to block/transaction/log context from decoded events. This plan replaces the placeholder 0 values (from Plan 01) with real block data in all plugin enrichment requests, then updates the verification and pipeline to set block fields on newly created UP/DA/NFT entities from the earliest enrichment request per address. Implements BORD-04's "oldest retention" guarantee.

Output: All 11 EventPlugins pass real block data in enrichment requests. Pipeline sets block position on new core entities from earliest enrichment. Existing core entities' block fields are never overwritten.
- [x] **T03: 19-block-ordering 03** `est:17min`
  - Wire block ordering data through all EntityHandlers for derived entities.

Purpose: EntityHandlers create derived entities (data keys, tallies, NFTs, metadata, etc.) from triggering events. Each derived entity must carry the block position of the event that created it. This plan updates all ~29 handlers to (a) set block fields on derived entity constructors from the triggering event, and (b) pass real block values in enrichment requests. Metadata fetch handlers propagate block fields from parent metadata entities to their sub-entities.

Output: All EntityHandlers populate block ordering fields on every derived entity. Zero placeholder values remain. Full indexer build compiles cleanly.

## Files Likely Touched

- `packages/typeorm/schema.graphql`
- `packages/typeorm/src/model/generated/*.ts  # codegen output`
- `packages/indexer/src/core/types/verification.ts`
- `packages/indexer/src/handlers/ownedAssets.handler.ts  # block → blockNumber rename`
- `packages/indexer/src/plugins/events/*.plugin.ts  # placeholder 0 values for build`
- `packages/indexer/src/handlers/*.handler.ts  # placeholder 0 values for build`
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
