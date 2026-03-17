# T01: 19.1-type-system-tightening 01

**Slice:** S24 — **Milestone:** M001

## Description

Remove unchecked generic type parameter from all `getEntities<T>()` call sites and add explicit `as Map<string, ConcreteType>` casts at the handler level where the concrete type is known.

Purpose: The IBatchContext interface and BatchContext class have already been updated to return `Map<string, Entity>` from `getEntities()` (no generic). But 28 consumer files still call the old `getEntities<T>()` pattern, causing 331 TypeScript compilation errors. This plan fixes all consumers to compile against the new honest types.

Output: All 28 files updated, build passes with zero errors, test suite passes.

## Must-Haves

- [ ] "getEntities() has no generic type parameter on IBatchContext interface"
- [ ] "addEntity() accepts Entity (not unknown) on IBatchContext interface"
- [ ] "All handler files compile with explicit casts at the call site"
- [ ] "pnpm --filter=@chillwhales/indexer build exits with zero errors"
- [ ] "Full test suite passes (pnpm --filter=@chillwhales/indexer test)"

## Files

- `packages/indexer/src/core/fkResolution.ts`
- `packages/indexer/src/utils/metadataFetch.ts`
- `packages/indexer/src/core/__tests__/pipeline.test.ts`
- `packages/indexer/src/handlers/lsp4TokenName.handler.ts`
- `packages/indexer/src/handlers/lsp4TokenSymbol.handler.ts`
- `packages/indexer/src/handlers/lsp4TokenType.handler.ts`
- `packages/indexer/src/handlers/lsp8TokenIdFormat.handler.ts`
- `packages/indexer/src/handlers/lsp8ReferenceContract.handler.ts`
- `packages/indexer/src/handlers/lsp8MetadataBaseURI.handler.ts`
- `packages/indexer/src/handlers/lsp3Profile.handler.ts`
- `packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts`
- `packages/indexer/src/handlers/lsp29EncryptedAsset.handler.ts`
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
- `packages/indexer/src/handlers/chillwhales/orbFaction.handler.ts`
- `packages/indexer/src/handlers/chillwhales/orbLevel.handler.ts`
- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts`
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts`
