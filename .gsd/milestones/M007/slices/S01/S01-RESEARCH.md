# S01: NFT type + include extensions — Research

**Date:** 2026-03-30

## Summary

This slice extends the NFT domain across `types`, `node` (documents, parsers, services, keys), `react`, and `next` to expose chillwhales-specific fields that already exist in Hasura but aren't surfaced by the consumer packages. The work is straightforward application of established patterns — every domain extension before this (profiles, digital assets, encrypted assets) follows the same include/narrowing/filter/sort machinery.

Seven new include fields on NFT: `score`, `rank` (from `lsp4Metadata` relation), `chillClaimed`, `orbsClaimed`, `level`, `cooldownExpiry`, `faction` (direct object relationships on `nft`). One new sort field: `score`. The `Lsp4Attribute` schema gains `score` and `rarity` (numeric fields already on `lsp4_metadata_attribute` in Hasura). Codegen must run after document changes.

## Recommendation

Follow the existing domain-extension pattern exactly. Work bottom-up: types → documents + codegen → parsers → services → keys → react factories/hooks → next actions/hooks. The riskiest step is the GraphQL document changes + codegen — all 3 NFT documents (GetNft, GetNfts, NftSubscription) need identical field additions, and codegen must succeed before the parser can reference the new raw types. Do that first.

## Implementation Landscape

### Key Files

**Types package:**
- `packages/types/src/common.ts` — `Lsp4AttributeSchema` needs `score: z.number().nullable()` and `rarity: z.number().nullable()`
- `packages/types/src/nfts.ts` — `NftSchema` needs 7 new fields; `NftIncludeSchema` needs 7 new boolean entries; `NftSortFieldSchema` needs `'score'`; `NftScalarIncludeFieldMap` needs 7 new entries; `NftFilterSchema` — filter additions are S02 scope, not S01
- `packages/types/src/owned-tokens.ts` — `OwnedTokenNftIncludeSchema` auto-inherits via `.omit({collection, holder})` from `NftIncludeSchema`, so the 7 new fields flow through automatically. `OwnedTokenNftScalarFieldMap` type needs 7 new entries manually.

**Node package — documents:**
- `packages/node/src/documents/nfts.ts` — All 3 documents (GetNft, GetNfts, NftSubscription) need:
  - 7 new `$include*` boolean variables (`$includeScore`, `$includeRank`, `$includeChillClaimed`, `$includeOrbsClaimed`, `$includeLevel`, `$includeCooldownExpiry`, `$includeFaction`)
  - In the NFT selection set: `chillClaimed @include(if: $includeChillClaimed) { value }`, same pattern for all 7
  - Score/rank traverse `lsp4Metadata`: already selected unconditionally — add `score @include(if: $includeScore) { value }` and `rank @include(if: $includeRank) { value }` inside the existing `lsp4Metadata { ... }` block. Also add to `lsp4MetadataBaseUri` block for baseUri fallback.
  - The `attributes` sub-selection in `lsp4Metadata` and `lsp4MetadataBaseUri` needs `score` and `rarity` added
- `packages/node/src/documents/owned-tokens.ts` — The nft sub-selection needs 7 new `$includeNft*` variables and corresponding field selections. Score/rank go inside the nft's lsp4Metadata/lsp4MetadataBaseUri blocks. The 5 direct relations (chillClaimed, orbsClaimed, level, cooldownExpiry, faction) go directly on the nft selection.

**Node package — parsers:**
- `packages/node/src/parsers/nfts.ts` — `parseNft` needs to extract the 7 new fields from raw Hasura data. Score/rank: `direct?.score?.value ?? baseUri?.score?.value ?? null`. Direct relations: `raw.chillClaimed?.value ?? null`.
- `packages/node/src/parsers/utils.ts` — `parseAttributes` needs to include `score` and `rarity` from the raw attribute.

**Node package — services:**
- `packages/node/src/services/nfts.ts` — `buildIncludeVars` needs 7 new entries. `buildNftOrderBy` needs a `'score'` case that returns `[{ lsp4Metadata: { score: { value: orderDir(...) } } }, ...buildBlockOrderSort('desc')]`. `buildNftIncludeVars` (owned-token prefix) needs 7 new `includeNft*` entries.

**Node package — keys:**
- `packages/node/src/keys/nfts.ts` — No structural changes needed (include is already in the key objects). Type changes flow through automatically.

**React + Next packages:**
- React hook factories (`create-use-nft.ts`, `create-use-nfts.ts`, `create-use-infinite-nfts.ts`, `create-use-nft-subscription.ts`) — No code changes needed. They're generic over `NftInclude` and delegate to node services.
- React owned-token factories — No code changes, type flows through `OwnedTokenNftInclude`.
- Next.js actions/hooks for NFTs — No code changes needed. They pass `include` through to node services.

### Hasura Schema Relationships

Each chillwhales entity is an **object relationship** on `nft` (not array), each with a `value` field:

| Relation name | Hasura type | `value` field type | Consumer field name |
|---|---|---|---|
| `chillClaimed` | `chill_claimed` | `Boolean!` | `chillClaimed: boolean \| null` |
| `orbsClaimed` | `orbs_claimed` | `Boolean!` | `orbsClaimed: boolean \| null` |
| `level` | `orb_level` | `Int!` | `level: number \| null` |
| `cooldownExpiry` | `orb_cooldown_expiry` | `Int!` | `cooldownExpiry: number \| null` |
| `faction` | `orb_faction` | `String!` | `faction: string \| null` |

Score/rank live on `lsp4_metadata` (not directly on `nft`):

| Relation path | `value` type | Consumer field |
|---|---|---|
| `nft.lsp4Metadata.score` | `lsp4_metadata_score.value: Int` | `score: number \| null` |
| `nft.lsp4Metadata.rank` | `lsp4_metadata_rank.value: Int` | `rank: number \| null` |

### Build Order

1. **Types first** — Add fields to `Lsp4AttributeSchema`, `NftSchema`, `NftIncludeSchema`, `NftSortFieldSchema`, scalar field maps. This is the foundation everything else depends on.
2. **Documents + codegen** — Add `@include` variables and field selections to all 3 NFT documents + owned-token nft sub-selection. Run `pnpm --filter=@lsp-indexer/node codegen` to regenerate `graphql.ts`. This is the riskiest step — if documents have syntax errors, codegen fails and blocks all downstream work.
3. **Parsers** — Update `parseNft` to extract new fields, `parseAttributes` to include score/rarity.
4. **Services** — Update `buildIncludeVars`, `buildNftOrderBy`, `buildNftIncludeVars`.
5. **Build verification** — `pnpm build` across all 5 packages.

### Verification Approach

1. `pnpm --filter=@lsp-indexer/types build` — types compile
2. `pnpm --filter=@lsp-indexer/node codegen` — codegen succeeds with new documents
3. `pnpm --filter=@lsp-indexer/node build` — parsers + services compile against codegen output
4. `pnpm --filter=@lsp-indexer/react build` — hooks compile with new include types
5. `pnpm --filter=@lsp-indexer/next build` — actions + hooks compile
6. `pnpm build` — full 5-package build clean

## Constraints

- Score/rank are on `lsp4Metadata`, not directly on NFT — must traverse `lsp4Metadata.score.value` and provide `lsp4MetadataBaseUri.score.value` as fallback
- Codegen must run after document changes — `pnpm --filter=@lsp-indexer/node codegen` — before parsers/services can reference new raw types
- `OwnedTokenNftIncludeSchema` is derived via `.omit()` from `NftIncludeSchema` — new include fields auto-propagate, but `OwnedTokenNftScalarFieldMap` type is manual and must be updated
- All 3 NFT documents (query, list query, subscription) must stay in sync — identical field selections
- `lsp4Metadata` block is already unconditionally fetched in all 3 documents — score/rank selections go inside it, gated by their own `@include` directives

## Common Pitfalls

- **Forgetting `lsp4MetadataBaseUri` fallback for score/rank** — both `lsp4Metadata` and `lsp4MetadataBaseUri` blocks need score/rank selections. The parser uses `direct?.score?.value ?? baseUri?.score?.value ?? null` pattern (same as name, description, etc.).
- **Missing `includeNft*` vars in owned-token documents** — the owned-token NFT sub-selection uses a different variable prefix (`$includeNft*` not `$include*`). New fields need both prefixes.
- **Attribute score/rarity parsing** — `parseAttributes` currently maps `{key, value, type}`. After adding score/rarity, it needs to also map `score: a.score ?? null` and `rarity: a.rarity ?? null`. The raw codegen type will include these fields after codegen.
- **Score sort path** — Sorting by score requires `{ lsp4Metadata: { score: { value: asc/desc } } }` in the order_by. This is a nested object path, not a flat column. The `orderDir` helper returns `{direction, nulls_last?}` which slots in at the leaf `value` position.
