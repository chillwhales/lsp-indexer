# T02: 05.2-lsp4-base-uri-count-parity 02

**Slice:** S08 — **Milestone:** M001

## Description

Add Orb NFT mint detection to orbLevel and orbFaction handlers to create default entities on mint.

Purpose: GAP-09 — V1's `orbsLevelHandler.ts` creates default Orb entities (OrbLevel=0, OrbCooldownExpiry=0, OrbFaction="Neutral") when an Orb NFT is minted (Transfer from zero address to ORBS_ADDRESS). V2's handlers only listen to `TokenIdDataChanged`, missing the mint-triggered defaults. This causes count mismatches for OrbLevel, OrbCooldownExpiry, and OrbFaction entities.

Output: Updated orbLevel.handler.ts and orbFaction.handler.ts with dual-trigger support (LSP8Transfer + TokenIdDataChanged).

## Must-Haves

- [ ] 'When an Orb NFT is minted, OrbLevel entity is created with value 0'
- [ ] 'When an Orb NFT is minted, OrbCooldownExpiry entity is created with value 0'
- [ ] "When an Orb NFT is minted, OrbFaction entity is created with value 'Neutral'"
- [ ] 'Subsequent TokenIdDataChanged events still overwrite defaults with actual on-chain values'

## Files

- `packages/indexer-v2/src/handlers/chillwhales/orbLevel.handler.ts`
- `packages/indexer-v2/src/handlers/chillwhales/orbFaction.handler.ts`
