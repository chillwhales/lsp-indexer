# LSP Indexer

## What This Is

The LSP Indexer is an open-source blockchain event indexer for the LUKSO network. It listens to on-chain events (transfers, profile updates, data key changes, follower actions, contract deployments), extracts structured data from them, and persists it to PostgreSQL. A Hasura GraphQL API auto-exposes the data for downstream consumers. Four npm packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) provide type-safe access for any app to consume this data — with client-side TanStack Query hooks, real-time WebSocket subscriptions, and Next.js server actions.

## Core Value

Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer — without needing to understand the underlying blockchain, GraphQL schema, or indexing pipeline.

## Current Milestone: v1.2 Production Readiness

**Goal:** Make the indexer production-ready with block-level ordering, sorting support across all consumer packages, monitoring, and operational infrastructure.

**Target features:**

- Production Docker Compose using released `ghcr.io/chillwhales/lsp-indexer` image
- Block ordering fields (blockNumber, transactionIndex, logIndex) on all entities
- Oldest/newest sorting across all 12 query domains in all consumer packages
- Grafana monitoring dashboards (structured logs + sqd logs)
- Database backup strategy and recovery procedure
- Version normalization for private packages

## Current State

**Shipped:** v1.1 React Hooks Package (2026-03-08)

The indexer is complete (v1.0) and the consumer package layer is complete (v1.1). Four publishable npm packages provide type-safe access to all 12 indexer query domains:

- **`@lsp-indexer/types`** — Zod schemas + inferred TS types (zero framework deps)
- **`@lsp-indexer/node`** — services, parsers, documents, codegen, query keys, execute, errors
- **`@lsp-indexer/react`** — TanStack Query hooks (browser → Hasura directly)
- **`@lsp-indexer/next`** — server actions + hooks routing through server (browser → server → Hasura)

**Stats:**

- 4 publishable packages with ESM+CJS+DTS builds
- 12 query domains: Profiles, Digital Assets, NFTs, Owned Assets, Owned Tokens, Followers, Creators, Issued Assets, Encrypted Assets, Data Changed Events, Token ID Data Changed Events, Universal Receiver Events
- 12 subscription hooks (graphql-ws WebSocket with TanStack Query cache integration)
- 12 server action sets (Next.js `'use server'` with Zod input validation)
- Prisma-style include type narrowing (excluded fields absent from TypeScript types)
- Layered CI pipeline, changesets release flow, shared reusable workflows

## Requirements

### Validated

- ✓ 6-step pipeline (EXTRACT → PERSIST RAW → HANDLE → PERSIST DERIVED → VERIFY → ENRICH) — v1.0
- ✓ 11 EventPlugins, 29 EntityHandlers, 3 metadata fetchers — v1.0
- ✓ Enrichment queue, BatchContext, PluginRegistry — v1.0
- ✓ Structured logging, queue-based worker pool — v1.0
- ✓ Automated V1/V2 comparison tool with data parity validated — v1.0
- ✓ 4-package architecture (types/node/react/next) with clean dependency graph — v1.1
- ✓ GraphQL codegen pipeline from Hasura schema — v1.1
- ✓ 12 query domain services with consistent patterns — v1.1
- ✓ TanStack Query hooks for all domains with infinite scroll — v1.1
- ✓ WebSocket subscriptions for all domains via graphql-ws — v1.1
- ✓ Next.js server actions for all domains with Zod validation — v1.1
- ✓ Prisma-style conditional include type narrowing (DX-04) — v1.1
- ✓ 3-overload generic pattern with zero type assertions (DX-05) — v1.1
- ✓ publint + arethetypeswrong publish readiness validation — v1.1
- ✓ @chillwhales/erc725 and @chillwhales/lsp1 migration — v1.1
- ✓ v1 indexer cleanup, canonical package promotion — v1.1
- ✓ Consumer-facing JSDoc on all public APIs — v1.1
- ✓ Layered CI/CD pipeline with changesets, preview releases, shared infra — v1.1

### Active

- [ ] Production Docker Compose (released image + PG + Hasura)
- [ ] Block ordering fields on all entities
- [ ] Oldest/newest sorting across all 12 domains
- [ ] Grafana monitoring dashboards
- [x] Database backups + recovery procedure
- [ ] Version normalization (0.1.0 for private packages)

### Deferred

- Production cutover procedure with rollback plan — deferred from v1.0
- SSR hydration examples and documentation — deferred from v1.1
- Select transform helpers — deferred from v1.1
- Domain-specific stale time tuning — deferred from v1.1
- Multi-instance deployment with failover — deferred from v1.2
- Auto-scaling / Kubernetes — deferred from v1.2

### Out of Scope

- Marketplace functionality — removed from scope
- Mutations/write hooks — indexer is read-only
- Custom cache layer — TanStack Query handles caching
- Apollo/urql adapters — package uses typed fetch
- Mobile-specific hooks — React Native deferred, web-first
- Offline mode — real-time indexing is core value

## Context

- **Monorepo**: 7 packages — `abi` (contract types), `typeorm` (schema/models), `indexer` (canonical V2), `types` (Zod schemas), `node` (services/parsers/codegen), `react` (TanStack Query hooks), `next` (server actions + hooks)
- **Apps**: `apps/test` — Next.js 16 playground with all 12 domains, client/server mode toggle, subscription demos
- **Stack**: TypeScript, Subsquid EVM Processor, TypeORM + PostgreSQL, Hasura GraphQL, Viem, Node.js 22, TanStack Query, graphql-ws
- **Schema**: ~80+ TypeORM entities generated from `schema.graphql`, mapping 1:1 to LUKSO LSP standards
- **V1 is live in production** on Docker + VPS, indexing LUKSO mainnet
- **CI/CD**: Layered GitHub Actions pipeline (lint, typecheck, build, test, publint+attw), changesets release flow, preview releases via pkg-pr-new, shared reusable workflows in `chillwhales/.github`

## Branching & PR Workflow (v1.1)

**Integration branch:** `refactor/indexer-v2-react`

All v1.1 milestone work (Phases 7–16) merged through pull requests targeting `refactor/indexer-v2-react`. Feature branches named `feat/<plan-description>`, PRs always target the integration branch.

## Constraints

- **Data parity**: V2 must produce identical database state to V1
- **Zero downtime**: V1 stays live during V2 validation
- **Existing schema**: TypeORM entities and `schema.graphql` shared — no breaking changes
- **Subsquid framework**: Must use Subsquid's `EvmBatchProcessor` and `TypeormDatabase`
- **LUKSO RPC**: Rate limited (default 10 req/s), finality at 75 blocks (~15 min)
- **Framework compatibility**: Hooks work with Next.js App Router (primary) and any React 18+ app
- **Publishable packages**: All 4 packages installable via npm — no app-specific dependencies
- **Env-driven config**: GraphQL URL from environment variable, not hardcoded
- **No re-exports — single source of truth**: Each export in exactly one package

## Key Decisions

| Decision | Rationale | Outcome |
| --- | --- | --- |
| Enrichment queue over populate phase | Eliminates entity removal, simplifies FK resolution | ✓ Good — v1.0 |
| EntityHandler replaces DataKeyPlugin | Unified interface for all derived entities | ✓ Good — v1.0 |
| 4-package split (types/node/react/next) | Separation of concerns, clean dependency graph | ✓ Good — v1.1 |
| No re-exports across packages | Single source of truth, eliminates maintenance overhead | ✓ Good — v1.1 |
| Vertical-slice delivery (profiles first) | Validates full architecture before replicating | ✓ Good — v1.1 |
| Prisma-style include type narrowing | Excluded fields absent from types, not null | ✓ Good — v1.1 |
| 3-overload generic `<const I>` pattern | Full type propagation from parser to consumer | ✓ Good — v1.1 |
| graphql-ws for subscriptions | Hasura-native WebSocket, TanStack Query cache integration | ✓ Good — v1.1 |
| Changesets fixed group | Synchronized versioning across all 4 packages | ✓ Good — v1.1 |
| Shared CI in chillwhales/.github | Reusable workflows consumed by multiple repos | ✓ Good — v1.1 |
| @chillwhales package migration | Reduced local code, aligned with shared ecosystem | ✓ Good — v1.1 |
| v1 cleanup + v2 canonical promotion | Single indexer, no ambiguity | ✓ Good — v1.1 |

---

_Last updated: 2026-03-08 after v1.2 milestone started_
