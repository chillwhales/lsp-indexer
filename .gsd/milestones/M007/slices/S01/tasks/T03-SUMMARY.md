---
id: T03
parent: S01
milestone: M007
provides: []
requires: []
affects: []
key_files: ["packages/node/src/documents/owned-tokens.ts", "packages/node/src/graphql/graphql.ts"]
key_decisions: ["buildNftIncludeVars already had 7 entries from T02 — no service changes needed in T03"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "pnpm --filter=@lsp-indexer/node codegen (exit 0) and pnpm build (exit 0) across all 9 workspace projects."
completed_at: 2026-03-30T11:01:13.856Z
blocker_discovered: false
---

# T03: Added 7 includeNft* variables and field selections (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction) to all 3 owned-token GraphQL documents; codegen and full 5-package build pass

> Added 7 includeNft* variables and field selections (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction) to all 3 owned-token GraphQL documents; codegen and full 5-package build pass

## What Happened
---
id: T03
parent: S01
milestone: M007
key_files:
  - packages/node/src/documents/owned-tokens.ts
  - packages/node/src/graphql/graphql.ts
key_decisions:
  - buildNftIncludeVars already had 7 entries from T02 — no service changes needed in T03
duration: ""
verification_result: passed
completed_at: 2026-03-30T11:01:13.856Z
blocker_discovered: false
---

# T03: Added 7 includeNft* variables and field selections (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction) to all 3 owned-token GraphQL documents; codegen and full 5-package build pass

**Added 7 includeNft* variables and field selections (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction) to all 3 owned-token GraphQL documents; codegen and full 5-package build pass**

## What Happened

Extended all three owned-token documents (GetOwnedToken, GetOwnedTokens, OwnedTokenSubscription) with 7 new chillwhales NFT fields. Added variable declarations, score/rank in both metadata blocks, score/rarity in attributes, and 5 direct relations at NFT level. Confirmed buildNftIncludeVars already had entries from T02. Codegen and full pnpm build pass across all packages.

## Verification

pnpm --filter=@lsp-indexer/node codegen (exit 0) and pnpm build (exit 0) across all 9 workspace projects.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@lsp-indexer/node codegen` | 0 | ✅ pass | 3500ms |
| 2 | `pnpm build` | 0 | ✅ pass | 23000ms |


## Deviations

Task plan step 2 (update buildNftIncludeVars) was already done in T02 — no service file changes needed.

## Known Issues

None.

## Files Created/Modified

- `packages/node/src/documents/owned-tokens.ts`
- `packages/node/src/graphql/graphql.ts`


## Deviations
Task plan step 2 (update buildNftIncludeVars) was already done in T02 — no service file changes needed.

## Known Issues
None.
