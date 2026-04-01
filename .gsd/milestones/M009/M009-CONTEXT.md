---
depends_on: [M008]
---

# M009: Multi-chain Indexer Infrastructure

**Gathered:** 2026-04-01
**Status:** Ready for planning

## Project Description

Make the Subsquid indexer structurally multi-chain. Replace all hardcoded LUKSO constants with a typed chain config registry. Add a `network` column to every entity. Prefix deterministic IDs with network name. Migrate existing LUKSO data. Add `supportedChains` to every plugin/handler. Build a parameterized processor factory. Define per-chain Docker services. Prove it works by running LUKSO mainnet + testnet simultaneously.

## Why This Milestone

The indexer currently only supports LUKSO mainnet — every constant, ID pattern, and deployment config is LUKSO-specific. Multi-chain support requires the indexer to be structurally chain-agnostic before consumer packages can add network filtering.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Run two indexer processors simultaneously (LUKSO mainnet + testnet) against a shared Postgres
- Query Hasura with `where: { network: { _eq: "lukso" } }` to filter by chain
- Query without network filter to get data from all chains
- See `network`-prefixed IDs that are self-describing (e.g. `lukso:0xabc...`)

### Entry point / environment

- Entry point: `docker compose up` (starts both chain processors)
- Environment: local dev with Docker Compose
- Live dependencies involved: LUKSO mainnet RPC, LUKSO testnet RPC, SQD gateways, PostgreSQL, Hasura

## Completion Class

- Contract complete means: build succeeds, all plugins declare supportedChains, all entities have network column, IDs are prefixed
- Integration complete means: two processors run simultaneously, both write to shared DB, Hasura serves unified API with network filter
- Operational complete means: Docker Compose runs both chains with per-chain health checks

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- LUKSO mainnet processor starts and indexes blocks identically to pre-refactor
- LUKSO testnet processor starts alongside mainnet, writes to same DB with `network: 'lukso-testnet'`
- A Hasura query with `network` filter returns only the expected chain's data
- A Hasura query without `network` filter returns data from both chains
- No ID collisions between chains

## Risks and Unknowns

- Backfill migration complexity — updating deterministic IDs and all FK references is the riskiest operation. Must update both `id` columns and FK columns that reference them. — Could corrupt existing data if FK update misses a reference.
- Subsquid SERIALIZABLE isolation — two processors writing simultaneously may cause serialization conflicts. — SQD docs warn about this for cross-chain data dependencies, but our per-chain records shouldn't overlap.
- LUKSO testnet SQD gateway availability — needs a working archive endpoint for testnet. — If unavailable, may need to use RPC-only mode.
- TypeORM migration generation — adding `network` column to 51 entities requires correct migration generation. — squid-typeorm-migration may struggle with composite changes.

## Existing Codebase / Prior Art

- `packages/indexer/src/constants/index.ts` — all hardcoded LUKSO constants (SQD_GATEWAY, RPC_URL, MULTICALL_ADDRESS, IPFS_GATEWAY, RPC_RATE_LIMIT, FINALITY_CONFIRMATION)
- `packages/indexer/src/app/processor.ts` — singleton EvmBatchProcessor with hardcoded LUKSO config
- `packages/indexer/src/app/bootstrap.ts` — registry creation with filesystem discovery
- `packages/indexer/src/app/index.ts` — main entry point, single processor.run()
- `packages/indexer/src/core/verification.ts` — LUKSO-specific interface IDs for supportsInterface
- `packages/indexer/src/core/multicall.ts` — uses hardcoded MULTICALL_ADDRESS
- `packages/indexer/src/plugins/events/` — 11 EventPlugins, none declare chain compatibility
- `packages/indexer/src/handlers/` — ~20 EntityHandlers, none declare chain compatibility
- `packages/indexer/src/handlers/chillwhales/` — 4 LUKSO-only handlers
- `packages/typeorm/schema.graphql` (→ `packages/indexer/` after M008) — 51 entity types, no network column
- `docker/docker-compose.yml` — single indexer service
- Entity ID patterns: UUID (events), address-based (UP, DA, LSP4TokenName), composite (NFT via generateTokenId), string-composite (LSP29, LSP6)

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions.

## Relevant Requirements

- R028 — Chain configuration registry (primary)
- R029 — Network discriminator on all entities (primary)
- R030 — Network-prefixed deterministic IDs (primary)
- R031 — Backfill migration (primary)
- R032 — Per-chain plugin supportedChains (primary)
- R033 — Parameterized processor factory (primary)
- R034 — Per-chain Docker services (primary)
- R035 — LUKSO testnet proof (primary)
- R036 — LUKSO parity constraint (cross-cutting)

## Scope

### In Scope

- Chain config registry type and LUKSO mainnet/testnet configs
- `network: String! @index` column on all 51 entity types in schema.graphql
- Network-prefix helper for deterministic ID generation
- Backfill SQL migration for existing LUKSO data (IDs + FK references)
- `supportedChains` field on EventPlugin and EntityHandler interfaces
- Chain-aware plugin registry filtering
- Parameterized processor factory
- Per-chain entry point parameterization via env vars
- Per-chain Docker service definitions
- LUKSO testnet running as second processor

### Out of Scope / Non-Goals

- Consumer package changes (M010)
- Non-LSP chain plugin authoring (deferred R041)
- Per-chain IPFS gateway config (deferred R043)
- Cross-chain aggregate views (out-of-scope R044)

## Technical Constraints

- Subsquid SERIALIZABLE isolation — per-chain records must not have data dependencies
- TypeORM migration must be non-destructive — existing LUKSO data preserved
- `network` prefix on IDs must be applied consistently in plugins, handlers, and verification
- Multicall address is chain-specific — must come from chain config

## Integration Points

- PostgreSQL — schema migration, new column on all tables
- Hasura — auto-tracks new column, exposes as filterable field
- SQD Network — different gateway URLs per chain
- LUKSO RPC — mainnet and testnet endpoints
- Docker Compose — per-chain service definitions

## Open Questions

- LUKSO testnet SQD gateway URL — need to verify availability and correct endpoint
