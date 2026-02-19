---
phase: 09-remaining-query-domains
plan: 10
subsystem: query-domains
tags: [universal-receiver, lsp1, events, hooks, server-actions, playground]

dependency_graph:
  requires: ['09-01']
  provides: ['QUERY-10', 'PAGE-01-universal-receiver']
  affects: ['09-11']

tech_stack:
  added: []
  patterns: ['event-style domain with block_number DESC default sort']

key_files:
  created:
    - packages/types/src/universal-receiver.ts
    - packages/node/src/documents/universal-receiver.ts
    - packages/node/src/parsers/universal-receiver.ts
    - packages/node/src/services/universal-receiver.ts
    - packages/node/src/keys/universal-receiver.ts
    - packages/react/src/hooks/universal-receiver.ts
    - packages/next/src/actions/universal-receiver.ts
    - packages/next/src/hooks/universal-receiver.ts
    - apps/test/src/app/universal-receiver/page.tsx
  modified:
    - packages/types/src/index.ts
    - packages/node/src/index.ts
    - packages/react/src/index.ts
    - packages/next/src/index.ts

decisions:
  - Default sort block_number DESC (newest events first) — event-style domain convention
  - Value field stored as string (large number safety for numeric Hasura type)
  - No single-item tab — events don't have a meaningful primary key for single lookup
  - Filter includes both receiverAddress (address) and from (sender) for flexible querying
  - All address/typeId comparisons use _ilike for case-insensitive matching

metrics:
  duration: ~10 minutes
  completed: 2026-02-19
---

# Phase 9 Plan 10: Universal Receiver Events Domain Summary

**One-liner:** LSP1 Universal Receiver events vertical slice with useUniversalReceiverEvents/useInfiniteUniversalReceiverEvents hooks querying universal_receiver table, default block_number DESC, plus /universal-receiver playground page.

## Task Commits

| Task | Name                               | Commit  | Key Files                                                                |
| ---- | ---------------------------------- | ------- | ------------------------------------------------------------------------ |
| 1    | Types + Node layer                 | 8dd90c4 | universal-receiver.ts (types, documents, parsers, services, keys)        |
| 2    | React/Next hooks + actions         | d4ab024 | hooks/universal-receiver.ts (react, next), actions/universal-receiver.ts |
| 3    | Universal Receiver playground page | b19e315 | app/universal-receiver/page.tsx                                          |

## What Was Built

### Types (`@lsp-indexer/types`)

- `UniversalReceiverEventSchema` — id, address, from, typeId, receivedData, returnedValue, blockNumber, transactionIndex, logIndex, value, timestamp
- `UniversalReceiverFilterSchema` — filter by receiverAddress, from, typeId, blockNumberMin, blockNumberMax
- `UniversalReceiverSortFieldSchema` — sort by blockNumber, receiverAddress, typeId
- Hook param schemas: `UseUniversalReceiverEventsParams`, `UseInfiniteUniversalReceiverEventsParams`

### Node Layer (`@lsp-indexer/node`)

- **Document:** `GetUniversalReceiverEventsDocument` — queries `universal_receiver` (all scalar fields) + aggregate count
- **Parser:** `parseUniversalReceiverEvent` / `parseUniversalReceiverEvents` — maps snake_case Hasura fields to camelCase, converts numeric value to string
- **Service:** `fetchUniversalReceiverEvents` — builds Hasura `where` / `order_by` from flat filter/sort, defaults to `[{ block_number: 'desc' }]` when no sort provided, uses `_ilike` for address/typeId comparisons
- **Keys:** `universalReceiverKeys` — hierarchical query keys (all → list/infinite)

### React Hooks (`@lsp-indexer/react`)

- `useUniversalReceiverEvents(params?)` — useQuery wrapping fetchUniversalReceiverEvents
- `useInfiniteUniversalReceiverEvents(params?)` — useInfiniteQuery with offset-based pagination, flattened events array, destructured infinite properties before rest spread (TS2783 fix)

### Next.js (`@lsp-indexer/next`)

- `getUniversalReceiverEvents` server action with `'use server'` directive
- `useUniversalReceiverEvents` / `useInfiniteUniversalReceiverEvents` hooks mirroring React package, using server action as queryFn

### Playground Page

- `/universal-receiver` route with List and Infinite Scroll tabs
- Client/Server mode toggle (key={mode} for clean remount)
- Filter by receiverAddress, from, typeId, blockNumberMin, blockNumberMax
- Sort by blockNumber (default DESC), receiverAddress, typeId
- UniversalReceiverEventCard with block number badge, truncated hex fields, timestamp, raw JSON toggle

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing digital-assets exports to types/index.ts**

- **Found during:** Task 1 (packages/node build failed on DTS)
- **Issue:** `packages/node/src/services/digital-assets.ts` imports `DigitalAsset`, `DigitalAssetFilter`, `DigitalAssetSort` from `@lsp-indexer/types`, but `packages/types/src/index.ts` did not export the digital-assets module (file existed but was not re-exported from index)
- **Fix:** Added digital-assets domain exports (schemas + types) to `packages/types/src/index.ts`
- **Files modified:** packages/types/src/index.ts
- **Commit:** Included in parallel plan commits

**Note:** Task 1 files were committed by a parallel plan execution (09-09 commit 8dd90c4) that included all universal-receiver node-layer files. This plan verified their correctness and continued with Tasks 2–3.

## Verification Results

1. `pnpm build` succeeds in all 4 packages ✅
2. `useUniversalReceiverEvents`, `useInfiniteUniversalReceiverEvents` exported from both `@lsp-indexer/react` and `@lsp-indexer/next` ✅
3. `getUniversalReceiverEvents` exported from `@lsp-indexer/next` ✅
4. Default sort is `block_number DESC` in service layer ✅
5. Playground page exists at `/universal-receiver` with Client/Server toggle ✅

## Success Criteria

Developer can call `useUniversalReceiverEvents()` and see Universal Receiver events sorted newest-first. **QUERY-10 delivered.** ✅

## Next Phase Readiness

No blockers or concerns for subsequent plans. The universal receiver domain validates the event-style pattern (block_number DESC default sort, no single-item lookup) for event domains.

## Self-Check: PASSED
