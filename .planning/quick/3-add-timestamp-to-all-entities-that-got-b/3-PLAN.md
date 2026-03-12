---
phase: quick
plan: 3
type: quick
autonomous: true
---

# Quick Task 3: Add Timestamp to All Entities Missing It

## Objective

Phase 19 added `blockNumber`, `transactionIndex`, `logIndex` to all 72 entity types but omitted `timestamp`. Add `timestamp: DateTime! @index` to the 36 entities that are missing it, update the pipeline and all handlers to propagate timestamp, and create a changeset for a patch release.

## Context

- @packages/typeorm/schema.graphql — Entity schema definitions
- @packages/indexer/src/core/pipeline.ts — Pipeline orchestrator
- @packages/indexer/src/core/verification.ts — Creates UP/DA core entities
- @packages/indexer/src/handlers/ — Entity handlers creating derived entities

## Tasks

### Task 1: Schema changes + codegen
type="auto"

Add `timestamp: DateTime! @index` to all 36 entities missing it in schema.graphql:
- Core entities: UniversalProfile, DigitalAsset, NFT
- Post-verification: Decimals
- LSP6 sub-entities: LSP6Permission, LSP6AllowedCall, LSP6AllowedERC725YDataKey
- LSP3 sub-entities: LSP3ProfileName, LSP3ProfileDescription, LSP3ProfileTag, LSP3ProfileLink, LSP3ProfileAsset, LSP3ProfileImage, LSP3ProfileBackgroundImage
- LSP4 sub-entities: LSP4MetadataName, LSP4MetadataDescription, LSP4MetadataScore, LSP4MetadataRank, LSP4MetadataCategory, LSP4MetadataLink, LSP4MetadataIcon, LSP4MetadataImage, LSP4MetadataAsset, LSP4MetadataAttribute
- LSP29 sub-entities: LSP29EncryptedAssetTitle, LSP29EncryptedAssetDescription, LSP29EncryptedAssetFile, LSP29EncryptedAssetEncryption, LSP29AccessControlCondition, LSP29EncryptedAssetChunks, LSP29EncryptedAssetImage
- Chillwhales: ChillClaimed, OrbsClaimed, OrbLevel, OrbCooldownExpiry, OrbFaction

Run `pnpm --filter=@chillwhales/typeorm build` to regenerate entities.

verify: TypeORM codegen succeeds, generated entities have timestamp field
done: All 36 entities have timestamp in schema and generated TypeORM classes

### Task 2: Pipeline + verification + all handlers
type="auto"

**Pipeline (pipeline.ts):**
- Build `blockTimestampByNumber: Map<number, number>` from `context.blocks` headers
- Include timestamp in `earliestBlockByAddress` BlockPosition (add to BlockPosition type)
- Pass through to verification

**Verification (verification.ts):**
- Set `timestamp: new Date(blockPos.timestamp)` on new UP/DA entities

**BlockPosition type (types/verification.ts):**
- Add `timestamp: number` field

**Handlers requiring timestamp on entity constructors:**
- nft.handler.ts — from Transfer/TokenIdDataChanged events
- decimals.handler.ts — from verified DA entity
- lsp6Controllers.handler.ts — from DataChanged event for sub-entities (LSP6Permission, LSP6AllowedCall, LSP6AllowedERC725YDataKey)
- lsp3ProfileFetch.handler.ts — from parent entity
- lsp4MetadataFetch.handler.ts — from parent entity
- lsp29EncryptedAssetFetch.handler.ts — from parent entity
- chillClaimed.handler.ts — from Transfer event
- orbsClaimed.handler.ts — from Transfer event
- orbLevel.handler.ts — from Transfer/TokenIdDataChanged events
- orbCooldownExpiry.handler.ts — from Transfer/TokenIdDataChanged events  
- orbFaction.handler.ts — from Transfer/TokenIdDataChanged events
- universalProfileOwner.handler.ts — update cast type
- digitalAssetOwner.handler.ts — update cast type

**Enrichment requests:**
- Add `timestamp` to all ~90 queueEnrichment calls (plugins + handlers)

**Tests:**
- Update test fixtures with timestamp field

verify: `pnpm --filter=@chillwhales/indexer build` succeeds
done: All entities receive timestamp, build passes

### Task 3: Changeset + final build
type="auto"

- Create changeset for `@chillwhales/indexer` patch bump
- Run full build (`pnpm build`)
- Verify no type errors

verify: `pnpm build` succeeds
done: Changeset created, full build passes

## Success Criteria

- All 72 entity types have timestamp field in schema.graphql
- Pipeline propagates timestamp from block headers to core entities
- All handlers set timestamp on derived entities
- Full build passes
- Changeset created for patch release
