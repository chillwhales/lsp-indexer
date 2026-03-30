---
id: T01
parent: S02
milestone: M007
provides: []
requires: []
affects: []
key_files: ["packages/types/src/nfts.ts", "packages/node/src/services/nfts.ts"]
key_decisions: ["Boolean filters (chillClaimed, orbsClaimed) use _eq; numeric filters (maxLevel, cooldownExpiryBefore) use _lte — matches Hasura relationship value types"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "pnpm --filter=@lsp-indexer/types build exits 0, pnpm --filter=@lsp-indexer/node build exits 0, pnpm build exits 0 (all 9 workspace projects)"
completed_at: 2026-03-30T11:07:57.617Z
blocker_discovered: false
---

# T01: Added chillClaimed, orbsClaimed, maxLevel, and cooldownExpiryBefore filter fields to NftFilterSchema and wired corresponding Hasura relationship conditions in buildNftWhere

> Added chillClaimed, orbsClaimed, maxLevel, and cooldownExpiryBefore filter fields to NftFilterSchema and wired corresponding Hasura relationship conditions in buildNftWhere

## What Happened
---
id: T01
parent: S02
milestone: M007
key_files:
  - packages/types/src/nfts.ts
  - packages/node/src/services/nfts.ts
key_decisions:
  - Boolean filters (chillClaimed, orbsClaimed) use _eq; numeric filters (maxLevel, cooldownExpiryBefore) use _lte — matches Hasura relationship value types
duration: ""
verification_result: passed
completed_at: 2026-03-30T11:07:57.617Z
blocker_discovered: false
---

# T01: Added chillClaimed, orbsClaimed, maxLevel, and cooldownExpiryBefore filter fields to NftFilterSchema and wired corresponding Hasura relationship conditions in buildNftWhere

**Added chillClaimed, orbsClaimed, maxLevel, and cooldownExpiryBefore filter fields to NftFilterSchema and wired corresponding Hasura relationship conditions in buildNftWhere**

## What Happened

Added 4 optional fields to NftFilterSchema in the types package and 4 corresponding condition blocks in buildNftWhere in the node services package. Boolean filters use _eq on relationship value fields, numeric filters use _lte. All guards use strict !== undefined to handle false and 0 as valid filter values. Verified Hasura types match: Chill_Claimed_Bool_Exp and Orbs_Claimed_Bool_Exp use Boolean_Comparison_Exp, Orb_Level_Bool_Exp and Orb_Cooldown_Expiry_Bool_Exp use Int_Comparison_Exp.

## Verification

pnpm --filter=@lsp-indexer/types build exits 0, pnpm --filter=@lsp-indexer/node build exits 0, pnpm build exits 0 (all 9 workspace projects)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@lsp-indexer/types build` | 0 | ✅ pass | 2800ms |
| 2 | `pnpm --filter=@lsp-indexer/node build` | 0 | ✅ pass | 3900ms |
| 3 | `pnpm build` | 0 | ✅ pass | 22700ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `packages/types/src/nfts.ts`
- `packages/node/src/services/nfts.ts`


## Deviations
None.

## Known Issues
None.
