# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R027 — Package consolidation (abi + typeorm → indexer)
- Class: core-capability
- Status: active
- Description: The `@chillwhales/abi` and `@chillwhales/typeorm` packages must be merged into `@chillwhales/indexer`. ABI codegen (`squid-evm-typegen`) and entity codegen (`squid-typeorm-codegen`) run from within the indexer package. `schema.graphql` moves to `packages/indexer/`. Zero imports of the old package names remain.
- Why it matters: Three packages for one indexer adds unnecessary build complexity and cross-package wiring. Consolidation simplifies the build, removes inter-package dependencies, and makes multi-chain changes atomic.
- Source: user
- Primary owning slice: M008/S01
- Supporting slices: M008/S02
- Validation: unmapped
- Notes: `abi` and `typeorm` have zero consumers outside the indexer package.

### R028 — Chain configuration registry
- Class: core-capability
- Status: active
- Description: All chain-specific constants (SQD gateway, RPC URL, multicall address, IPFS gateway, rate limits, finality confirmation) must be read from a typed chain config registry instead of hardcoded constants. LUKSO mainnet is the default chain config.
- Why it matters: Multi-chain requires per-chain parameterization. Hardcoded LUKSO constants prevent adding new chains.
- Source: user
- Primary owning slice: M009/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Currently hardcoded in `packages/indexer/src/constants/index.ts`.

### R029 — Network discriminator on all entities
- Class: core-capability
- Status: active
- Description: Every TypeORM entity in `schema.graphql` must have a `network: String! @index` column identifying which chain the data came from.
- Why it matters: Enables per-chain filtering and prevents ambiguity when the same event type exists on multiple chains.
- Source: collaborative
- Primary owning slice: M009/S02
- Supporting slices: none
- Validation: unmapped
- Notes: 51 entity types in schema.graphql. Hasura auto-exposes the column as a filterable field.

### R030 — Network-prefixed deterministic IDs
- Class: core-capability
- Status: active
- Description: All deterministic entity IDs (address-based like `event.address`, composite like `generateTokenId()`, string-composite like `"{address} - {dataKey}"`) must include a network prefix (e.g. `lukso:0xabc...`). UUID-based event entity IDs stay as-is.
- Why it matters: Without network-prefixed IDs, the same contract address on two chains produces ID collisions.
- Source: collaborative
- Primary owning slice: M009/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Affected patterns: address-based (UP, DA, LSP4TokenName, etc.), composite (NFT via generateTokenId), string-composite (LSP29, LSP6). UUIDs are already globally unique.

### R031 — Backfill migration for existing LUKSO data
- Class: core-capability
- Status: active
- Description: A non-destructive SQL migration must backfill all existing LUKSO rows: add `network` column with default `'lukso'`, prefix all deterministic IDs with `lukso:`, and update all FK references pointing to those IDs.
- Why it matters: Existing production LUKSO data must be preserved and correctly tagged.
- Source: collaborative
- Primary owning slice: M009/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Must update both ID columns and FK columns that reference them. UUID-based IDs don't need prefixing.

### R032 — Per-chain plugin supportedChains declarations
- Class: core-capability
- Status: active
- Description: Every EventPlugin and EntityHandler must declare a `supportedChains` field listing which chains it applies to. The processor factory only registers plugins/handlers matching the current chain.
- Why it matters: Non-LSP chains don't have LSP-specific events. Plugin filtering prevents registering irrelevant handlers.
- Source: user
- Primary owning slice: M009/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Chillwhales handlers: `supportedChains: ['lukso']`. LSP handlers: `supportedChains: ['lukso', 'lukso-testnet']`. Standard EVM handlers (if added later): broader chain lists.

### R033 — Parameterized processor factory
- Class: core-capability
- Status: active
- Description: A factory function creates an `EvmBatchProcessor` from a chain config, wires it with the filtered plugin/handler set, and runs it. The entry point is parameterized — one binary, multiple chain instances via env vars.
- Why it matters: Avoids duplicating entry point files per chain. Single codebase produces chain-specific processors.
- Source: collaborative
- Primary owning slice: M009/S03
- Supporting slices: none
- Validation: unmapped
- Notes: SQD pattern: separate entry points or env-parameterized single binary. We chose parameterized.

### R034 — Per-chain Docker service definitions
- Class: operability
- Status: active
- Description: `docker-compose.yml` must define separate indexer services per chain, each with chain-specific env vars (gateway, RPC, rate limits), all writing to the shared Postgres instance.
- Why it matters: Production deployment needs per-chain service management, health checks, and resource limits.
- Source: collaborative
- Primary owning slice: M009/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Each service runs the same image with different CHAIN env var.

### R035 — LUKSO testnet as second chain proof
- Class: integration
- Status: active
- Description: The LUKSO testnet must run as a second processor alongside mainnet, writing to the same Postgres. Both chains' data must be queryable via Hasura with `network` filter.
- Why it matters: Proves multi-chain works end-to-end with same ABIs before tackling non-LSP chains.
- Source: user
- Primary owning slice: M009/S05
- Supporting slices: none
- Validation: unmapped
- Notes: LUKSO testnet uses same LSP ABIs, different RPC/gateway URLs.

### R036 — LUKSO parity — zero regressions after refactor
- Class: constraint
- Status: active
- Description: The LUKSO mainnet indexer must produce identical behavior after every refactor milestone. Build succeeds, processor starts, events are decoded correctly, entities persist with correct data.
- Why it matters: User's top priority — LUKSO parity is non-negotiable.
- Source: user
- Primary owning slice: M008, M009
- Supporting slices: all slices in M008 and M009
- Validation: unmapped
- Notes: Cross-cutting constraint verified at every slice boundary.

### R037 — Network filter on all consumer filter types
- Class: core-capability
- Status: active
- Description: Every Zod filter schema in `@lsp-indexer/types` must include an optional `network: string` field. All GraphQL documents in `@lsp-indexer/node` must pass the network variable to Hasura where-clauses.
- Why it matters: Consumer packages must support per-chain and cross-chain queries.
- Source: collaborative
- Primary owning slice: M010/S01
- Supporting slices: none
- Validation: unmapped
- Notes: 13 filter types, 13 GraphQL documents.

### R038 — Network-aware React hooks
- Class: core-capability
- Status: active
- Description: All React hooks in `@lsp-indexer/react` must accept optional `network` param via filter, propagate it to queries. Omitting network returns all chains.
- Why it matters: Frontend apps need to scope queries by chain.
- Source: collaborative
- Primary owning slice: M010/S02
- Supporting slices: none
- Validation: unmapped
- Notes: 161 React hook files.

### R039 — Network-aware Next.js server actions + hooks
- Class: core-capability
- Status: active
- Description: All Next.js server actions and hooks in `@lsp-indexer/next` must pass network through from caller to Hasura query.
- Why it matters: Next.js apps need chain-scoped data fetching.
- Source: collaborative
- Primary owning slice: M010/S03
- Supporting slices: none
- Validation: unmapped
- Notes: 75 Next.js action/hook files.

### R040 — Consumer package docs updated for network param
- Class: quality-attribute
- Status: active
- Description: All docs pages in `apps/docs` must document the new `network` parameter on filter types, hooks, and server actions.
- Why it matters: Docs must reflect the API surface.
- Source: inferred
- Primary owning slice: M010/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Per AGENTS.md: outdated docs are worse than no docs.

## Validated

### R017 — Lsp4Attribute includes score and rarity fields
- Class: core-capability
- Status: validated
- Description: The Lsp4Attribute Zod schema and type must include `score: number | null` and `rarity: number | null` fields.
- Why it matters: NFT trait display and rarity calculations.
- Source: user
- Primary owning slice: M007/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M007.

### R018 — NFT type includes score and rank from LSP4Metadata derived entities
- Class: core-capability
- Status: validated
- Description: Nft type includes `score` and `rank` fields, NftSortField includes `score`.
- Why it matters: NFTs queryable and sortable by rarity.
- Source: user
- Primary owning slice: M007/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M007.

### R019 — NFT type includes chillwhales custom fields
- Class: core-capability
- Status: validated
- Description: Nft type includes chillClaimed, orbsClaimed, level, cooldownExpiry, faction.
- Why it matters: Game-specific NFT properties for display and interaction.
- Source: user
- Primary owning slice: M007/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M007.

### R020 — NftFilter supports chillwhales custom field filtering
- Class: core-capability
- Status: validated
- Description: NftFilter supports chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore.
- Why it matters: Frontend filters NFTs by game mechanics.
- Source: user
- Primary owning slice: M007/S02
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M007.

### R021 — NftSortField supports score sorting
- Class: core-capability
- Status: validated
- Description: NftSortField includes `score`.
- Why it matters: Sort collection views by rarity score.
- Source: user
- Primary owning slice: M007/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M007.

### R022 — getCollectionAttributes server action + useCollectionAttributes hook
- Class: core-capability
- Status: validated
- Description: Query vertical for distinct {key, value} pairs per collection + total NFT count.
- Why it matters: Attribute facets for filter dropdowns.
- Source: user
- Primary owning slice: M007/S03
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M007.

### R023 — OwnedTokenNftInclude exposes score, rank, and chillwhales custom fields
- Class: core-capability
- Status: validated
- Description: Nested NFT in owned token queries includes new custom fields.
- Why it matters: Frontend queries owned tokens with game properties.
- Source: user
- Primary owning slice: M007/S02
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M007.

### R024 — OwnedAsset holder include returns full profile shape
- Class: quality-attribute
- Status: validated
- Description: OwnedAssetInclude.holder with profile sub-include returns correct shape.
- Why it matters: Frontend shows holder profile data.
- Source: user
- Primary owning slice: M007/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M007.

### R025 — Full stack propagation for all changes
- Class: quality-attribute
- Status: validated
- Description: All type changes propagate through full package stack.
- Why it matters: Incomplete propagation creates runtime failures.
- Source: inferred
- Primary owning slice: M007/S04
- Supporting slices: M007/S01, S02, S03
- Validation: validated
- Notes: Delivered in M007.

### R026 — Documentation updated for all changes
- Class: quality-attribute
- Status: validated
- Description: Docs pages updated for all M007 changes.
- Why it matters: Docs must reflect reality.
- Source: inferred
- Primary owning slice: M007/S04
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M007.

### R015 — Safe `supportsInterface` return parsing
- Class: failure-visibility
- Status: validated
- Description: safeHexToBool wraps hexToBool with error handling.
- Why it matters: Prevents pipeline crash on rogue contracts.
- Source: user
- Primary owning slice: M006/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M006.

### R016 — All `hexToBool` call sites hardened
- Class: quality-attribute
- Status: validated
- Description: All hexToBool call sites use safe wrapper.
- Why it matters: Consistent crash prevention.
- Source: inferred
- Primary owning slice: M006/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M006.

### R001 — Mutual follows query
- Class: core-capability
- Status: validated
- Description: Given two addresses, return profiles both follow.
- Why it matters: Core social graph feature.
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M004.

### R002 — Mutual followers query
- Class: core-capability
- Status: validated
- Description: Given two addresses, return profiles that follow both.
- Why it matters: Core social graph feature.
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M004.

### R003 — Followed-by-my-follows query
- Class: core-capability
- Status: validated
- Description: Return profiles from user's following that also follow a target.
- Why it matters: Social proof in follower lists.
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M004.

### R004 — React hooks for mutual follow queries
- Class: core-capability
- Status: validated
- Description: React hooks for all three mutual follow queries.
- Why it matters: Consumer packages expose hooks for browser usage.
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M004.

### R005 — Next.js hooks and server actions for mutual follow queries
- Class: core-capability
- Status: validated
- Description: Next.js hooks routing through server actions.
- Why it matters: Next.js app support.
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M004.

### R006 — ProfileInclude type narrowing on mutual follow results
- Class: quality-attribute
- Status: validated
- Description: Returned profiles support ProfileInclude type narrowing.
- Why it matters: Consistency with existing API patterns.
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M004.

### R007 — Infinite scroll variants for mutual follow hooks
- Class: core-capability
- Status: validated
- Description: Infinite scroll hooks for all three mutual follow queries.
- Why it matters: Large result sets need pagination.
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: validated
- Notes: Delivered in M004.

## Deferred

### R041 — Non-LSP chain plugin authoring (e.g. ERC-20 events)
- Class: core-capability
- Status: deferred
- Description: Author event plugins for standard EVM events (ERC-20 Transfer, ERC-721 Transfer, ERC-1155 TransferSingle/Batch) for non-LSP chains.
- Why it matters: Multi-chain only indexes LSP events until non-LSP plugins are authored.
- Source: collaborative
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred — LUKSO testnet proof uses same LSP ABIs. Non-LSP plugin work happens when onboarding a non-LSP chain.

### R042 — Per-chain rate limit configuration
- Class: operability
- Status: deferred
- Description: Each chain config should support independent RPC rate limits.
- Why it matters: Different RPC providers have different rate limit thresholds.
- Source: collaborative
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred — LUKSO testnet likely shares same rate limit profile. Becomes important with heterogeneous chains.

### R043 — Per-chain IPFS gateway configuration
- Class: operability
- Status: deferred
- Description: Each chain config should support a chain-specific IPFS gateway URL.
- Why it matters: LUKSO uses universalprofile.cloud IPFS gateway; other chains may use different gateways.
- Source: collaborative
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred — LUKSO testnet uses same IPFS gateway.

## Out of Scope

### R044 — Cross-chain aggregate Hasura views
- Class: anti-feature
- Status: out-of-scope
- Description: Custom Hasura views that aggregate data across chains (e.g. combined transfer totals).
- Why it matters: Prevents scope creep. Omitting the `network` filter already returns all-chain data.
- Source: collaborative
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Natural Hasura behavior gives cross-chain queries for free.

### R045 — Generalized chillwhales handlers
- Class: anti-feature
- Status: out-of-scope
- Description: Making chillwhales-specific handlers (chillClaimed, orbLevel, orbFaction, etc.) generic for any chain.
- Why it matters: Prevents unnecessary abstraction of project-specific game mechanics.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Chillwhales handlers stay LUKSO-only via `supportedChains: ['lukso']`.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R027 | core-capability | active | M008/S01 | M008/S02 | unmapped |
| R028 | core-capability | active | M009/S01 | none | unmapped |
| R029 | core-capability | active | M009/S02 | none | unmapped |
| R030 | core-capability | active | M009/S02 | none | unmapped |
| R031 | core-capability | active | M009/S02 | none | unmapped |
| R032 | core-capability | active | M009/S03 | none | unmapped |
| R033 | core-capability | active | M009/S03 | none | unmapped |
| R034 | operability | active | M009/S04 | none | unmapped |
| R035 | integration | active | M009/S05 | none | unmapped |
| R036 | constraint | active | M008, M009 | all | unmapped |
| R037 | core-capability | active | M010/S01 | none | unmapped |
| R038 | core-capability | active | M010/S02 | none | unmapped |
| R039 | core-capability | active | M010/S03 | none | unmapped |
| R040 | quality-attribute | active | M010/S04 | none | unmapped |
| R041 | core-capability | deferred | none | none | unmapped |
| R042 | operability | deferred | none | none | unmapped |
| R043 | operability | deferred | none | none | unmapped |
| R044 | anti-feature | out-of-scope | none | none | n/a |
| R045 | anti-feature | out-of-scope | none | none | n/a |
| R017 | core-capability | validated | M007/S01 | none | validated |
| R018 | core-capability | validated | M007/S01 | none | validated |
| R019 | core-capability | validated | M007/S01 | none | validated |
| R020 | core-capability | validated | M007/S02 | none | validated |
| R021 | core-capability | validated | M007/S01 | none | validated |
| R022 | core-capability | validated | M007/S03 | none | validated |
| R023 | core-capability | validated | M007/S02 | none | validated |
| R024 | quality-attribute | validated | M007/S01 | none | validated |
| R025 | quality-attribute | validated | M007/S04 | M007/S01, S02, S03 | validated |
| R026 | quality-attribute | validated | M007/S04 | none | validated |
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

- Active requirements: 14
- Mapped to slices: 14
- Validated: 19
- Deferred: 3
- Out of scope: 2
- Unmapped active requirements: 0
