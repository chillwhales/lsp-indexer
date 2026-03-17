# S08: Lsp4 Base Uri Count Parity

**Goal:** Fix OwnedAsset double-processing bug and mark LSP8ReferenceContract as known V1 divergence.
**Demo:** Fix OwnedAsset double-processing bug and mark LSP8ReferenceContract as known V1 divergence.

## Must-Haves


## Tasks

- [x] **T01: 05.2-lsp4-base-uri-count-parity 01** `est:2 minutes`
  - Fix OwnedAsset double-processing bug and mark LSP8ReferenceContract as known V1 divergence.

Purpose: GAP-08 — OwnedAsset handler ignores `triggeredBy` and reads BOTH transfer bags on every invocation. Since it listens to both `LSP7Transfer` and `LSP8Transfer`, it gets called twice per batch, doubling balances. This inflates OwnedAsset count by ~14K because doubled balances prevent legitimate zero-balance deletions. GAP-07 — LSP8ReferenceContract count mismatch is a V1 bug (switch fall-through), not a V2 gap.

Output: Fixed ownedAssets.handler.ts that only processes the triggered bag's transfers + updated entityRegistry.ts with LSP8ReferenceContract divergence + unit tests.
- [x] **T02: 05.2-lsp4-base-uri-count-parity 02** `est:4min`
  - Add Orb NFT mint detection to orbLevel and orbFaction handlers to create default entities on mint.

Purpose: GAP-09 — V1's `orbsLevelHandler.ts` creates default Orb entities (OrbLevel=0, OrbCooldownExpiry=0, OrbFaction="Neutral") when an Orb NFT is minted (Transfer from zero address to ORBS_ADDRESS). V2's handlers only listen to `TokenIdDataChanged`, missing the mint-triggered defaults. This causes count mismatches for OrbLevel, OrbCooldownExpiry, and OrbFaction entities.

Output: Updated orbLevel.handler.ts and orbFaction.handler.ts with dual-trigger support (LSP8Transfer + TokenIdDataChanged).
- [x] **T03: 05.2-lsp4-base-uri-count-parity 03** `est:38min`
  - Create new lsp4MetadataBaseUri handler that derives per-token LSP4Metadata entities from LSP8TokenMetadataBaseURI + NFT tokenIds.

Purpose: GAP-06 — This is the big gap (~84K missing LSP4Metadata entities out of 116K total). V1's `utils/lsp4MetadataBaseUri.ts` has two trigger paths: (1) on NFT mint, check if parent collection has a base URI and derive per-token metadata URL, (2) on base URI change, derive URLs for ALL existing NFTs. V2 has no equivalent. The handler creates LSP4Metadata entities in the batch, which are automatically picked up by the existing `lsp4MetadataFetch.handler.ts` for IPFS/HTTP fetching.

Output: New `lsp4MetadataBaseUri.handler.ts` that closes the ~84K entity gap.

## Files Likely Touched

- `packages/indexer-v2/src/handlers/ownedAssets.handler.ts`
- `packages/indexer-v2/src/handlers/__tests__/ownedAssets.handler.test.ts`
- `packages/comparison-tool/src/entityRegistry.ts`
- `packages/indexer-v2/src/handlers/chillwhales/orbLevel.handler.ts`
- `packages/indexer-v2/src/handlers/chillwhales/orbFaction.handler.ts`
- `packages/indexer-v2/src/handlers/lsp4MetadataBaseUri.handler.ts`
