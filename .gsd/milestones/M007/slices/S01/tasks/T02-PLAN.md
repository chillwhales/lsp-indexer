---
estimated_steps: 36
estimated_files: 5
skills_used: []
---

# T02: Add fields to NFT documents, run codegen, update parsers and services

Extend the 3 NFT GraphQL documents with new @include variables and field selections, run codegen, then update parsers and services to handle the new fields.

## Steps

1. In `packages/node/src/documents/nfts.ts`, for ALL THREE documents (GetNft, GetNfts, NftSubscription):
   - Add 7 new variable declarations: `$includeScore: Boolean! = true`, `$includeRank: Boolean! = true`, `$includeChillClaimed: Boolean! = true`, `$includeOrbsClaimed: Boolean! = true`, `$includeLevel: Boolean! = true`, `$includeCooldownExpiry: Boolean! = true`, `$includeFaction: Boolean! = true`
   - Inside the `lsp4Metadata { ... }` block, add: `score @include(if: $includeScore) { value }` and `rank @include(if: $includeRank) { value }`
   - Inside the `lsp4MetadataBaseUri { ... }` block, add the same score/rank selections
   - Inside the `attributes` sub-selection in BOTH lsp4Metadata and lsp4MetadataBaseUri, add `score` and `rarity` fields
   - At the NFT selection level (same level as `address`, `token_id`), add 5 direct relation selections:
     ```
     chillClaimed @include(if: $includeChillClaimed) { value }
     orbsClaimed @include(if: $includeOrbsClaimed) { value }
     level @include(if: $includeLevel) { value }
     cooldownExpiry @include(if: $includeCooldownExpiry) { value }
     faction @include(if: $includeFaction) { value }
     ```

2. Run `pnpm --filter=@lsp-indexer/node codegen` — this regenerates `packages/node/src/graphql/graphql.ts` with new raw types. Must succeed before steps 3-4.

3. In `packages/node/src/parsers/utils.ts`, update `parseAttributes` to include `score` and `rarity` from the raw attribute: `score: (a as any).score ?? null, rarity: (a as any).rarity ?? null`. The raw codegen type's attribute now includes these fields after codegen, so the cast is for the function parameter type which is a loose interface. Actually, update the `parseAttributes` parameter type or use the codegen-generated type to include `score?: number | null` and `rarity?: number | null` in the ReadonlyArray element type.

4. In `packages/node/src/parsers/nfts.ts`, update `parseNft` to extract the 7 new fields:
   - Score: `score: direct?.score?.value ?? baseUri?.score?.value ?? null`
   - Rank: `rank: direct?.rank?.value ?? baseUri?.rank?.value ?? null`
   - Direct relations: `chillClaimed: raw.chillClaimed?.value ?? null`, same pattern for orbsClaimed, level, cooldownExpiry, faction

5. In `packages/node/src/services/nfts.ts`:
   - Update `buildIncludeVars` to add 7 new entries: `includeScore: include.score ?? false`, etc.
   - Update `buildNftOrderBy` to handle `'score'` sort field: return `[{ lsp4Metadata: { score: { value: orderDir(sort.direction, sort.nulls) } } }, ...buildBlockOrderSort('desc')]`

6. Verify: `pnpm --filter=@lsp-indexer/node build` exits 0

## Must-Haves

- [ ] All 3 NFT documents have identical new variable declarations and field selections
- [ ] Score/rank are inside both `lsp4Metadata` AND `lsp4MetadataBaseUri` blocks
- [ ] `attributes` in both metadata blocks include `score` and `rarity`
- [ ] 5 direct relations (chillClaimed, orbsClaimed, level, cooldownExpiry, faction) at NFT selection level
- [ ] Codegen succeeds
- [ ] `parseNft` extracts all 7 new fields with correct fallback chain
- [ ] `parseAttributes` returns score/rarity
- [ ] `buildIncludeVars` maps all 7 new fields
- [ ] `buildNftOrderBy` handles score sort with nested lsp4Metadata path
- [ ] Node package builds cleanly

## Inputs

- ``packages/types/src/nfts.ts` — updated NftSchema, NftInclude, NftSortField from T01`
- ``packages/types/src/common.ts` — updated Lsp4AttributeSchema from T01`
- ``packages/node/src/documents/nfts.ts` — current 3 NFT documents`
- ``packages/node/src/parsers/nfts.ts` — current parseNft`
- ``packages/node/src/parsers/utils.ts` — current parseAttributes`
- ``packages/node/src/services/nfts.ts` — current buildIncludeVars, buildNftOrderBy`

## Expected Output

- ``packages/node/src/documents/nfts.ts` — all 3 documents extended with 7 new @include fields`
- ``packages/node/src/graphql/graphql.ts` — regenerated codegen output with new raw types`
- ``packages/node/src/parsers/nfts.ts` — parseNft extracts 7 new fields`
- ``packages/node/src/parsers/utils.ts` — parseAttributes returns score/rarity`
- ``packages/node/src/services/nfts.ts` — buildIncludeVars and buildNftOrderBy updated`

## Verification

pnpm --filter=@lsp-indexer/node codegen && pnpm --filter=@lsp-indexer/node build
