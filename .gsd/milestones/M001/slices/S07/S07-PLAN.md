# S07: Pipeline Bug Fix Missing Handlers

**Goal:** Fix the contract filter address comparison bug in pipeline.
**Demo:** Fix the contract filter address comparison bug in pipeline.

## Must-Haves


## Tasks

- [x] **T01: 05.1-pipeline-bug-fix-missing-handlers 01** `est:2 min`
  - Fix the contract filter address comparison bug in pipeline.ts that silences 4 entity types (Follow, Unfollow, DeployedContracts, DeployedERC1167Proxies), and create the two missing ownership entity handlers (UniversalProfileOwner, DigitalAssetOwner).

Purpose: The case-sensitive address comparison at pipeline.ts:205 prevents ALL contract-scoped plugins from matching events (Subsquid delivers lowercase addresses, but plugin constants use mixed-case checksummed addresses). The ownership handlers complete the OwnershipTransferred event flow — V1 creates owner entities after verification resolves UP/DA FKs.

Output: Fixed pipeline filter + 2 new postVerification EntityHandlers
- [x] **T02: 05.1-pipeline-bug-fix-missing-handlers 02** `est:2 min`
  - Create ChillClaimed and OrbsClaimed entity handlers — the two remaining Chillwhales-specific handlers that were never ported from V1.

Purpose: V1 creates ChillClaimed/OrbsClaimed entities in two phases: (1) on LSP8 mint transfers from zero address to CHILLWHALES_ADDRESS, create entities with value=false; (2) at chain head, query the CHILL/ORBS contracts via Multicall3 to verify claimed status, upsert with value=true. V2 has zero rows for both entity types because these handlers were never ported.

Output: 2 new EntityHandlers in the chillwhales subfolder

## Files Likely Touched

- `packages/indexer-v2/src/core/pipeline.ts`
- `packages/indexer-v2/src/handlers/universalProfileOwner.handler.ts`
- `packages/indexer-v2/src/handlers/digitalAssetOwner.handler.ts`
- `packages/indexer-v2/src/handlers/chillwhales/chillClaimed.handler.ts`
- `packages/indexer-v2/src/handlers/chillwhales/orbsClaimed.handler.ts`
