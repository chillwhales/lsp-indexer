---
id: S02
parent: M007
milestone: M007
provides:
  - NftFilter with chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore fields
  - buildNftWhere conditions for all 4 game-property filters
requires:
  - slice: S01
    provides: NftInclude with chillClaimed/orbsClaimed fields, Hasura relationship types for game properties
affects:
  - S04
key_files:
  - packages/types/src/nfts.ts
  - packages/node/src/services/nfts.ts
key_decisions:
  - Boolean filters (chillClaimed, orbsClaimed) use _eq; numeric filters (maxLevel, cooldownExpiryBefore) use _lte — matches Hasura relationship value types
patterns_established:
  - NFT game-property filters follow nested Hasura relationship condition pattern: { relationshipName: { value: { _eq/_lte: filterValue } } }
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M007/slices/S02/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-30T11:09:43.889Z
blocker_discovered: false
---

# S02: NftFilter + OwnedToken propagation

**Added chillClaimed, orbsClaimed, maxLevel, and cooldownExpiryBefore filter fields to NftFilterSchema with corresponding Hasura relationship conditions in buildNftWhere**

## What Happened

This slice added 4 new optional filter fields to the NFT domain. In the types package, `NftFilterSchema` gained `chillClaimed` (boolean), `orbsClaimed` (boolean), `maxLevel` (number), and `cooldownExpiryBefore` (number) — all optional, matching the existing filter field pattern. In the node services package, `buildNftWhere` gained 4 corresponding condition blocks that map these filters to nested Hasura relationship conditions: boolean filters use `_eq` on the relationship's `value` field, numeric filters use `_lte`. All guards use strict `!== undefined` checks so that `false` and `0` are valid filter values. The full 9-project build passes clean.

## Verification

Full `pnpm build` exits 0 across all 9 workspace projects (types, node, react, next, docs, abi, typeorm, indexer, comparison-tool). Types package compiles with 4 new NftFilterSchema fields. Node package compiles with 4 new buildNftWhere condition blocks. Docs app generates all 22 static pages successfully.

## Requirements Advanced

- R008 — Full 9-project pnpm build passes with zero errors after adding 4 filter fields and 4 where-clause conditions

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

The filter fields map to Hasura relationship names (`chillClaimed`, `orbsClaimed`, `level`, `cooldownExpiry`) as string keys in the where-clause objects. If Hasura schema renames these relationships, queries will silently return empty results — no compile-time protection.

## Follow-ups

None.

## Files Created/Modified

- `packages/types/src/nfts.ts` — Added chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore optional fields to NftFilterSchema
- `packages/node/src/services/nfts.ts` — Added 4 condition blocks in buildNftWhere mapping new filter fields to Hasura relationship conditions
