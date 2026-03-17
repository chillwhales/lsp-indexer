# T02: 05.1-pipeline-bug-fix-missing-handlers 02

**Slice:** S07 — **Milestone:** M001

## Description

Create ChillClaimed and OrbsClaimed entity handlers — the two remaining Chillwhales-specific handlers that were never ported from V1.

Purpose: V1 creates ChillClaimed/OrbsClaimed entities in two phases: (1) on LSP8 mint transfers from zero address to CHILLWHALES_ADDRESS, create entities with value=false; (2) at chain head, query the CHILL/ORBS contracts via Multicall3 to verify claimed status, upsert with value=true. V2 has zero rows for both entity types because these handlers were never ported.

Output: 2 new EntityHandlers in the chillwhales subfolder

## Must-Haves

- [ ] 'ChillClaimed entities are created when Chillwhale NFTs are minted (LSP8 Transfer from zero address to CHILLWHALES_ADDRESS)'
- [ ] 'At chain head (isHead=true), unclaimed Chillwhale NFTs are verified via Multicall3 to CHILL contract and ChillClaimed entities upserted with value=true'
- [ ] 'OrbsClaimed entities are created when Chillwhale NFTs are minted (LSP8 Transfer from zero address to CHILLWHALES_ADDRESS)'
- [ ] 'At chain head (isHead=true), unclaimed Orbs NFTs are verified via Multicall3 to ORBS contract and OrbsClaimed entities upserted with value=true'

## Files

- `packages/indexer-v2/src/handlers/chillwhales/chillClaimed.handler.ts`
- `packages/indexer-v2/src/handlers/chillwhales/orbsClaimed.handler.ts`
