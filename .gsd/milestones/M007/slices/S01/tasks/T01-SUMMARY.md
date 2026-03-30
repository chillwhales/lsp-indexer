---
id: T01
parent: S01
milestone: M007
provides: []
requires: []
affects: []
key_files: ["packages/types/src/common.ts", "packages/types/src/nfts.ts", "packages/types/src/owned-tokens.ts"]
key_decisions: ["All 7 chillwhales fields are nullable — non-chillwhales NFTs get null values, no need for separate schema"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "pnpm --filter=@lsp-indexer/types build exits 0 — both ESM and DTS builds succeed cleanly."
completed_at: 2026-03-30T10:50:36.738Z
blocker_discovered: false
---

# T01: Added chillwhales fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction) to NftSchema/NftInclude/NftSortField/NftScalarIncludeFieldMap, score/rarity to Lsp4AttributeSchema, and 7 entries to OwnedTokenNftScalarFieldMap

> Added chillwhales fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction) to NftSchema/NftInclude/NftSortField/NftScalarIncludeFieldMap, score/rarity to Lsp4AttributeSchema, and 7 entries to OwnedTokenNftScalarFieldMap

## What Happened
---
id: T01
parent: S01
milestone: M007
key_files:
  - packages/types/src/common.ts
  - packages/types/src/nfts.ts
  - packages/types/src/owned-tokens.ts
key_decisions:
  - All 7 chillwhales fields are nullable — non-chillwhales NFTs get null values, no need for separate schema
duration: ""
verification_result: passed
completed_at: 2026-03-30T10:50:36.739Z
blocker_discovered: false
---

# T01: Added chillwhales fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction) to NftSchema/NftInclude/NftSortField/NftScalarIncludeFieldMap, score/rarity to Lsp4AttributeSchema, and 7 entries to OwnedTokenNftScalarFieldMap

**Added chillwhales fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction) to NftSchema/NftInclude/NftSortField/NftScalarIncludeFieldMap, score/rarity to Lsp4AttributeSchema, and 7 entries to OwnedTokenNftScalarFieldMap**

## What Happened

Extended three files in the types package: common.ts (Lsp4AttributeSchema + score/rarity), nfts.ts (NftSchema 7 fields, NftIncludeSchema 7 booleans, NftSortFieldSchema + score, NftScalarIncludeFieldMap 7 entries), owned-tokens.ts (OwnedTokenNftScalarFieldMap 7 entries). OwnedTokenNftIncludeSchema auto-inherits via .omit({collection, holder}) from NftIncludeSchema.

## Verification

pnpm --filter=@lsp-indexer/types build exits 0 — both ESM and DTS builds succeed cleanly.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@lsp-indexer/types build` | 0 | ✅ pass | 2700ms |


## Deviations

Initial edits had ambiguous logIndex match between NftSchema and NftIncludeSchema, plus a duplicate PartialNft block at EOF. Both fixed before final verification.

## Known Issues

None.

## Files Created/Modified

- `packages/types/src/common.ts`
- `packages/types/src/nfts.ts`
- `packages/types/src/owned-tokens.ts`


## Deviations
Initial edits had ambiguous logIndex match between NftSchema and NftIncludeSchema, plus a duplicate PartialNft block at EOF. Both fixed before final verification.

## Known Issues
None.
