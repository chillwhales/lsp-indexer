# M007: Chillwhales NFT Extensions

**Gathered:** 2026-03-30
**Status:** Ready for planning

## Project Description

Extend the `@lsp-indexer` package stack (types → node → react → next) to expose chillwhales-specific NFT data that the indexer already tracks in Hasura but the consumer packages don't surface yet. The chillwhales frontend is migrating from raw GraphQL/Hasura queries to `@lsp-indexer/next` server actions and hooks, and needs these fields exposed through the type-safe include/narrowing pattern.

## Why This Milestone

The indexer schema (`packages/typeorm/schema.graphql`) already has all the entities — `ChillClaimed`, `OrbsClaimed`, `OrbLevel`, `OrbCooldownExpiry`, `OrbFaction`, `LSP4MetadataScore`, `LSP4MetadataRank`, and `LSP4MetadataAttribute.score`/`rarity`. The Hasura schema (`packages/node/schema.graphql`) confirms these are exposed as object relationships on the `nft` and `lsp4_metadata` types. The consumer packages just don't query or expose them yet.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Call `getNfts({ include: { score: true, rank: true, chillClaimed: true, faction: true } })` and get type-narrowed results with those fields
- Call `getNfts({ filter: { chillClaimed: false, maxLevel: 5 } })` to filter NFTs by game properties
- Call `getNfts({ sort: { field: 'score', direction: 'desc' } })` to sort by rarity score
- Call `getCollectionAttributes({ collectionAddress: '0x...' })` to get distinct attribute facets for filter dropdowns
- Call `getOwnedTokens({ include: { nft: { score: true, chillClaimed: true } } })` to get nested NFT custom fields
- Use `useCollectionAttributes`, `useNfts`, `useOwnedTokens` hooks with the new fields

### Entry point / environment

- Entry point: `@lsp-indexer/next` server actions + hooks, `@lsp-indexer/react` hooks, `@lsp-indexer/node` services
- Environment: Any Next.js or React app consuming the packages
- Live dependencies involved: Hasura GraphQL endpoint (already deployed and exposing these entities)

## Completion Class

- Contract complete means: All 5 packages build cleanly, type narrowing works correctly with new include fields, filter builders produce correct Hasura where-clauses
- Integration complete means: GraphQL documents fetch the correct nested relations from Hasura
- Operational complete means: none (no new runtime services)

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- `pnpm build` passes across all packages with zero type errors
- New NFT include fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction) are queryable and type-narrow correctly
- New filter fields produce correct nested Hasura relationship filters
- Collection attributes query returns distinct {key, value} pairs
- OwnedToken nested NFT includes expose all new custom fields
- OwnedAsset holder include returns full profile shape (verification only)

## Risks and Unknowns

- GraphQL codegen must include the chillwhales entity types — confirmed present in `packages/node/schema.graphql` (chill_claimed, orbs_claimed, orb_level, orb_cooldown_expiry, orb_faction, lsp4_metadata_score, lsp4_metadata_rank)
- Score/rank live on `lsp4Metadata`, not directly on NFT — the GraphQL documents need to traverse `lsp4Metadata.score.value` and `lsp4Metadata.rank.value`, and also `lsp4MetadataBaseUri.score.value` / `lsp4MetadataBaseUri.rank.value` for baseUri fallback
- The `distinct_on` parameter for collection attributes query needs careful handling — Hasura supports `distinct_on` for `lsp4_metadata_attribute` with `Lsp4_Metadata_Attribute_Select_Column`

## Existing Codebase / Prior Art

- `packages/types/src/common.ts` — `Lsp4AttributeSchema` currently `{key, value, type}`, needs score/rarity
- `packages/types/src/nfts.ts` — `NftSchema`, `NftIncludeSchema`, `NftFilterSchema`, `NftSortFieldSchema`, `NftResult` with scalar field map and relation resolvers
- `packages/types/src/owned-tokens.ts` — `OwnedTokenNftIncludeSchema = NftIncludeSchema.omit({collection, holder})`, `OwnedTokenNftScalarFieldMap`
- `packages/node/src/documents/nfts.ts` — GraphQL query/subscription documents with `@include` directives
- `packages/node/src/parsers/nfts.ts` — `parseNft` with `stripExcluded`, `parseAttributes` in utils.ts
- `packages/node/src/services/nfts.ts` — `buildNftWhere`, `buildNftOrderBy`, `buildIncludeVars`, `buildNftIncludeVars`, `fetchNft`, `fetchNfts`
- `packages/node/src/documents/owned-tokens.ts` — OwnedToken documents with nested NFT sub-selection
- `packages/node/schema.graphql` — Hasura introspected schema confirming all entity types exist

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R017 — Lsp4Attribute score/rarity fields
- R018 — NFT score/rank include + type
- R019 — NFT chillwhales custom fields
- R020 — NftFilter custom field filtering
- R021 — NftSortField score sorting
- R022 — Collection attributes query vertical
- R023 — OwnedTokenNftInclude custom fields
- R024 — OwnedAsset holder profile verification
- R025 — Full stack propagation
- R026 — Documentation updates

## Scope

### In Scope

- Extend Lsp4Attribute with score/rarity
- Add score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction to Nft type + include
- Add score to NftSortField
- Add chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore to NftFilter
- New collection attributes vertical (document → service → key → action → hook)
- Propagate new NFT fields to OwnedTokenNftInclude
- Verify OwnedAsset holder profile fields
- Update docs for all changes
- Run codegen after document changes

### Out of Scope / Non-Goals

- Indexer pipeline changes (entities already exist and are populated)
- New Hasura schema changes (all relations already tracked)
- React hook factories for collection attributes (Next.js server action + hook sufficient per user spec)
- Playground page for new fields (existing playground already covers NFT domain)

## Technical Constraints

- GraphQL documents use `@include(if: $booleanVar)` pattern for conditional field selection
- Codegen must be re-run (`pnpm --filter=@lsp-indexer/node codegen`) after any document changes to regenerate `graphql.ts` types
- The `parseNft` parser uses `stripExcluded` with a scalar field map — new scalar fields must be added to the map
- `OwnedTokenNftIncludeSchema` is derived via `.omit()` from `NftIncludeSchema` — new fields auto-inherit but the scalar field map type is manual
- Score/rank are on `lsp4Metadata` (a relation on NFT), not direct NFT fields — need to traverse `nft.lsp4Metadata.score.value`

## Integration Points

- Hasura GraphQL — all new fields are already exposed in the Hasura schema; this milestone only adds client-side querying
- GraphQL codegen pipeline — documents → codegen → typed operations → parsers → services

## Open Questions

- Whether score sort should traverse `lsp4Metadata.score.value` or `lsp4MetadataBaseUri.score.value` for baseUri fallback — likely direct metadata only since score/rank are collection-level, not baseUri-level. Will confirm during implementation.
