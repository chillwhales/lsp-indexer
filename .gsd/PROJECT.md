# LSP Indexer

## What This Is

The LSP Indexer is an open-source blockchain event indexer for the LUKSO network. It listens to on-chain events (transfers, profile updates, data key changes, follower actions, contract deployments), extracts structured data from them, and persists it to PostgreSQL. A Hasura GraphQL API auto-exposes the data for downstream consumers. Four npm packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) provide type-safe access for any app to consume this data — with client-side TanStack Query hooks, real-time WebSocket subscriptions, and Next.js server actions.

## Core Value

Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer — without needing to understand the underlying blockchain, GraphQL schema, or indexing pipeline.

## Current State

**Shipped:** v1.2 Production Readiness (M001 complete)

The full stack is production-ready: indexer with 6-step pipeline, 4 publishable npm packages at v1.1.0, production Docker Compose with monitoring stack, and operational tooling. 12 query domains, 12 subscription hooks, 12 server action sets, block ordering on all entities, Grafana monitoring, layered CI/CD.

## Architecture / Key Patterns

- **Monorepo**: 7 packages — `abi`, `typeorm`, `indexer`, `types` (Zod schemas), `node` (services/parsers/codegen), `react` (TanStack Query hooks), `next` (server actions + hooks)
- **Apps**: `apps/test` — Next.js 16 playground with all 12 domains
- **Stack**: TypeScript, Subsquid EVM Processor, TypeORM + PostgreSQL, Hasura GraphQL, Viem, Node.js 22, TanStack Query, graphql-ws
- **Patterns**: Prisma-style include type narrowing, 3-overload generic `<const I>`, TkDodo query key factories, dual-package hooks (react direct / next via server actions)

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Migration (v1.0 → v1.2) — complete
- [ ] M004: Mutual Follow Hooks — social graph intersection queries
