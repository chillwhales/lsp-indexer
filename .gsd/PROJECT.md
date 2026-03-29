# LSP Indexer

## What This Is

The LSP Indexer is an open-source blockchain event indexer for the LUKSO network. It listens to on-chain events (transfers, profile updates, data key changes, follower actions, contract deployments), extracts structured data from them, and persists it to PostgreSQL. A Hasura GraphQL API auto-exposes the data for downstream consumers. Four npm packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) provide type-safe access for any app to consume this data — with client-side TanStack Query hooks, real-time WebSocket subscriptions, and Next.js server actions.

## Core Value

Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer — without needing to understand the underlying blockchain, GraphQL schema, or indexing pipeline.

## Current State

**Shipped:** v1.4 Batch Encrypted Asset Fetch (M005 complete), InvalidHexBooleanError crash fix (M006 complete)
**In progress:** None

The full stack is production-ready: indexer with 6-step pipeline, 4 publishable npm packages, production Docker Compose with monitoring stack, and operational tooling. 15 query domains (12 original + 3 mutual follow families), 12 subscription hooks, 15 server action sets, block ordering on all entities, Grafana monitoring, layered CI/CD. Three social graph intersection hooks — mutual follows, mutual followers, and followed-by-my-follows — with infinite scroll variants, ProfileInclude type narrowing, playground page, and full docs. Batch encrypted asset fetch by `(address, contentId, revision)` tuples with `_or`/`_and` Hasura pattern, React and Next.js hooks with EncryptedAssetInclude type narrowing, changeset ready for minor release. Defensive `safeHexToBool` wrapper prevents pipeline crashes on rogue `supportsInterface` responses.

**Production issue:** ~~Indexer crashes with `InvalidHexBooleanError` at block 7,137,664 due to a rogue contract returning non-boolean hex from `supportsInterface`. Infinite restart loop — issue #357.~~ Fixed in M006 — `safeHexToBool` wrapper returns false instead of crashing.

## Architecture / Key Patterns

- **Monorepo**: 7 packages — `abi`, `typeorm`, `indexer`, `types` (Zod schemas), `node` (services/parsers/codegen), `react` (TanStack Query hooks), `next` (server actions + hooks)
- **Apps**: `apps/docs` — Next.js 16 playground with all 15 domains + MDX documentation
- **Stack**: TypeScript, Subsquid EVM Processor, TypeORM + PostgreSQL, Hasura GraphQL, Viem, Node.js 22, TanStack Query, graphql-ws
- **Patterns**: Prisma-style include type narrowing, 3-overload generic `<const I>`, TkDodo query key factories, dual-package hooks (react direct / next via server actions)

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Migration (v1.0 → v1.2) — complete
- [x] M004: Mutual Follow Hooks — complete (3 mutual follow hook families, playground page, docs)
- [x] M005: Batch Encrypted Asset Fetch — fetch multiple encrypted assets by `(address, contentId, revision)` tuples in one round trip
- [x] M006: Fix InvalidHexBooleanError crash — defensive hardening of `supportsInterface` verification to handle rogue contract responses
