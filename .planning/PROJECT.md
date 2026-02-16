# LSP Indexer V2 — Complete the Rewrite

## What This Is

The LSP Indexer is an open-source blockchain event indexer for the LUKSO network. It listens to on-chain events (transfers, profile updates, data key changes, follower actions, contract deployments), extracts structured data from them, and persists it to PostgreSQL. A Hasura GraphQL API auto-exposes the data for downstream consumers. V2 is a complete rewrite — migrating from a tightly-coupled pipeline to an enrichment queue architecture where adding a new event or data key requires exactly 1 file.

## Core Value

The indexer must process every LUKSO blockchain event correctly and produce identical data to V1, so V2 can replace V1 in production without data loss or API regressions.

## Current State

**Shipped:** v1.0 (2026-02-16)

V2 rewrite is feature-complete with data parity validated against V1 via automated comparison tool. 29 EntityHandlers, 11 EventPlugins, 3 metadata fetch handlers (LSP3/LSP4/LSP29), structured logging, queue-based worker pool, and a standalone comparison tool — all built across 11 phases in 10 days.

**Stats:**

- 88 TypeScript files, 20,630 LOC (indexer-v2)
- 7 TypeScript files, 1,195 LOC (comparison-tool)
- 20 test files, 9,727 lines of test code
- 29 handlers, 11 plugins, 72 entity types

**Next:** Production cutover — run V2 alongside V1, validate parity with comparison tool, switch traffic.

## Requirements

### Validated

- ✓ Core type definitions (EntityHandler, EnrichmentRequest, IBatchContext) — v1.0
- ✓ 6-step pipeline (EXTRACT → PERSIST RAW → HANDLE → PERSIST DERIVED → VERIFY → ENRICH) — v1.0
- ✓ 11 EventPlugins simplified to pure extractors — v1.0
- ✓ 15 DataKeyPlugins converted to EntityHandlers — v1.0
- ✓ NFT EntityHandler consolidating 3 creation sources — v1.0
- ✓ BatchContext implementation — v1.0
- ✓ PluginRegistry with auto-discovery — v1.0
- ✓ Address verification with LRU cache — v1.0
- ✓ Metadata worker thread pool (queue-based architecture) — v1.0
- ✓ All handler migrations (totalSupply, ownedAssets, decimals, formattedTokenId) — v1.0
- ✓ Legacy code deletion (DataKeyPlugin, populate/persist/handler helpers) — v1.0
- ✓ Follow/Unfollow handlers with deterministic IDs — v1.0
- ✓ LSP6 permission handlers (delete + re-create on data key changes) — v1.0
- ✓ LSP3 metadata fetch handler (7 sub-entity types) — v1.0
- ✓ LSP4 metadata fetch handler (8 sub-entity types + Score/Rank) — v1.0
- ✓ LSP29 metadata fetch handler (7 sub-entity types) — v1.0
- ✓ Head-only gating for metadata fetches — v1.0
- ✓ Metadata fetch retry with error tracking — v1.0
- ✓ Structured JSON logging with severity and step filtering — v1.0
- ✓ Component-specific debug logging (LOG_LEVEL, DEBUG_COMPONENTS) — v1.0
- ✓ Queue-based worker pool (~2x throughput over batch-wait) — v1.0
- ✓ Processor configuration with all EventPlugin subscriptions — v1.0
- ✓ Application boot with plugin/handler discovery and registration — v1.0
- ✓ Integration tests with real LUKSO block fixtures — v1.0
- ✓ Handler ordering preserves V1 dependency graph — v1.0
- ✓ V2 runs alongside V1 in Docker — v1.0
- ✓ Automated V1/V2 comparison tool (72 entity types, GraphQL-based) — v1.0
- ✓ Pipeline case-insensitive address comparison — v1.0
- ✓ UniversalProfileOwner/DigitalAssetOwner handlers — v1.0
- ✓ ChillClaimed/OrbsClaimed handlers (game entities) — v1.0
- ✓ LSP4 base URI → per-token metadata derivation — v1.0
- ✓ OwnedAsset triggeredBy filtering (fixes double-processing) — v1.0
- ✓ Orb mint-time defaults (OrbLevel/OrbCooldownExpiry/OrbFaction) — v1.0
- ✓ resolveEntity/resolveEntities standardization (13 handlers unified) — v1.0
- ✓ Tech debt cleanup (stale TODOs, deprecated wrappers, structured logging) — v1.0

### Active

- [ ] Production cutover procedure with rollback plan
- [ ] Full automated V1/V2 comparison test suite with CI integration
- [ ] Performance benchmarks (V2 vs V1 throughput, memory, CPU)

### Out of Scope

- Marketplace functionality — removed from scope (issues #40-#46, #56 closed as not planned)
- New LSP standards not in V1 — V2 must match V1 parity first
- GraphQL API changes — Hasura auto-generates from schema, no custom resolvers
- V1 code changes — V1 is frozen, only V2 gets work
- Subsquid Portal SDK migration — breaking API changes, plan as separate post-V2 milestone
- Multi-stage Docker build optimization — defer until cutover complete
- Offline mode — real-time indexing is core value

## Context

- **Monorepo**: 3 packages — `abi` (contract types), `typeorm` (schema/models), `indexer` (V1 core), plus `indexer-v2` (V2 rewrite) and `comparison-tool`
- **Stack**: TypeScript, Subsquid EVM Processor, TypeORM + PostgreSQL, Hasura GraphQL, Viem, Node.js 22
- **Schema**: ~80+ TypeORM entities generated from `schema.graphql`, mapping 1:1 to LUKSO LSP standards
- **V1 is live in production** on Docker + VPS, indexing LUKSO mainnet
- **V2 is feature-complete** — 29 EntityHandlers, 11 EventPlugins, 3 metadata fetchers, structured logging, queue-based worker pool
- **Key V2 architecture**: Enrichment queue eliminates the populate phase — raw entities persist with null FKs, then batch UPDATE resolves references after verification

## Constraints

- **Data parity**: V2 must produce identical database state to V1 — validated via comparison tool
- **Zero downtime**: V1 stays live during V2 validation; cutover only after comparison passes
- **Existing schema**: TypeORM entities and `schema.graphql` shared between V1 and V2 — no breaking changes
- **Subsquid framework**: Must use Subsquid's `EvmBatchProcessor` and `TypeormDatabase`
- **LUKSO RPC**: Rate limited (default 10 req/s), finality confirmation at 75 blocks (~15 min)

## Key Decisions

| Decision                                | Rationale                                                                      | Outcome                          |
| --------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------- |
| Enrichment queue over populate phase    | Eliminates entity removal, simplifies FK resolution to batch UPDATE            | ✓ Good — implemented in #101     |
| EntityHandler replaces DataKeyPlugin    | Unified interface for all derived entities, self-selecting via `listensToBag`  | ✓ Good — implemented in #103     |
| Marketplace removed from V2 scope       | High complexity, separate concern, can be added later                          | ✓ Good — simplified scope        |
| postVerification as opt-in boolean flag | Keeps all handlers as one type, existing handlers unaffected                   | ✓ Good — used by 3 handlers      |
| Dual-output logging (Subsquid + pino)   | Subsquid controls stdout; pino adds independent file rotation                  | ✓ Good — debug + production logs |
| Queue-based worker pool                 | Batch-wait left workers idle; queue keeps N workers busy continuously          | ✓ Good — ~2x throughput          |
| resolveEntity/resolveEntities pattern   | Replaced 4 ad-hoc patterns, fixed 3 bugs and 2 gaps                            | ✓ Good — zero ad-hoc lookups     |
| Case-insensitive address comparison     | Subsquid delivers lowercase, constants use EIP-55 checksummed                  | ✓ Good — fixed 4 silent failures |
| Standalone comparison tool package      | Decoupled from indexer, queries Hasura GraphQL endpoints                       | ✓ Good — reusable across stacks  |
| Side-by-side V1/V2 validation           | Risk mitigation for production cutover — automated comparison ensures parity   | ✓ Good — comparison tool shipped |
| Docker + VPS deployment                 | Matches existing V1 infrastructure, no infrastructure migration during rewrite | ✓ Good — both stacks running     |

---

_Last updated: 2026-02-16 after v1.0 milestone_
