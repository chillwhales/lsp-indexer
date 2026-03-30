# M007: 

## Vision
Extend the @lsp-indexer package stack to expose chillwhales-specific NFT data — score/rank, game properties (chillClaimed, orbsClaimed, level, cooldownExpiry, faction), custom filters, score sorting, and a new collection attributes query — through the established type-safe include/narrowing pattern across all 4 consumer packages.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | NFT type + include extensions | high | — | ✅ | After this: fetchNfts returns score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction; Lsp4Attribute includes score/rarity; NFTs sortable by score. Codegen passes, 5-package build passes. |
| S02 | NftFilter + OwnedToken propagation | medium | S01 | ⬜ | After this: NFTs filterable by chillClaimed/orbsClaimed/maxLevel/cooldownExpiryBefore; getOwnedTokens returns nested NFT custom fields with include narrowing. |
| S03 | Collection attributes vertical | medium | S01 | ⬜ | After this: getCollectionAttributes server action returns distinct {key, value} pairs + totalCount for a collection address; useCollectionAttributes hook available. |
| S04 | Docs + verification | low | S01, S02, S03 | ⬜ | After this: docs pages reflect all new types, hooks, filters, sort fields. Full 5-package build verified clean. |
