# T03: 01-handler-migration 03

**Slice:** S01 — **Milestone:** M001

## Description

Rewrite the decimals handler to use the V2 EntityHandler interface with `postVerification: true` (HMIG-03), and create a new FormattedTokenId handler that populates `NFT.formattedTokenId` based on LSP8TokenIdFormat with retroactive update behavior and explicit handler dependency ordering (HMIG-04).

## Must-Haves

- [ ] 'decimals handler uses postVerification: true — runs in Step 5.5 after DA verification'
- [ ] 'decimals handler reads batchCtx.getVerified(EntityCategory.DigitalAsset).newEntities'
- [ ] 'decimals handler uses Multicall3 batch size of 100 (match V1)'
- [ ] "FormattedTokenId handler declares dependsOn: ['lsp8TokenIdFormat']"
- [ ] 'FormattedTokenId preserves V1 retroactive update: when format changes, query DB and reformat ALL existing NFTs'
- [ ] 'When format is unknown/not set, leave formattedTokenId as null'
- [ ] 'Support 4 formats: NUMBER, STRING, ADDRESS, BYTES32 with identical V1 conversion logic'
- [ ] 'Log warning on unknown format (not raw tokenId like V1)'

## Files

- `packages/indexer-v2/src/handlers/decimals.handler.ts`
- `packages/indexer-v2/src/handlers/formattedTokenId.handler.ts`
