# LSP Indexer

## What This Is

The LSP Indexer is an open-source blockchain event indexer for the LUKSO network. It listens to on-chain events (transfers, profile updates, data key changes, follower actions, contract deployments), extracts structured data from them, and persists it to PostgreSQL. A Hasura GraphQL API auto-exposes the data for downstream consumers. Four packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) provide type-safe access for any app to consume this data — with both client-side and server-side patterns.

## Core Value

Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer — without needing to understand the underlying blockchain, GraphQL schema, or indexing pipeline.

## Current Milestone: v1.1 React Hooks Package

**Goal:** Ship 4 publishable packages that give any app type-safe access to all 11 indexer query domains — with client-side hooks (TanStack Query), WebSocket subscriptions (`graphql-ws`), and Next.js server actions (`'use server'`).

**Package architecture:**

```
@lsp-indexer/types  — Zod schemas + inferred TS types (zero framework deps)
@lsp-indexer/node   — services, parsers, documents, codegen, query keys, execute, errors
@lsp-indexer/react  — thin TanStack Query hooks (browser → Hasura directly)
@lsp-indexer/next   — server actions + hooks routing through them (browser → server → Hasura)
```

**Target features:**

- GraphQL codegen from Hasura schema (types committed in `packages/node`, schema from `packages/typeorm`)
- 11 query domains: Universal Profiles, Digital Assets, NFTs, Owned Assets, Follows/Social, Creator Addresses, LSP29 Encrypted Assets, LSP29 Feed, Data Changed, Universal Receiver Events, UP Stats
- Client-side hooks: `@lsp-indexer/react` — TanStack Query hooks calling `@lsp-indexer/node` services directly
- WebSocket subscriptions: `graphql-ws` subscription hooks with TanStack Query cache integration
- Server-side hooks: `@lsp-indexer/next` — `'use server'` actions wrapping `@lsp-indexer/node` services
- TanStack Query provider (use existing or create new)
- GraphQL URL via environment variables (framework-agnostic)
- Consistent patterns: every domain follows the same types → documents → parsers → services → keys → hooks → actions structure

## Current State

**Shipped:** v1.0 (2026-02-16)

V2 rewrite is feature-complete with data parity validated against V1 via automated comparison tool. 29 EntityHandlers, 11 EventPlugins, 3 metadata fetch handlers (LSP3/LSP4/LSP29), structured logging, queue-based worker pool, and a standalone comparison tool — all built across 11 phases in 10 days.

**Stats:**

- 88 TypeScript files, 20,630 LOC (indexer-v2)
- 7 TypeScript files, 1,195 LOC (comparison-tool)
- 20 test files, 9,727 lines of test code
- 29 handlers, 11 plugins, 72 entity types

**Next:** React hooks package for consuming indexer data.

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

- [x] 4-package architecture (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`)
- [x] GraphQL codegen pipeline from Hasura schema (in `@lsp-indexer/node`)
- [ ] 11 query domain services with consistent patterns (1/11 done — profiles)
- [ ] Client-side TanStack Query hooks in `@lsp-indexer/react` for all domains (1/11 done)
- [ ] Server action hooks in `@lsp-indexer/next` for all domains (1/11 done)
- [x] TanStack Query provider setup
- [ ] Comprehensive tests and documentation for new devs

### Deferred

- Production cutover procedure with rollback plan — deferred from v1.0
- Full automated V1/V2 comparison test suite with CI integration — deferred from v1.0
- Performance benchmarks (V2 vs V1 throughput, memory, CPU) — deferred from v1.0

### Out of Scope

- Marketplace functionality — removed from scope (issues #40-#46, #56 closed as not planned)
- New LSP standards not in V1 — V2 must match V1 parity first
- GraphQL API changes — Hasura auto-generates from schema, no custom resolvers
- V1 code changes — V1 is frozen, only V2 gets work
- Subsquid Portal SDK migration — breaking API changes, plan as separate post-V2 milestone
- Multi-stage Docker build optimization — defer until cutover complete
- Offline mode — real-time indexing is core value
- Mutations/write operations — indexer is read-only, no write hooks needed

## Context

- **Monorepo**: 9 packages — `abi` (contract types), `typeorm` (schema/models), `indexer` (V1 core), `indexer-v2` (V2 rewrite), `comparison-tool`, `types` (Zod schemas), `node` (services/parsers/codegen), `react` (TanStack Query hooks), `next` (server actions + hooks)
- **Stack**: TypeScript, Subsquid EVM Processor, TypeORM + PostgreSQL, Hasura GraphQL, Viem, Node.js 22
- **Schema**: ~80+ TypeORM entities generated from `schema.graphql`, mapping 1:1 to LUKSO LSP standards
- **Hasura auto-generates GraphQL API** from PostgreSQL — codegen runs against Hasura endpoint to produce TypeScript types
- **V1 is live in production** on Docker + VPS, indexing LUKSO mainnet
- **V2 is feature-complete** — 29 EntityHandlers, 11 EventPlugins, 3 metadata fetchers, structured logging, queue-based worker pool
- **Key V2 architecture**: Enrichment queue eliminates the populate phase — raw entities persist with null FKs, then batch UPDATE resolves references after verification
- **Reference implementation**: `chillwhales/marketplace` has existing (non-ideal) GraphQL client, services, actions, and hooks — being standardized and extracted into `packages/react`

## Branching & PR Workflow (v1.1)

**Integration branch:** `refactor/indexer-v2-react`

All v1.1 milestone work (Phases 7–11) merges through pull requests targeting `refactor/indexer-v2-react`. Never commit directly to this branch.

**Before starting ANY plan execution:**

```bash
# 1. Fetch latest remote state
git fetch origin

# 2. Checkout and reset to latest integration branch
git checkout refactor/indexer-v2-react
git pull origin refactor/indexer-v2-react

# 3. Create a new feature branch for this plan
git checkout -b feat/<plan-description>
# Examples:
#   feat/react-package-scaffold
#   feat/react-test-app
#   feat/react-profile-hooks
```

**After completing a plan:**

```bash
# Push the feature branch and open a PR targeting the integration branch
git push -u origin feat/<plan-description>
gh pr create --base refactor/indexer-v2-react --title "<plan title>" --body "<summary>"
```

**Rules:**

- One feature branch per plan (or per logical unit of work)
- PRs always target `refactor/indexer-v2-react` — never `main`, never `refactor/indexer-v2`
- Fetch + pull `refactor/indexer-v2-react` before branching — stale bases cause merge conflicts
- `refactor/indexer-v2-react` is the single source of truth for all v1.1 work

## Constraints

- **Data parity**: V2 must produce identical database state to V1 — validated via comparison tool
- **Zero downtime**: V1 stays live during V2 validation; cutover only after comparison passes
- **Existing schema**: TypeORM entities and `schema.graphql` shared between V1 and V2 — no breaking changes
- **Subsquid framework**: Must use Subsquid's `EvmBatchProcessor` and `TypeormDatabase`
- **LUKSO RPC**: Rate limited (default 10 req/s), finality confirmation at 75 blocks (~15 min)
- **Framework compatibility**: React hooks package must work with Next.js App Router (primary) and any React 18+ app
- **Publishable packages**: All 4 packages must be installable via npm — no app-specific dependencies
- **Env-driven config**: GraphQL URL comes from environment variable, not hardcoded
- **No re-exports — single source of truth**: Each export lives in exactly one package. Types in `@lsp-indexer/types`, services/errors/keys in `@lsp-indexer/node`, hooks in `@lsp-indexer/react` or `@lsp-indexer/next`. No convenience re-exports or barrel forwarding between packages. Consumers import from the source.

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

| React hooks package in lsp-indexer monorepo | Keeps indexer + consumers in one repo, schema stays in sync, single publish pipeline | ✓ Good — 4 packages shipped |
| 4-package split (types/node/react/next) | Separation of concerns: types standalone, node has no React dep, react is thin hooks, next adds server actions | ✓ Good — clean dependency graph |
| Native `'use server'` over next-safe-action | Simpler, zero runtime deps, Next.js-native — no benefit from next-safe-action wrapper for read-only hooks | ✓ Good — lighter bundle |
| No re-exports across packages | Single source of truth — eliminates maintenance overhead, prevents stale re-exports, clearer import provenance | ✓ Good — clean boundaries |

---

_Last updated: 2026-02-19 — updated for 4-package architecture_
