# S02: NftFilter + OwnedToken propagation — Research

**Date:** 2026-03-30
**Depth:** Light

## Summary

S02 adds 4 filter fields to `NftFilterSchema` (chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore) and wires them into `buildNftWhere` using the existing nested-relationship filter pattern. The "OwnedToken propagation" aspect is largely a verification task — S01 already extended `parseNft` with all 7 chillwhales fields and OwnedToken documents with `$includeNft*` variables, so the nested NFT include narrowing works automatically.

This is straightforward application of the established filter pattern visible in `buildNftWhere` (8 existing conditions) and `buildOwnedTokenWhere` (6 existing conditions). No new GraphQL documents needed — filters use the existing `nft_bool_exp` type which already has `chillClaimed`, `orbsClaimed`, `level`, `cooldownExpiry`, `faction` as relationship filter entries.

## Recommendation

Two tasks:
1. **Types + node filter implementation** — add 4 filter fields to `NftFilterSchema`, add 4 conditions to `buildNftWhere`. Single task because the types change and the service change are tightly coupled and trivial.
2. **OwnedToken propagation verification** — verify that `getOwnedTokens({ include: { nft: { score: true, chillClaimed: true } } })` compiles and type-narrows correctly. This is a build verification task, not a code change task — S01 already did the implementation work.

## Implementation Landscape

### Key Files

- `packages/types/src/nfts.ts` — `NftFilterSchema` (line ~98): add 4 new optional fields. `chillClaimed: z.boolean().optional()`, `orbsClaimed: z.boolean().optional()`, `maxLevel: z.number().optional()`, `cooldownExpiryBefore: z.number().optional()`.
- `packages/node/src/services/nfts.ts` — `buildNftWhere` (line ~23): add 4 new condition blocks using nested relationship `bool_exp` pattern.
- `packages/types/src/owned-tokens.ts` — No changes needed. `OwnedTokenNftIncludeSchema` already inherits from `NftIncludeSchema.omit({collection, holder})` and `OwnedTokenNftScalarFieldMap` was updated in S01.
- `packages/node/src/parsers/owned-tokens.ts` — No changes needed. `parseOwnedToken` delegates to `parseNft` which was updated in S01.

### Filter → Hasura Mapping

Each new filter maps to a nested relationship condition in `Nft_Bool_Exp`:

| Filter field | Hasura path | Comparison |
|---|---|---|
| `chillClaimed` | `{ chillClaimed: { value: { _eq: boolean } } }` | `Boolean_comparison_exp` |
| `orbsClaimed` | `{ orbsClaimed: { value: { _eq: boolean } } }` | `Boolean_comparison_exp` |
| `maxLevel` | `{ level: { value: { _lte: number } } }` | `Int_comparison_exp` |
| `cooldownExpiryBefore` | `{ cooldownExpiry: { value: { _lte: number } } }` | `Int_comparison_exp` |

Note: `maxLevel` uses `_lte` (less than or equal) semantics — "NFTs at or below this level". `cooldownExpiryBefore` uses `_lte` — "NFTs whose cooldown expires before this timestamp".

### Build Order

1. Add filter fields to types → build types
2. Add filter conditions to `buildNftWhere` → build node
3. Verify full `pnpm build` passes (all 9 projects including react, next, docs)
4. Verify OwnedToken include narrowing with new NFT fields compiles correctly

### Verification Approach

- `pnpm --filter=@lsp-indexer/types build` — types compile with new filter fields
- `pnpm --filter=@lsp-indexer/node build` — node compiles with new `buildNftWhere` conditions
- `pnpm build` — full 5-package build passes (types, node, react, next, docs)
- No codegen needed — no GraphQL document changes, only service-layer filter logic

## Constraints

- `Nft_Bool_Exp` is codegen-generated in `packages/node/src/graphql/graphql.ts` — the relationship filter fields (`chillClaimed`, `orbsClaimed`, `level`, `cooldownExpiry`) are already present from S01's codegen run. No new codegen needed.
- Filter fields use `undefined` check (`if (filter.chillClaimed !== undefined)`) not truthiness check, since `false` is a valid filter value for boolean fields.
