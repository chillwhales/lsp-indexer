---
id: T02
parent: S01
milestone: M007
provides: []
requires: []
affects: []
key_files: ["packages/node/src/documents/nfts.ts", "packages/node/src/graphql/graphql.ts", "packages/node/src/parsers/nfts.ts", "packages/node/src/parsers/utils.ts", "packages/node/src/services/nfts.ts", "packages/types/src/nfts.ts"]
key_decisions: ["score/rank are lsp4_metadata relations placed inside both metadata blocks; chillClaimed/orbsClaimed/level/cooldownExpiry/faction are direct NFT object relations at selection level", "Fixed T01 gap: added 'score' to NftSortFieldSchema enum"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "pnpm --filter=@lsp-indexer/node codegen exits 0, pnpm --filter=@lsp-indexer/types build exits 0, pnpm --filter=@lsp-indexer/node build exits 0 (includes codegen + DTS type checking)"
completed_at: 2026-03-30T10:56:51.750Z
blocker_discovered: false
---

# T02: Extended all 3 NFT GraphQL documents with 7 new @include fields, regenerated codegen, updated parseNft/parseAttributes/buildIncludeVars/buildNftOrderBy for chillwhales fields

> Extended all 3 NFT GraphQL documents with 7 new @include fields, regenerated codegen, updated parseNft/parseAttributes/buildIncludeVars/buildNftOrderBy for chillwhales fields

## What Happened
---
id: T02
parent: S01
milestone: M007
key_files:
  - packages/node/src/documents/nfts.ts
  - packages/node/src/graphql/graphql.ts
  - packages/node/src/parsers/nfts.ts
  - packages/node/src/parsers/utils.ts
  - packages/node/src/services/nfts.ts
  - packages/types/src/nfts.ts
key_decisions:
  - score/rank are lsp4_metadata relations placed inside both metadata blocks; chillClaimed/orbsClaimed/level/cooldownExpiry/faction are direct NFT object relations at selection level
  - Fixed T01 gap: added 'score' to NftSortFieldSchema enum
duration: ""
verification_result: passed
completed_at: 2026-03-30T10:56:51.750Z
blocker_discovered: false
---

# T02: Extended all 3 NFT GraphQL documents with 7 new @include fields, regenerated codegen, updated parseNft/parseAttributes/buildIncludeVars/buildNftOrderBy for chillwhales fields

**Extended all 3 NFT GraphQL documents with 7 new @include fields, regenerated codegen, updated parseNft/parseAttributes/buildIncludeVars/buildNftOrderBy for chillwhales fields**

## What Happened

Updated packages/node/src/documents/nfts.ts — all three documents (GetNft, GetNfts, NftSubscription) now have 7 new variable declarations ($includeScore through $includeFaction). Score/rank relations added inside both lsp4Metadata and lsp4MetadataBaseUri blocks. score/rarity columns added to attributes sub-selection. 5 direct relations added at NFT selection level. Ran codegen, updated parseAttributes for score/rarity, updated parseNft for all 7 fields, updated buildIncludeVars/buildNftIncludeVars/buildNftOrderBy. Fixed T01 gap where NftSortFieldSchema was missing 'score'.

## Verification

pnpm --filter=@lsp-indexer/node codegen exits 0, pnpm --filter=@lsp-indexer/types build exits 0, pnpm --filter=@lsp-indexer/node build exits 0 (includes codegen + DTS type checking)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@lsp-indexer/node codegen` | 0 | ✅ pass | 3000ms |
| 2 | `pnpm --filter=@lsp-indexer/types build` | 0 | ✅ pass | 900ms |
| 3 | `pnpm --filter=@lsp-indexer/node build` | 0 | ✅ pass | 2200ms |


## Deviations

Fixed NftSortFieldSchema in packages/types/src/nfts.ts to include 'score' — T01 claimed this was done but it was missing from the enum.

## Known Issues

None.

## Files Created/Modified

- `packages/node/src/documents/nfts.ts`
- `packages/node/src/graphql/graphql.ts`
- `packages/node/src/parsers/nfts.ts`
- `packages/node/src/parsers/utils.ts`
- `packages/node/src/services/nfts.ts`
- `packages/types/src/nfts.ts`


## Deviations
Fixed NftSortFieldSchema in packages/types/src/nfts.ts to include 'score' — T01 claimed this was done but it was missing from the enum.

## Known Issues
None.
