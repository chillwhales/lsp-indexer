# S01: NFT type + include extensions

**Goal:** Extend NFT domain with chillwhales-specific fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction), add score/rarity to Lsp4Attribute, add score sort field — across types, node (documents, codegen, parsers, services), and owned-token propagation. Full 5-package build passes.
**Demo:** After this: After this: fetchNfts returns score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction; Lsp4Attribute includes score/rarity; NFTs sortable by score. Codegen passes, 5-package build passes.

## Tasks
- [x] **T01: Added chillwhales fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction) to NftSchema/NftInclude/NftSortField/NftScalarIncludeFieldMap, score/rarity to Lsp4AttributeSchema, and 7 entries to OwnedTokenNftScalarFieldMap** — Extend the types package with all new fields needed by the NFT domain extension.

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
  - Estimate: 20m
  - Files: packages/types/src/common.ts, packages/types/src/nfts.ts, packages/types/src/owned-tokens.ts
  - Verify: pnpm --filter=@lsp-indexer/types build
- [ ] **T02: Add fields to NFT documents, run codegen, update parsers and services** — Extend the 3 NFT GraphQL documents with new @include variables and field selections, run codegen, then update parsers and services to handle the new fields.

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
  - Estimate: 45m
  - Files: packages/node/src/documents/nfts.ts, packages/node/src/graphql/graphql.ts, packages/node/src/parsers/nfts.ts, packages/node/src/parsers/utils.ts, packages/node/src/services/nfts.ts
  - Verify: pnpm --filter=@lsp-indexer/node codegen && pnpm --filter=@lsp-indexer/node build
- [ ] **T03: Extend owned-token documents and verify full 5-package build** — Add the 7 new NFT fields to the owned-token document's NFT sub-selection, update the owned-token service include-var builder, and verify the full 5-package build.

## Steps

1. In `packages/node/src/documents/owned-tokens.ts`, for BOTH documents (GetOwnedTokens and OwnedTokenSubscription — check which documents exist):
   - Add 7 new variable declarations with `includeNft` prefix: `$includeNftScore: Boolean! = true`, `$includeNftRank: Boolean! = true`, `$includeNftChillClaimed: Boolean! = true`, `$includeNftOrbsClaimed: Boolean! = true`, `$includeNftLevel: Boolean! = true`, `$includeNftCooldownExpiry: Boolean! = true`, `$includeNftFaction: Boolean! = true`
   - Inside the `nft @include(if: $includeNft) { ... }` block:
     - Inside `lsp4Metadata { ... }`: add `score @include(if: $includeNftScore) { value }` and `rank @include(if: $includeNftRank) { value }`
     - Inside `lsp4MetadataBaseUri { ... }`: same score/rank additions
     - Inside `attributes` in both metadata blocks: add `score` and `rarity`
     - At NFT level: add 5 direct relations with `includeNft` prefix vars:
       ```
       chillClaimed @include(if: $includeNftChillClaimed) { value }
       orbsClaimed @include(if: $includeNftOrbsClaimed) { value }
       level @include(if: $includeNftLevel) { value }
       cooldownExpiry @include(if: $includeNftCooldownExpiry) { value }
       faction @include(if: $includeNftFaction) { value }
       ```

2. In `packages/node/src/services/nfts.ts`, update `buildNftIncludeVars` to add 7 new entries:
   ```
   includeNftScore: include.score ?? false,
   includeNftRank: include.rank ?? false,
   includeNftChillClaimed: include.chillClaimed ?? false,
   includeNftOrbsClaimed: include.orbsClaimed ?? false,
   includeNftLevel: include.level ?? false,
   includeNftCooldownExpiry: include.cooldownExpiry ?? false,
   includeNftFaction: include.faction ?? false,
   ```

3. Run `pnpm --filter=@lsp-indexer/node codegen` to regenerate types for owned-token documents.

4. Verify full build: `pnpm build` — must exit 0 across all 5 packages (types, node, react, next, docs).

## Must-Haves

- [ ] Owned-token documents have 7 new `$includeNft*` variables and matching field selections
- [ ] Score/rank inside both lsp4Metadata and lsp4MetadataBaseUri in the NFT sub-selection
- [ ] Attributes include score/rarity in owned-token NFT sub-selection
- [ ] `buildNftIncludeVars` maps all 7 new fields with `includeNft` prefix
- [ ] Codegen succeeds with owned-token document changes
- [ ] `pnpm build` exits 0 across all 5 packages
  - Estimate: 30m
  - Files: packages/node/src/documents/owned-tokens.ts, packages/node/src/services/nfts.ts, packages/node/src/graphql/graphql.ts
  - Verify: pnpm --filter=@lsp-indexer/node codegen && pnpm build
