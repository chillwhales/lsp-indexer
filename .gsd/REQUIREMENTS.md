# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R017 — Lsp4Attribute includes score and rarity fields
- Class: core-capability
- Status: active
- Description: The Lsp4Attribute Zod schema and type must include `score: number | null` and `rarity: number | null` fields, matching the `LSP4MetadataAttribute` entity's `score: Float` and `rarity: Float` columns in the indexer schema.
- Why it matters: The frontend needs attribute-level score and rarity data for NFT trait display and rarity calculations.
- Source: user
- Primary owning slice: M007/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Currently Lsp4AttributeSchema only has {key, value, type}. The Hasura schema already exposes score and rarity as numeric fields on lsp4_metadata_attribute.

### R018 — NFT type includes score and rank from LSP4Metadata derived entities
- Class: core-capability
- Status: active
- Description: The Nft type must include `score: number | null` and `rank: number | null` fields. These come from `LSP4MetadataScore.value` and `LSP4MetadataRank.value` via the NFT's `lsp4Metadata` relation. NftInclude must have `score` and `rank` boolean flags. NftSortField must include `score`.
- Why it matters: NFTs need to be queryable and sortable by rarity score and rank.
- Source: user
- Primary owning slice: M007/S01
- Supporting slices: none
- Validation: unmapped
- Notes: LSP4MetadataScore and LSP4MetadataRank are @derivedFrom(field: "lsp4Metadata") on LSP4Metadata. Each has a single `value: Int` field. The Hasura schema exposes these as `lsp4_metadata_score` and `lsp4_metadata_rank` object relationships on `lsp4_metadata`.

### R019 — NFT type includes chillwhales custom fields
- Class: core-capability
- Status: active
- Description: The Nft type must include `chillClaimed: boolean | null`, `orbsClaimed: boolean | null`, `level: number | null`, `cooldownExpiry: number | null`, `faction: string | null`. These come from dedicated entities (ChillClaimed, OrbsClaimed, OrbLevel, OrbCooldownExpiry, OrbFaction) with @derivedFrom(field: "nft") relations on the NFT entity. NftInclude must have corresponding boolean flags.
- Why it matters: The chillwhales frontend needs game-specific NFT properties for display and interaction logic.
- Source: user
- Primary owning slice: M007/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Each entity has a single `.value` field. Hasura exposes them as object relationships on `nft` (chillClaimed, orbsClaimed, level, cooldownExpiry, faction).

### R020 — NftFilter supports chillwhales custom field filtering
- Class: core-capability
- Status: active
- Description: NftFilter must support `chillClaimed: boolean` (equals), `orbsClaimed: boolean` (equals), `maxLevel: number` (less-than), `cooldownExpiryBefore: number` (less-than-or-equal). These translate to nested Hasura relationship filters on the corresponding derived entities.
- Why it matters: The frontend filters NFTs by claim status, orb level, and cooldown expiry for game mechanics.
- Source: user
- Primary owning slice: M007/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Filter patterns: `chillClaimed: { value: { _eq: X } }`, `level: { value: { _lt: X } }`, `cooldownExpiry: { value: { _lte: X } }`.

### R021 — NftSortField supports score sorting
- Class: core-capability
- Status: active
- Description: NftSortField must include `score` to allow sorting NFTs by their rarity score (LSP4Metadata → LSP4MetadataScore.value).
- Why it matters: The frontend needs to sort collection views by rarity score.
- Source: user
- Primary owning slice: M007/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Sort translates to `{ lsp4Metadata: { score: { value: asc/desc } } }` or similar nested Hasura order_by.

### R022 — getCollectionAttributes server action + useCollectionAttributes hook
- Class: core-capability
- Status: active
- Description: A new query vertical that fetches all distinct {key, value} pairs for a collection address from `lsp4_metadata_attribute`, plus the total NFT count in that collection. Exposed as a `fetchCollectionAttributes` service function, `getCollectionAttributes` Next.js server action, and `useCollectionAttributes` React/Next.js hooks.
- Why it matters: The frontend needs attribute facets to build filter dropdown menus for NFT collections.
- Source: user
- Primary owning slice: M007/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Uses Hasura distinct_on for attribute deduplication. Total count from nft_aggregate where address matches collection.

### R023 — OwnedTokenNftInclude exposes score, rank, and chillwhales custom fields
- Class: core-capability
- Status: active
- Description: When querying owned tokens with `include: { nft: { score: true, rank: true, chillClaimed: true, ... } }`, the nested NFT must include the new custom fields. OwnedTokenNftInclude inherits from NftInclude (minus collection/holder), so the new fields must flow through. The OwnedTokenNftScalarFieldMap and owned-token GraphQL documents must be updated.
- Why it matters: The frontend queries owned tokens with nested NFT data including game properties.
- Source: user
- Primary owning slice: M007/S02
- Supporting slices: none
- Validation: unmapped
- Notes: OwnedTokenNftIncludeSchema is `NftIncludeSchema.omit({ collection: true, holder: true })` — new fields on NftIncludeSchema automatically appear, but the scalar field map and document need manual updates.

### R024 — OwnedAsset holder include returns full profile shape
- Class: quality-attribute
- Status: active
- Description: OwnedAssetInclude.holder with profile sub-include (name, description, tags, profileImage, backgroundImage) must return the correct Profile shape. This should already work via the existing `holder: z.union([z.boolean(), ProfileIncludeSchema])` pattern — needs verification, not new code.
- Why it matters: The frontend shows holder profile data when listing owned assets.
- Source: user
- Primary owning slice: M007/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Quick verification task — confirm the existing wiring works.

### R025 — Full stack propagation for all changes
- Class: quality-attribute
- Status: active
- Description: All type changes must propagate through the full package stack: types (Zod schemas) → node (GraphQL documents, parsers, services, key factories) → react (hook factories) → next (server actions + hooks). The 5-package build must pass cleanly.
- Why it matters: Incomplete propagation creates runtime failures or type mismatches between packages.
- Source: inferred
- Primary owning slice: M007/S04
- Supporting slices: M007/S01, M007/S02, M007/S03
- Validation: unmapped
- Notes: Each slice verifies its own build. S04 does the final full-stack verification.

### R026 — Documentation updated for all changes
- Class: quality-attribute
- Status: active
- Description: Docs pages (apps/docs) must be updated to reflect all new/changed types, hooks, filters, sort fields, and server actions per the AGENTS.md documentation matrix.
- Why it matters: Outdated docs are worse than no docs (per AGENTS.md).
- Source: inferred
- Primary owning slice: M007/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Covers node docs (new types, filters, sort), react docs (domain tables), next docs (new server actions/hooks).

## Validated

### R015 — Safe `supportsInterface` return parsing
- Class: failure-visibility
- Status: validated
- Description: The VERIFY step's `multicallVerify` must handle non-boolean hex values from `supportsInterface` without crashing.
- Why it matters: A rogue contract returning garbage hex crashes the indexer into an infinite restart loop.
- Source: user
- Primary owning slice: M006/S01
- Supporting slices: none
- Validation: safeHexToBool wraps hexToBool in try-catch returning false on error. pnpm --filter=@chillwhales/indexer build passes.
- Notes: All 3 call sites migrated.

### R016 — All `hexToBool` call sites hardened
- Class: quality-attribute
- Status: validated
- Description: Every call site using viem's `hexToBool()` must use the safe helper instead.
- Why it matters: The same crash pattern exists in multiple locations.
- Source: inferred
- Primary owning slice: M006/S01
- Supporting slices: none
- Validation: rg hexToBool shows only 3 matches inside the safe wrapper.
- Notes: All 3 call sites migrated to safeHexToBool.

### R001 — Mutual follows query
- Class: core-capability
- Status: validated
- Description: Given two addresses A and B, return the set of profiles that both A and B follow.
- Why it matters: Core social graph feature.
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: Uses _and where-clause with dual followedBy filters.

### R002 — Mutual followers query
- Class: core-capability
- Status: validated
- Description: Given two addresses A and B, return profiles that follow both A and B.
- Why it matters: Core social graph feature.
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: Uses _and where-clause with dual followed filters.

### R003 — Followed-by-my-follows query
- Class: core-capability
- Status: validated
- Description: Given user's address and a target profile, return profiles from user's following list that also follow the target.
- Why it matters: Social proof in follower lists.
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: Uses myAddress + targetAddress params.

### R004 — React hooks for mutual follow queries
- Class: core-capability
- Status: validated
- Description: React hooks calling Hasura directly via getClientUrl() for all three mutual follow queries.
- Why it matters: Consumer packages must expose hooks for direct browser usage.
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: 6 React hooks exported.

### R005 — Next.js hooks and server actions for mutual follow queries
- Class: core-capability
- Status: validated
- Description: Next.js hooks routing through server actions for all three mutual follow queries.
- Why it matters: Consumer packages must expose hooks for Next.js apps.
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: 3 server actions + 6 Next.js hooks.

### R006 — ProfileInclude type narrowing on mutual follow results
- Class: quality-attribute
- Status: validated
- Description: Returned profiles support the existing ProfileInclude type narrowing.
- Why it matters: Consistency with existing hook API patterns.
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: 3-overload ProfileInclude narrowing on all hooks and server actions.

### R007 — Infinite scroll variants for mutual follow hooks
- Class: core-capability
- Status: validated
- Description: useInfiniteMutualFollows, useInfiniteMutualFollowers, useInfiniteFollowedByMyFollows with offset-based pagination.
- Why it matters: Large result sets need infinite scroll.
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: All 3 infinite scroll variants delivered.

## Deferred

(none)

## Out of Scope

(none)

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R017 | core-capability | active | M007/S01 | none | unmapped |
| R018 | core-capability | active | M007/S01 | none | unmapped |
| R019 | core-capability | active | M007/S01 | none | unmapped |
| R020 | core-capability | active | M007/S02 | none | unmapped |
| R021 | core-capability | active | M007/S01 | none | unmapped |
| R022 | core-capability | active | M007/S03 | none | unmapped |
| R023 | core-capability | active | M007/S02 | none | unmapped |
| R024 | quality-attribute | active | M007/S01 | none | unmapped |
| R025 | quality-attribute | active | M007/S04 | M007/S01, S02, S03 | unmapped |
| R026 | quality-attribute | active | M007/S04 | none | unmapped |
| R015 | failure-visibility | validated | M006/S01 | none | validated |
| R016 | quality-attribute | validated | M006/S01 | none | validated |
| R001 | core-capability | validated | M004/S01 | none | validated |
| R002 | core-capability | validated | M004/S01 | none | validated |
| R003 | core-capability | validated | M004/S01 | none | validated |
| R004 | core-capability | validated | M004/S01 | none | validated |
| R005 | core-capability | validated | M004/S01 | none | validated |
| R006 | quality-attribute | validated | M004/S01 | none | validated |
| R007 | core-capability | validated | M004/S01 | none | validated |

## Coverage Summary

- Active requirements: 10
- Mapped to slices: 10
- Validated: 9
- Unmapped active requirements: 0
