# LSP Indexer

## What This Is

The LSP Indexer is an open-source multi-chain EVM blockchain event indexer, currently indexing the LUKSO network with infrastructure being built for any EVM chain. It listens to on-chain events (transfers, profile updates, data key changes, follower actions, contract deployments), extracts structured data from them, and persists it to PostgreSQL. A Hasura GraphQL API auto-exposes the data for downstream consumers. Four npm packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) provide type-safe access for any app to consume this data — with client-side TanStack Query hooks, real-time WebSocket subscriptions, and Next.js server actions.

## Core Value

Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer — without needing to understand the underlying blockchain, GraphQL schema, or indexing pipeline. Multi-chain support extends this to any EVM chain with per-chain plugin whitelisting.

## Current State

**Shipped:** v1.4 Batch Encrypted Asset Fetch (M005 complete), InvalidHexBooleanError crash fix (M006 complete), Chillwhales NFT Extensions (M007 complete)

The full stack is production-ready: indexer with 6-step pipeline, 4 publishable npm packages, production Docker Compose with monitoring stack, and operational tooling. 15 query domains (12 original + 3 mutual follow families) plus collection-attributes aggregate query, 12 subscription hooks, 15 server action sets, block ordering on all entities, Grafana monitoring, layered CI/CD. Three social graph intersection hooks — mutual follows, mutual followers, and followed-by-my-follows — with infinite scroll variants, ProfileInclude type narrowing, playground page, and full docs. Batch encrypted asset fetch by `(address, contentId, revision)` tuples with `_or`/`_and` Hasura pattern, React and Next.js hooks with EncryptedAssetInclude type narrowing, changeset ready for minor release. Defensive `safeHexToBool` wrapper prevents pipeline crashes on rogue `supportsInterface` responses. NFTs extended with 7 chillwhales-specific fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction), 4 game-property filters, score sorting, and a collection-attributes query vertical for filter facet dropdowns.

**In progress:** Multi-chain infrastructure — consolidating indexer packages (M008), building chain config registry and network-aware schema (M009), propagating network dimension through consumer packages (M010).

## Architecture / Key Patterns

- **Monorepo**: 7 packages — `abi`, `typeorm`, `indexer`, `types` (Zod schemas), `node` (services/parsers/codegen), `react` (TanStack Query hooks), `next` (server actions + hooks). `abi` and `typeorm` are being consolidated into `indexer` (M008).
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
- [x] M007: Chillwhales NFT Extensions — 7 chillwhales NFT fields, 4 game-property filters, score sorting, collection-attributes query vertical, full docs
- [ ] M008: Package Consolidation — merge `abi` + `typeorm` into `indexer` for single-package build
- [ ] M009: Multi-chain Indexer Infrastructure — chain config registry, network column, parameterized processor, LUKSO testnet proof
- [ ] M010: Multi-chain Consumer Packages — network filter on all types, hooks, server actions, docs
