---
id: S01
parent: M007
milestone: M007
provides:
  - NftSchema with 7 chillwhales fields
  - NftIncludeSchema with 7 boolean opt-in flags
  - NftSortFieldSchema with 'score'
  - NftScalarIncludeFieldMap with 7 entries
  - OwnedTokenNftScalarFieldMap with 7 entries
  - Lsp4AttributeSchema with score/rarity
  - 3 NFT GraphQL documents with @include variables for all 7 fields
  - 3 owned-token GraphQL documents with @includeNft* variables for all 7 fields
  - parseNft extracts all 7 fields
  - parseAttributes returns score/rarity
  - buildIncludeVars/buildNftIncludeVars map all 7 fields
  - buildNftOrderBy handles score sort
requires:
  []
affects:
  - S02
  - S03
  - S04
key_files:
  - packages/types/src/common.ts
  - packages/types/src/nfts.ts
  - packages/types/src/owned-tokens.ts
  - packages/node/src/documents/nfts.ts
  - packages/node/src/documents/owned-tokens.ts
  - packages/node/src/graphql/graphql.ts
  - packages/node/src/parsers/nfts.ts
  - packages/node/src/parsers/utils.ts
  - packages/node/src/services/nfts.ts
key_decisions:
  - All 7 chillwhales fields are nullable — non-chillwhales NFTs get null values, no separate schema needed
  - score/rank are lsp4_metadata relations inside both metadata blocks; chillClaimed/orbsClaimed/level/cooldownExpiry/faction are direct NFT object relations at selection level
  - buildNftIncludeVars serves both NFT and owned-token documents — single function, no duplication
patterns_established:
  - Chillwhales game fields follow the existing @include(if:) conditional pattern — consumers opt in via NftInclude boolean flags, defaulting to false
  - Owned-token NFT sub-selections mirror NFT document structure with $includeNft* prefix convention for variable names
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M007/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M007/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M007/slices/S01/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-30T11:03:18.658Z
blocker_discovered: false
---

# S01: NFT type + include extensions

**Extended NFT domain across all 5 packages with 7 chillwhales-specific fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction), score/rarity on Lsp4Attribute, score sort field, and owned-token propagation — full build passes.**

## What Happened

Three tasks extended the NFT domain vertically through the entire package stack.

**T01 (types):** Added 7 nullable fields to NftSchema, 7 boolean entries to NftIncludeSchema, 'score' to NftSortFieldSchema, 7 entries to NftScalarIncludeFieldMap, score/rarity to Lsp4AttributeSchema, and 7 entries to OwnedTokenNftScalarFieldMap. OwnedTokenNftIncludeSchema auto-inherits via `.omit({collection, holder})` — no changes needed.

**T02 (node — documents, codegen, parsers, services):** Extended all 3 NFT GraphQL documents (GetNft, GetNfts, NftSubscription) with 7 new `$include*` variable declarations and field selections. Score/rank are lsp4_metadata relations placed inside both `lsp4Metadata` and `lsp4MetadataBaseUri` blocks. score/rarity added to attributes sub-selection in both metadata blocks. 5 direct relations (chillClaimed, orbsClaimed, level, cooldownExpiry, faction) at NFT selection level. Ran codegen, updated parseAttributes for score/rarity, updated parseNft for all 7 fields with fallback chain (direct metadata → baseUri → null), updated buildIncludeVars and buildNftIncludeVars for all 7 fields, added score sort to buildNftOrderBy with nested lsp4Metadata path. Also fixed T01 gap where 'score' was missing from NftSortFieldSchema enum.

**T03 (owned-tokens propagation):** Extended all 3 owned-token documents (GetOwnedToken, GetOwnedTokens, OwnedTokenSubscription) with 7 `$includeNft*` prefixed variables and matching field selections mirroring the NFT document structure. buildNftIncludeVars already had all 7 entries from T02 — no service changes needed. Codegen regenerated, full pnpm build passes across all 9 workspace projects.

## Verification

Full 5-package build verification: `pnpm build` exits 0 across all 9 workspace projects (types, node, react, next, docs + abi, typeorm, indexer, comparison-tool). Docs generated all 22 static pages. Each task individually verified: T01 types build, T02 codegen + node build, T03 codegen + full build.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T01 left 'score' out of NftSortFieldSchema enum — T02 caught and fixed it. T03 found buildNftIncludeVars already populated by T02, so no service changes were needed (task plan step 2 was a no-op).

## Known Limitations

None.

## Follow-ups

S02 (NftFilter + OwnedToken propagation) and S03 (Collection attributes) depend on this slice and can now proceed.

## Files Created/Modified

- `packages/types/src/common.ts` — Added score and rarity nullable fields to Lsp4AttributeSchema
- `packages/types/src/nfts.ts` — Added 7 fields to NftSchema, 7 booleans to NftIncludeSchema, score to NftSortFieldSchema, 7 entries to NftScalarIncludeFieldMap
- `packages/types/src/owned-tokens.ts` — Added 7 entries to OwnedTokenNftScalarFieldMap
- `packages/node/src/documents/nfts.ts` — Extended GetNft, GetNfts, NftSubscription with 7 @include variables and field selections
- `packages/node/src/documents/owned-tokens.ts` — Extended GetOwnedToken, GetOwnedTokens, OwnedTokenSubscription with 7 $includeNft* variables and field selections
- `packages/node/src/graphql/graphql.ts` — Regenerated codegen output with new raw types for all NFT and owned-token documents
- `packages/node/src/parsers/nfts.ts` — Updated parseNft to extract 7 new fields with metadata fallback chain
- `packages/node/src/parsers/utils.ts` — Updated parseAttributes to return score and rarity
- `packages/node/src/services/nfts.ts` — Updated buildIncludeVars, buildNftIncludeVars, buildNftOrderBy for 7 new fields
