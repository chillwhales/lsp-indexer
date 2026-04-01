---
depends_on: [M009]
---

# M010: Multi-chain Consumer Packages

**Gathered:** 2026-04-01
**Status:** Ready for planning

## Project Description

Propagate the `network` dimension through all 4 consumer packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`). Every filter type gets an optional `network` field. Every GraphQL document passes it to Hasura. Every hook and server action accepts it. Docs and playground updated.

## Why This Milestone

M009 adds the `network` column to the indexer's Hasura API, but the consumer packages don't know about it yet. Without this milestone, frontend apps have no way to filter by chain through the type-safe hook API — they'd have to drop down to raw GraphQL.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Call `useProfiles({ filter: { network: 'lukso' } })` to get LUKSO-only profiles
- Call `useProfiles()` (no network) to get profiles from all chains
- Use network param on all 15 query domains, subscriptions, and server actions
- See the network parameter documented on all docs pages

### Entry point / environment

- Entry point: `pnpm build` from root, docs playground at localhost:3000
- Environment: local dev
- Live dependencies involved: Hasura GraphQL API (must have network column from M009)

## Completion Class

- Contract complete means: all filter types include optional network field, all GraphQL documents pass network variable, 5-package build passes
- Integration complete means: hooks return correct results when network filter is applied against a multi-chain Hasura instance
- Operational complete means: none
- UAT: docs pages show network parameter, playground allows chain selection

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Every filter Zod schema in types package has optional `network: z.string()`
- Every GraphQL document in node package accepts and applies `$network` variable
- Every React hook and Next.js action/hook passes network through
- Existing callers without network param continue to work (backward compatible)
- 5-package build passes cleanly

## Risks and Unknowns

- Scale of change — 161 React hook files, 75 Next.js files, 13 documents, 13 filter types. Mechanical but easy to miss spots.
- Subscription hooks — may need different network propagation pattern than query hooks.
- Key factory cache keys — must include network to prevent cross-chain cache pollution.

## Existing Codebase / Prior Art

- `packages/types/src/` — 13+ filter type files with Zod schemas
- `packages/node/src/documents/` — 13 GraphQL document files
- `packages/node/src/services/` — 14 service files with fetch functions
- `packages/node/src/keys/` — TkDodo query key factories
- `packages/node/src/parsers/` — parser functions
- `packages/react/src/hooks/` — 161 hook files using createUseList, createUseInfinite patterns
- `packages/next/src/actions/` — server action files
- `packages/next/src/hooks/` — Next.js hook files
- `apps/docs/` — MDX documentation pages

> See `.gsd/DECISIONS.md` — D018 covers the optional network filter API decision.

## Relevant Requirements

- R037 — Network filter on all consumer filter types (primary)
- R038 — Network-aware React hooks (primary)
- R039 — Network-aware Next.js server actions + hooks (primary)
- R040 — Consumer package docs updated (primary)

## Scope

### In Scope

- Optional `network: z.string()` on every filter schema in types package
- `$network` variable in every GraphQL document in node package
- Network propagation in all service functions, parsers, and key factories
- Network parameter on all React hooks (query, infinite, batch)
- Network parameter on all Next.js server actions and hooks
- Network parameter on all subscription hooks
- Query key factories include network for correct cache isolation
- Docs pages updated with network parameter documentation
- Playground chain selector

### Out of Scope / Non-Goals

- Indexer changes (already done in M009)
- New query domains
- Non-LSP chain plugin authoring

## Technical Constraints

- Backward compatible — omitting network must return all-chain data (existing behavior)
- Key factories must include network in cache keys to prevent stale cross-chain data
- Subscription documents need network in the where-clause variable

## Integration Points

- Hasura GraphQL API — must have `network` column from M009
- TanStack Query cache — key factories must include network

## Open Questions

- None — patterns are well-established from 7 prior milestones
