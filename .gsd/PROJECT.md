# LSP Indexer

## What This Is

The LSP Indexer is an open-source blockchain event indexer for the LUKSO network. It listens to on-chain events (transfers, profile updates, data key changes, follower actions, contract deployments), extracts structured data from them, and persists it to PostgreSQL. A Hasura GraphQL API auto-exposes the data for downstream consumers. Four npm packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) provide type-safe access for any app to consume this data — with client-side TanStack Query hooks, real-time WebSocket subscriptions, and Next.js server actions.

## Core Value

Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer — without needing to understand the underlying blockchain, GraphQL schema, or indexing pipeline.

## Current Milestone: M002 — Docs Site & AI Agent Compatibility

**Status:** Queued (M001 completed 2026-03-17)

## Current State

**Shipped:** v1.2 Production Readiness (2026-03-17, M001 complete)

The full stack is production-ready: indexer v2 with 6-step pipeline, 4 publishable npm packages at v1.1.0, production Docker Compose with monitoring stack, and operational tooling.

**Key deliverables from M001:**

- **Indexer v2** — 6-step pipeline (EXTRACT → PERSIST RAW → HANDLE → PERSIST DERIVED → VERIFY → ENRICH), 11 EventPlugins, 29 EntityHandlers, 3 metadata fetchers
- **Consumer packages** — `@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next` at v1.1.0
- **12 query domains** — Profiles, Digital Assets, NFTs, Owned Assets, Owned Tokens, Followers, Creators, Issued Assets, Encrypted Assets, Data Changed Events, Token ID Data Changed Events, Universal Receiver Events
- **12 subscription hooks** — graphql-ws WebSocket with TanStack Query cache integration
- **12 server action sets** — Next.js `'use server'` with Zod input validation
- **Block ordering** — blockNumber, transactionIndex, logIndex on all 72+ entities with newest/oldest sorting
- **Production Docker Compose** — 9 services (indexer, postgres, hasura, loki, prometheus, alloy, cadvisor, grafana)
- **Monitoring** — Grafana dashboard with panels covering pipeline latency, entity throughput, verification health, metadata fetch, error analysis, container metrics
- **CI/CD** — Layered 9-job pipeline, changesets release flow, preview releases, shared reusable workflows

**Stats:**

- 4 publishable packages with ESM+CJS+DTS builds (v1.1.0)
- 7 internal packages (abi, typeorm, indexer, comparison-tool + 3 deleted)
- Prisma-style include type narrowing (excluded fields absent from TypeScript types)
- 71-key entity registry with compile-time type enforcement and runtime validation
- 103 consumer package tests, 292/306 indexer tests passing (14 known LSP29 test mismatches)

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
- ✓ Production Docker Compose (released image + PG + Hasura + monitoring) — v1.2
- ✓ Block ordering fields on all entities — v1.2
- ✓ Oldest/newest sorting across all 12 domains — v1.2
- ✓ Grafana monitoring dashboards (structured logs + sqd logs) — v1.2
- ✓ Version normalization (0.1.0 for private packages) — v1.2
- ✓ Structured logging overhaul + pipeline instrumentation — v1.2

### Active

- [ ] Docker image release to ghcr.io/chillwhales/lsp-indexer (RELD-01) — pending first merge to main

### Deferred

- Production cutover procedure with rollback plan — deferred from v1.0
- SSR hydration examples and documentation — deferred from v1.1
- Select transform helpers — deferred from v1.1
- Domain-specific stale time tuning — deferred from v1.1
- Multi-instance deployment with failover — deferred from v1.2
- Auto-scaling / Kubernetes — deferred from v1.2
- Database backup automation (S30) — deferred; VPS/volume-level snapshots cover the need

### Out of Scope

- Marketplace functionality — removed from scope
- Mutations/write hooks — indexer is read-only
- Custom cache layer — TanStack Query handles caching
- Apollo/urql adapters — package uses typed fetch
- Mobile-specific hooks — React Native deferred, web-first
- Offline mode — real-time indexing is core value

## Context

- **Monorepo**: 7 packages — `abi` (contract types), `typeorm` (schema/models), `indexer` (canonical), `types` (Zod schemas), `node` (services/parsers/codegen), `react` (TanStack Query hooks), `next` (server actions + hooks)
- **Apps**: `apps/test` — Next.js 16 playground with all 12 domains, client/server mode toggle, subscription demos
- **Stack**: TypeScript, Subsquid EVM Processor, TypeORM + PostgreSQL, Hasura GraphQL, Viem, Node.js 22, TanStack Query, graphql-ws
- **Schema**: ~80+ TypeORM entities generated from `schema.graphql`, mapping 1:1 to LUKSO LSP standards
- **Production**: Docker + VPS, indexing LUKSO mainnet
- **CI/CD**: Layered GitHub Actions pipeline (lint, typecheck, build, test, publint+attw), changesets release flow, preview releases via pkg-pr-new, shared reusable workflows in `chillwhales/.github`
- **Monitoring**: Grafana + Loki + Alloy + Prometheus + cAdvisor in production compose

## Branching & PR Workflow

**Integration branch:** `main`

All milestone work merged through pull requests targeting `main`. Feature branches named `feat/<description>`, PRs always target `main`.

## Constraints

- **Data parity**: V2 produces identical database state to V1 (validated via comparison tool)
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

## Milestone Sequence

| ID   | Title                                | Status   |
| ---- | ------------------------------------ | -------- |
| M001 | Migration (v1.0 → v1.2)             | completed |
| M002 | Docs Site & AI Agent Compatibility   | queued    |

---

_Last updated: 2026-03-18 — M001 complete, S30 deferred_
