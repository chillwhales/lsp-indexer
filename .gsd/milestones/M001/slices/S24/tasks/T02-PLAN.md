# T02: 19.1-type-system-tightening 02

**Slice:** S24 — **Milestone:** M001

## Description

Create a full entity registry that maps every BatchContext bag key to its TypeORM entity
class — both at the type level and at runtime. Make `addEntity()` and `getEntities()`
fully type-safe: compile-time enforcement that the entity matches the bag key, plus
runtime `instanceof` validation. Delete `entityTypeMap.ts` and `getTypedEntities()` —
`getEntities()` itself returns typed entities directly.

This eliminates all `as Map<string, T>` casts from handlers and helpers, prevents bag
key typos at compile time, and catches entity type mismatches at runtime immediately
instead of letting bad data propagate.

## Must-Haves

- [ ] "Every bag key is registered in EntityRegistry — typo in addEntity/getEntities = compile error"
- [ ] "addEntity<K> enforces entity type matches the bag key at compile time"
- [ ] "getEntities<K> returns Map<string, EntityRegistry[K]> — no cast needed at call sites"
- [ ] "addEntity validates with instanceof at runtime — wrong entity type = immediate throw"
- [ ] "getEntities validates with instanceof at runtime on non-empty maps"
- [ ] "Zero 'as Map<string,' casts remain in handler files"
- [ ] "Zero 'as Map<string,' casts remain in handlerHelpers.ts"
- [ ] "getTypedEntities() is deleted — getEntities() IS the typed accessor"
- [ ] "entityTypeMap.ts is deleted — entityRegistry.ts replaces it"
- [ ] "Pipeline and fkResolution use getEntitiesUntyped(string) for dynamic iteration"
- [ ] "resolveEntity/resolveEntities no longer take entityClass — constructor comes from registry"
- [ ] "pnpm --filter=@chillwhales/indexer build exits with zero errors"
- [ ] "Full test suite passes (pnpm --filter=@chillwhales/indexer test)"

## Files

- `packages/indexer/src/core/types/batchContext.ts`
- `packages/indexer/src/core/batchContext.ts`
- `packages/indexer/src/core/types/handler.ts`
- `packages/indexer/src/core/handlerHelpers.ts`
- `packages/indexer/src/core/fkResolution.ts`
- `packages/indexer/src/core/pipeline.ts`
- `packages/indexer/src/utils/metadataFetch.ts`
- `packages/indexer/src/plugins/events/dataChanged.plugin.ts`
- `packages/indexer/src/plugins/events/tokenIdDataChanged.plugin.ts`
- `packages/indexer/src/plugins/events/lsp7Transfer.plugin.ts`
- `packages/indexer/src/plugins/events/lsp8Transfer.plugin.ts`
- `packages/indexer/src/plugins/events/follow.plugin.ts`
- `packages/indexer/src/plugins/events/unfollow.plugin.ts`
- `packages/indexer/src/plugins/events/ownershipTransferred.plugin.ts`
- `packages/indexer/src/plugins/events/universalReceiver.plugin.ts`
- `packages/indexer/src/plugins/events/executed.plugin.ts`
- `packages/indexer/src/plugins/events/deployedProxies.plugin.ts`
- `packages/indexer/src/plugins/events/deployedContracts.plugin.ts`
- `packages/indexer/src/handlers/lsp4TokenName.handler.ts`
- `packages/indexer/src/handlers/lsp4TokenSymbol.handler.ts`
- `packages/indexer/src/handlers/lsp4TokenType.handler.ts`
- `packages/indexer/src/handlers/lsp8TokenIdFormat.handler.ts`
- `packages/indexer/src/handlers/lsp8ReferenceContract.handler.ts`
- `packages/indexer/src/handlers/lsp8MetadataBaseURI.handler.ts`
- `packages/indexer/src/handlers/lsp3Profile.handler.ts`
- `packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts`
- `packages/indexer/src/handlers/lsp29EncryptedAsset.handler.ts`
- `packages/indexer/src/handlers/lsp29EncryptedAssetFetch.handler.ts`
- `packages/indexer/src/handlers/lsp3ProfileFetch.handler.ts`
- `packages/indexer/src/handlers/lsp4MetadataFetch.handler.ts`
- `packages/indexer/src/handlers/digitalAssetOwner.handler.ts`
- `packages/indexer/src/handlers/universalProfileOwner.handler.ts`
- `packages/indexer/src/handlers/lsp5ReceivedAssets.handler.ts`
- `packages/indexer/src/handlers/lsp4Creators.handler.ts`
- `packages/indexer/src/handlers/lsp4Metadata.handler.ts`
- `packages/indexer/src/handlers/lsp4MetadataBaseUri.handler.ts`
- `packages/indexer/src/handlers/totalSupply.handler.ts`
- `packages/indexer/src/handlers/ownedAssets.handler.ts`
- `packages/indexer/src/handlers/nft.handler.ts`
- `packages/indexer/src/handlers/follower.handler.ts`
- `packages/indexer/src/handlers/formattedTokenId.handler.ts`
- `packages/indexer/src/handlers/lsp6Controllers.handler.ts`
- `packages/indexer/src/handlers/decimals.handler.ts`
- `packages/indexer/src/handlers/chillwhales/orbFaction.handler.ts`
- `packages/indexer/src/handlers/chillwhales/orbLevel.handler.ts`
- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts`
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts`
- `packages/indexer/src/core/__tests__/batchContext.test.ts`
- `packages/indexer/src/core/__tests__/pipeline.test.ts`
- `packages/indexer/src/core/__tests__/fkResolution.test.ts`
- `packages/indexer/src/core/__tests__/handlerHelpers.test.ts`
- `packages/indexer/src/handlers/__tests__/follower.handler.test.ts`
- `packages/indexer/src/handlers/__tests__/lsp4MetadataBaseUri.handler.test.ts`
- `packages/indexer/src/handlers/__tests__/lsp5ReceivedAssets.handler.test.ts`
- `packages/indexer/src/handlers/__tests__/ownedAssets.handler.test.ts`
- `packages/indexer/src/handlers/__tests__/totalSupply.handler.test.ts`
- `packages/indexer/src/handlers/__tests__/orbLevel.handler.test.ts`
- `packages/indexer/src/handlers/__tests__/orbFaction.handler.test.ts`
- `packages/indexer/src/handlers/__tests__/lsp6Controllers.handler.test.ts`
