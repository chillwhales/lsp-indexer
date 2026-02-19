---
phase: 09-remaining-query-domains
plan: 06
subsystem: query-domains
tags: [creators, lsp4, hooks, server-actions, playground]

dependency_graph:
  requires: ['09-01']
  provides: ['QUERY-06', 'PAGE-01-creators']
  affects: ['09-11']

tech_stack:
  added: []
  patterns: ['TypedDocumentString for non-codegen documents', 'simple domain vertical slice']

key_files:
  created:
    - packages/types/src/creators.ts
    - packages/node/src/documents/creators.ts
    - packages/node/src/parsers/creators.ts
    - packages/node/src/services/creators.ts
    - packages/node/src/keys/creators.ts
    - packages/react/src/hooks/creators.ts
    - packages/next/src/actions/creators.ts
    - packages/next/src/hooks/creators.ts
    - apps/test/src/app/creators/page.tsx
  modified:
    - packages/types/src/index.ts
    - packages/node/src/index.ts
    - packages/react/src/index.ts
    - packages/next/src/index.ts
    - apps/test/src/components/nav.tsx

decisions:
  - Used TypedDocumentString directly instead of graphql() tag for creator document (codegen only registers pre-existing queries)
  - CreatorCard uses truncated address display (0x1234...5678) for both fields
  - No "single item" tab — creators don't have a meaningful primary key for single lookup
  - Sort defaults to assetAddress ascending

metrics:
  duration: ~9 minutes
  completed: 2026-02-19
---

# Phase 9 Plan 06: Creator Addresses Domain Summary

**One-liner:** LSP4 creator addresses vertical slice with useCreatorAddresses/useInfiniteCreatorAddresses hooks querying lsp4_creator table, plus /creators playground page.

## Task Commits

| Task | Name                       | Commit  | Key Files                                               |
| ---- | -------------------------- | ------- | ------------------------------------------------------- |
| 1    | Types + Node layer         | f68bf00 | creators.ts (types, documents, parsers, services, keys) |
| 2    | React/Next hooks + actions | 79ba255 | hooks/creators.ts (react, next), actions/creators.ts    |
| 3    | Creators playground page   | 157ca16 | app/creators/page.tsx, nav.tsx                          |

## What Was Built

### Types (`@lsp-indexer/types`)

- `CreatorSchema` — assetAddress + creatorAddress
- `CreatorFilterSchema` — filter by assetAddress, creatorAddress
- `CreatorSortFieldSchema` — sort by assetAddress or creatorAddress
- Hook param schemas: `UseCreatorAddressesParams`, `UseInfiniteCreatorAddressesParams`

### Node Layer (`@lsp-indexer/node`)

- **Document:** `GetCreatorAddressesDocument` — queries `lsp4_creator` + aggregate count, built with `new TypedDocumentString()` (not codegen `graphql()` tag)
- **Parser:** `parseCreator` / `parseCreators` — maps `address` → `assetAddress`, `creator_address` → `creatorAddress`
- **Service:** `fetchCreatorAddresses` — builds Hasura `where` / `order_by` from flat filter/sort, uses `_ilike` for address comparisons
- **Keys:** `creatorKeys` — hierarchical query keys (all → list/infinite)

### React Hooks (`@lsp-indexer/react`)

- `useCreatorAddresses(params?)` — useQuery wrapping fetchCreatorAddresses
- `useInfiniteCreatorAddresses(params?)` — useInfiniteQuery with offset-based pagination, flattened creators array

### Next.js (`@lsp-indexer/next`)

- `getCreatorAddresses` server action with `'use server'` directive
- `useCreatorAddresses` / `useInfiniteCreatorAddresses` hooks mirroring React package, using server action as queryFn

### Playground Page

- `/creators` route with List and Infinite Scroll tabs
- Client/Server mode toggle (key={mode} for clean remount)
- Filter by asset address and creator address
- Sort by asset address or creator address
- CreatorCard with truncated mono-spaced addresses
- Sidebar nav updated (creators → available: true)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing social domain exports to types/index.ts**

- **Found during:** Task 1 (packages/node build failed on DTS)
- **Issue:** `packages/node/src/services/social.ts` imports `FollowCount`, `Follower`, `FollowerSort` from `@lsp-indexer/types`, but `packages/types/src/index.ts` did not export the social module (social.ts file existed but was not re-exported)
- **Fix:** Added social domain exports (schemas + types) to `packages/types/src/index.ts`
- **Files modified:** packages/types/src/index.ts
- **Commit:** f68bf00 (included in Task 1)

## Verification Results

1. `pnpm build` succeeds in all 4 packages ✅
2. `useCreatorAddresses`, `useInfiniteCreatorAddresses` exported from both `@lsp-indexer/react` and `@lsp-indexer/next` ✅
3. `getCreatorAddresses` exported from `@lsp-indexer/next` ✅
4. Playground page exists at `/creators` with Client/Server toggle ✅

## Success Criteria

Developer can call `useCreatorAddresses({ filter: { assetAddress: '0x...' } })` and get typed `Creator[]` data showing which UPs created that asset. **QUERY-06 delivered.** ✅

## Next Phase Readiness

No blockers or concerns for subsequent plans. The creator domain is a clean, simple vertical slice that validates the pattern for address-only domains.

## Self-Check: PASSED
