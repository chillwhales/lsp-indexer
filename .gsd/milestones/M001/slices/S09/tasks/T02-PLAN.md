# T02: 05.3-entity-upsert-pattern-standardization 02

**Slice:** S09 — **Milestone:** M001

## Description

Fix 3 bugs and 2 cross-batch gaps in Tier 1 handlers by applying the resolve + spread pattern. These are the highest-priority handlers because they have confirmed data loss bugs.

Purpose: Fixes ChillClaimed/OrbsClaimed FK wipe in Phase 2, lsp5ReceivedAssets missing addEntity on cross-batch merge, and orbLevel/orbFaction batch-only lookups.

Output: 5 handler files updated with correct resolve + spread + addEntity pattern.

## Must-Haves

- [ ] 'ChillClaimed Phase 2 verification preserves existing FK values (digitalAsset, nft) from DB entity'
- [ ] 'OrbsClaimed Phase 2 verification preserves existing FK values (digitalAsset, nft) from DB entity'
- [ ] 'lsp5ReceivedAssets cross-batch merge calls addEntity for DB-sourced entities being updated'
- [ ] 'OrbLevel TokenIdDataChanged path resolves entities from batch AND DB (not batch-only)'
- [ ] 'OrbFaction TokenIdDataChanged path resolves entities from batch AND DB (not batch-only)'

## Files

- `packages/indexer-v2/src/handlers/chillwhales/chillClaimed.handler.ts`
- `packages/indexer-v2/src/handlers/chillwhales/orbsClaimed.handler.ts`
- `packages/indexer-v2/src/handlers/lsp5ReceivedAssets.handler.ts`
- `packages/indexer-v2/src/handlers/chillwhales/orbLevel.handler.ts`
- `packages/indexer-v2/src/handlers/chillwhales/orbFaction.handler.ts`
