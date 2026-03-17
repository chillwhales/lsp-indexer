# T03: 03-metadata-fetch-handlers 03

**Slice:** S03 — **Milestone:** M001

## Description

Implement the LSP4 digital asset metadata fetch handler — the most complex of the three, with 8+2 sub-entity types, Score/Rank extraction, and attribute-level score/rarity fields.

Purpose: META-02 requires LSP4 digital asset metadata fetched and 8 sub-entity types plus Score/Rank created. LSP4 is the most complex standard due to Score/Rank extraction from attributes, the category field, and the richer image/icon/asset structure. This gets its own plan because it's ~250 lines of parsing logic.

Output: `lsp4MetadataFetch.handler.ts` — a fetch handler that uses the shared utility from Plan 01 and creates LSP4MetadataName, Description, Category, Link, Image, Icon, Asset, Attribute, Score, and Rank entities.

## Must-Haves

- [ ] 'LSP4 fetch handler creates all 8 sub-entity types plus Score and Rank'
- [ ] 'Score is extracted from attributes where key === Score and value is numeric'
- [ ] 'Rank is extracted from attributes where key === Rank and value is numeric'
- [ ] 'Handler uses handleMetadataFetch from shared utility'
- [ ] 'Handler declares dependsOn lsp4Metadata base handler'
- [ ] 'Empty value path (url === null) clears sub-entities in every batch'
- [ ] 'Head-only gating prevents IPFS/HTTP fetches during historical sync'
- [ ] 'Attributes include score and rarity fields from V1 parsing logic'

## Files

- `packages/indexer-v2/src/handlers/lsp4MetadataFetch.handler.ts`
