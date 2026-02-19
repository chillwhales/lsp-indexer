---
phase: 09-remaining-query-domains
plan: 09
subsystem: data-changed-events
tags: [erc725, data-changed, hooks, server-actions, graphql, hasura]
dependency-graph:
  requires: ['09-01']
  provides: ['QUERY-09', 'PAGE-01-data-changed']
  affects: ['10-subscriptions']
tech-stack:
  added: []
  patterns: ['event-style domain (list-only, no single-item)', 'default block_number DESC sort']
key-files:
  created:
    - packages/types/src/data-changed.ts
    - packages/node/src/documents/data-changed.ts
    - packages/node/src/parsers/data-changed.ts
    - packages/node/src/services/data-changed.ts
    - packages/node/src/keys/data-changed.ts
    - packages/react/src/hooks/data-changed.ts
    - packages/next/src/actions/data-changed.ts
    - packages/next/src/hooks/data-changed.ts
    - apps/test/src/app/data-changed/page.tsx
  modified:
    - packages/types/src/index.ts
    - packages/node/src/index.ts
    - packages/node/src/graphql/gql.ts
    - packages/node/src/graphql/graphql.ts
    - packages/react/src/index.ts
    - packages/next/src/index.ts
decisions:
  - id: DC-01
    decision: 'Event-style domain: list-only queries (no single-item lookup)'
    rationale: 'data_changed rows are events, not entities — there is no use case for fetching a single data change by ID'
  - id: DC-02
    decision: 'Default sort is block_number DESC (newest events first)'
    rationale: 'Consistent with research findings; users want to see most recent ERC725 data changes first'
  - id: DC-03
    decision: 'Filter uses contractAddress (maps to address field) and dataKey with _ilike'
    rationale: 'Case-insensitive matching for EIP-55 mixed-case addresses; dataKey is hex so case insensitive matching is appropriate'
metrics:
  duration: 14m
  completed: 2026-02-19
---

# Phase 9 Plan 09: Data Changed Events Domain Summary

**One-liner:** ERC725 data change events vertical slice with block_number DESC default, contract/dataKey filters, and playground at /data-changed

## What Was Built

Full vertical slice for the `data_changed` Hasura table across all 4 packages:

1. **@lsp-indexer/types** — `DataChangedEventSchema` (Zod), filter/sort schemas, hook param schemas, all inferred types
2. **@lsp-indexer/node** — `GetDataChangedEventsDocument` (GraphQL + codegen), `parseDataChangedEvent`/`parseDataChangedEvents` parser, `fetchDataChangedEvents` service with default `block_number DESC`, `dataChangedKeys` query key factory
3. **@lsp-indexer/react** — `useDataChangedEvents` (useQuery), `useInfiniteDataChangedEvents` (useInfiniteQuery with flattened pages)
4. **@lsp-indexer/next** — `getDataChangedEvents` server action, mirror hooks via server action
5. **Playground** — `/data-changed` page with List and Infinite Scroll tabs, Client/Server toggle, contract/dataKey/blockNumber range filters

## Task Commits

| Task | Name                       | Commit    | Key Files                                                                        |
| ---- | -------------------------- | --------- | -------------------------------------------------------------------------------- |
| 1    | Types + Node layer         | `8dd90c4` | data-changed.ts (types, documents, parsers, services, keys), codegen regenerated |
| 2    | React/Next hooks + actions | `3d78307` | react hooks, next actions + hooks, index exports                                 |
| 3    | Playground page            | `be3c067` | apps/test/src/app/data-changed/page.tsx                                          |

## Decisions Made

| ID    | Decision                                    | Rationale                                                                 |
| ----- | ------------------------------------------- | ------------------------------------------------------------------------- |
| DC-01 | Event-style domain: list-only queries       | data_changed rows are events, not entities — no single-item lookup needed |
| DC-02 | Default sort: block_number DESC             | Users want newest ERC725 data changes first                               |
| DC-03 | contractAddress/dataKey filters use \_ilike | Case-insensitive for EIP-55 mixed-case addresses                          |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing digital-assets type exports to unblock build**

- **Found during:** Task 1 verification
- **Issue:** `packages/node` DTS build failed because `DigitalAsset`, `DigitalAssetFilter`, `DigitalAssetSort` types from a parallel domain execution were imported in node services but not exported from `packages/types/src/index.ts`
- **Fix:** Added digital-assets Zod schema and type exports to `packages/types/src/index.ts`
- **Files modified:** `packages/types/src/index.ts`
- **Commit:** Included in `8dd90c4`

## Verification

- [x] `pnpm build` succeeds in all 4 packages (types → node → react → next)
- [x] `useDataChangedEvents` and `useInfiniteDataChangedEvents` exported from `@lsp-indexer/react`
- [x] `useDataChangedEvents` and `useInfiniteDataChangedEvents` exported from `@lsp-indexer/next`
- [x] `getDataChangedEvents` exported from `@lsp-indexer/next`
- [x] Default sort is `block_number DESC` in service layer
- [x] Playground page at `/data-changed` with Client/Server toggle
- [x] `apps/test` builds successfully with `/data-changed` route

## Next Phase Readiness

- QUERY-09 delivered — data changed events domain complete
- Ready for Phase 10 subscriptions (data_changed subscription support)
- Playground page provides visual validation endpoint

## Self-Check: PASSED
