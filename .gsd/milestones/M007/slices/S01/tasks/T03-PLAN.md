---
estimated_steps: 35
estimated_files: 3
skills_used: []
---

# T03: Extend owned-token documents and verify full 5-package build

Add the 7 new NFT fields to the owned-token document's NFT sub-selection, update the owned-token service include-var builder, and verify the full 5-package build.

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

## Inputs

- ``packages/node/src/documents/owned-tokens.ts` — current owned-token documents`
- ``packages/node/src/services/nfts.ts` — updated buildNftIncludeVars from T02`
- ``packages/types/src/owned-tokens.ts` — updated OwnedTokenNftScalarFieldMap from T01`

## Expected Output

- ``packages/node/src/documents/owned-tokens.ts` — both documents extended with 7 new includeNft* fields`
- ``packages/node/src/services/nfts.ts` — buildNftIncludeVars extended with 7 new entries`
- ``packages/node/src/graphql/graphql.ts` — regenerated with owned-token document changes`

## Verification

pnpm --filter=@lsp-indexer/node codegen && pnpm build
