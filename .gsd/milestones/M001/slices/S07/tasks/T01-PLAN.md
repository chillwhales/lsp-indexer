# T01: 05.1-pipeline-bug-fix-missing-handlers 01

**Slice:** S07 — **Milestone:** M001

## Description

Fix the contract filter address comparison bug in pipeline.ts that silences 4 entity types (Follow, Unfollow, DeployedContracts, DeployedERC1167Proxies), and create the two missing ownership entity handlers (UniversalProfileOwner, DigitalAssetOwner).

Purpose: The case-sensitive address comparison at pipeline.ts:205 prevents ALL contract-scoped plugins from matching events (Subsquid delivers lowercase addresses, but plugin constants use mixed-case checksummed addresses). The ownership handlers complete the OwnershipTransferred event flow — V1 creates owner entities after verification resolves UP/DA FKs.

Output: Fixed pipeline filter + 2 new postVerification EntityHandlers

## Must-Haves

- [ ] 'Contract filter address comparison is case-insensitive — Follow, Unfollow, DeployedContracts, DeployedERC1167Proxies events are no longer silenced'
- [ ] 'UniversalProfileOwner entities are created from OwnershipTransferred events where the emitting address is a verified UniversalProfile'
- [ ] 'DigitalAssetOwner entities are created from OwnershipTransferred events where the emitting address is a verified DigitalAsset'
- [ ] 'Owner entities use the emitting address as id, newOwner as the address field, and deduplicate by address (Map pattern)'

## Files

- `packages/indexer-v2/src/core/pipeline.ts`
- `packages/indexer-v2/src/handlers/universalProfileOwner.handler.ts`
- `packages/indexer-v2/src/handlers/digitalAssetOwner.handler.ts`
