---
estimated_steps: 20
estimated_files: 3
skills_used: []
---

# T01: Add chillwhales fields to types package schemas

Extend the types package with all new fields needed by the NFT domain extension.

## Steps

1. In `packages/types/src/common.ts`, add `score: z.number().nullable()` and `rarity: z.number().nullable()` to `Lsp4AttributeSchema`.

2. In `packages/types/src/nfts.ts`:
   - Add 7 new fields to `NftSchema`: `score: z.number().nullable()`, `rank: z.number().nullable()`, `chillClaimed: z.boolean().nullable()`, `orbsClaimed: z.boolean().nullable()`, `level: z.number().nullable()`, `cooldownExpiry: z.number().nullable()`, `faction: z.string().nullable()`
   - Add 7 new boolean entries to `NftIncludeSchema`: `score`, `rank`, `chillClaimed`, `orbsClaimed`, `level`, `cooldownExpiry`, `faction` — all `z.boolean().optional()`
   - Add `'score'` to `NftSortFieldSchema` enum values
   - Add 7 new entries to `NftScalarIncludeFieldMap` type: `score: 'score'`, `rank: 'rank'`, `chillClaimed: 'chillClaimed'`, `orbsClaimed: 'orbsClaimed'`, `level: 'level'`, `cooldownExpiry: 'cooldownExpiry'`, `faction: 'faction'`

3. In `packages/types/src/owned-tokens.ts`:
   - Add 7 new entries to `OwnedTokenNftScalarFieldMap` type: same mapping as `NftScalarIncludeFieldMap` above
   - Note: `OwnedTokenNftIncludeSchema` auto-inherits via `.omit({collection, holder})` from `NftIncludeSchema`, so no changes needed there

4. Verify: `pnpm --filter=@lsp-indexer/types build` exits 0

## Must-Haves

- [ ] `Lsp4AttributeSchema` has `score` and `rarity` fields
- [ ] `NftSchema` has all 7 new nullable fields
- [ ] `NftIncludeSchema` has all 7 new boolean entries
- [ ] `NftSortFieldSchema` includes `'score'`
- [ ] `NftScalarIncludeFieldMap` has 7 new entries
- [ ] `OwnedTokenNftScalarFieldMap` has 7 new entries
- [ ] Types package builds cleanly

## Inputs

- ``packages/types/src/common.ts` — current Lsp4AttributeSchema`
- ``packages/types/src/nfts.ts` — current NftSchema, NftIncludeSchema, NftSortFieldSchema, NftScalarIncludeFieldMap`
- ``packages/types/src/owned-tokens.ts` — current OwnedTokenNftScalarFieldMap`

## Expected Output

- ``packages/types/src/common.ts` — Lsp4AttributeSchema with score/rarity`
- ``packages/types/src/nfts.ts` — NftSchema, NftIncludeSchema, NftSortFieldSchema, NftScalarIncludeFieldMap all extended`
- ``packages/types/src/owned-tokens.ts` — OwnedTokenNftScalarFieldMap extended with 7 entries`

## Verification

pnpm --filter=@lsp-indexer/types build
