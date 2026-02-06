# LSP Indexer V2 — Complete the Rewrite

## What This Is

The LSP Indexer is an open-source blockchain event indexer for the LUKSO network. It listens to on-chain events (transfers, profile updates, data key changes, follower actions, contract deployments), extracts structured data from them, and persists it to PostgreSQL. A Hasura GraphQL API auto-exposes the data for downstream consumers. This project completes the V2 rewrite — migrating from a tightly-coupled pipeline to an enrichment queue architecture where adding a new event or data key requires exactly 1 file.

## Core Value

The indexer must process every LUKSO blockchain event correctly and produce identical data to V1, so V2 can replace V1 in production without data loss or API regressions.

## Requirements

### Validated

- ✓ Core type definitions (EntityHandler, EnrichmentRequest, IBatchContext) — existing (#100)
- ✓ 6-step pipeline (EXTRACT → PERSIST RAW → HANDLE → PERSIST DERIVED → VERIFY → ENRICH) — existing (#101)
- ✓ 11 EventPlugins simplified to pure extractors — existing (#102)
- ✓ 15 DataKeyPlugins converted to EntityHandlers — existing (#103)
- ✓ NFT EntityHandler consolidating 3 creation sources — existing (#104)
- ✓ BatchContext implementation — existing (#14)
- ✓ PluginRegistry with auto-discovery — existing (#15)
- ✓ Address verification with LRU cache — existing (#17)
- ✓ Metadata worker thread pool — existing (#18)
- ✓ All 11 event plugins (LSP7/LSP8 Transfer, UniversalReceiver, OwnershipTransferred, Follow/Unfollow, DeployedContracts/Proxies, DataChanged, TokenIdDataChanged) — existing (#19-#29)
- ✓ Decimals handler — existing (#49)
- ✓ TotalSupply handler (implementation, not yet migrated) — existing (#47)
- ✓ OwnedAssets handler (implementation, not yet migrated) — existing (#48)

### Active

- [ ] Refactor existing handlers (totalSupply, ownedAssets, decimals) to new EntityHandler interface (#105)
- [ ] Delete legacy code — DataKeyPlugin interface, populate helpers, handler helpers (#106)
- [ ] FormattedTokenId EntityHandler (#113)
- [ ] Permissions update handler (#50)
- [ ] Follower system handler (#52)
- [ ] LSP3 metadata fetch handler (#53)
- [ ] LSP4 metadata fetch handler (#54)
- [ ] LSP29 metadata fetch handler (#55)
- [ ] Structured logging layer (#94)
- [ ] Processor configuration (#57)
- [ ] Entry point & startup wiring (#58)
- [ ] End-to-end integration testing (#59)
- [ ] Automated V1 vs V2 data comparison for production cutover
- [ ] Docker deployment configuration for V2
- [ ] Side-by-side V1/V2 production run and validation

### Out of Scope

- Marketplace functionality — removed from scope (issues #40-#46, #56 closed as not planned)
- New LSP standards not in V1 — V2 must match V1 parity first
- GraphQL API changes — Hasura auto-generates from schema, no custom resolvers
- V1 code changes — V1 is frozen, only V2 gets work

## Context

- **Monorepo**: 3 packages — `abi` (contract types), `typeorm` (schema/models), `indexer` (V1 core), plus `indexer-v2` (V2 rewrite in progress)
- **Stack**: TypeScript, Subsquid EVM Processor, TypeORM + PostgreSQL, Hasura GraphQL, Viem, Node.js 22
- **Schema**: ~80+ TypeORM entities generated from `schema.graphql`, mapping 1:1 to LUKSO LSP standards (LSP0, LSP3, LSP4, LSP5, LSP6, LSP7, LSP8, LSP12, LSP26, LSP29)
- **V1 is live in production** on Docker + VPS, indexing LUKSO mainnet
- **V2 progress**: Phases 1-4 complete (33 issues closed). Phase 5 (enrichment queue architecture) nearly complete — 5 of 7 issues done. 13 issues remain across phases 5-8 plus #113
- **Codebase mapped**: Full architecture, stack, and structure analysis available in `.planning/codebase/`
- **Key V2 architecture change**: Enrichment queue eliminates the populate phase — raw entities persist with null FKs, then batch UPDATE resolves references after verification. This means no entity removal for invalid addresses; FKs simply stay null.

## Constraints

- **Data parity**: V2 must produce identical database state to V1 for the same blockchain data — validated via automated comparison before cutover
- **Zero downtime**: V1 stays live during V2 validation; cutover only after comparison passes
- **Existing schema**: TypeORM entities and `schema.graphql` are shared between V1 and V2 — no schema changes allowed that would break V1
- **Subsquid framework**: Must use Subsquid's `EvmBatchProcessor` and `TypeormDatabase` — framework dictates batch processing model
- **LUKSO RPC**: Rate limited (default 10 req/s), finality confirmation at 75 blocks (~15 min)

## Key Decisions

| Decision                             | Rationale                                                                                                   | Outcome                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Enrichment queue over populate phase | Eliminates entity removal, simplifies FK resolution to batch UPDATE, decouples extraction from verification | ✓ Good — implemented in #101 |
| EntityHandler replaces DataKeyPlugin | Unified interface for all derived entities, self-selecting from BatchContext via `listensToBag`             | ✓ Good — implemented in #103 |
| Marketplace removed from V2 scope    | High complexity, separate concern, can be added later as EntityHandlers                                     | ✓ Good — simplified scope    |
| Side-by-side V1/V2 validation        | Risk mitigation for production cutover — automated comparison ensures data parity                           | — Pending                    |
| Docker + VPS deployment              | Matches existing V1 infrastructure, no infrastructure migration during rewrite                              | — Pending                    |
| Parallelize independent work         | Logging (#94) can proceed alongside Phase 6 handlers; not all work is strictly sequential                   | — Pending                    |

---

_Last updated: 2026-02-06 after initialization_
