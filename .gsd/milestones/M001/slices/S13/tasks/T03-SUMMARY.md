---
id: T03
parent: S13
milestone: M001
provides: []
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 
verification_result: passed
completed_at: 
blocker_discovered: false
---
# T03: 09.1-digital-assets 03

**# Phase 9.1 Plan 03: Digital Asset Hooks + Server Actions + Build Validation Summary**

## What Happened

# Phase 9.1 Plan 03: Digital Asset Hooks + Server Actions + Build Validation Summary

**One-liner:** Three TanStack Query hooks in @lsp-indexer/react (direct Hasura) + three hooks + two server actions in @lsp-indexer/next (routed via 'use server') — all 4 packages build and typecheck clean.

## Objective

Create consumer-facing hooks for both @lsp-indexer/react and @lsp-indexer/next, server actions, and wire all digital asset exports through every package entry point.

## Tasks Completed

| Task | Name                                                          | Commit  | Key Files                                                                                                                          |
| ---- | ------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Create React hooks, Next.js server actions, and Next.js hooks | 4b2d5f6 | packages/react/src/hooks/digital-assets.ts, packages/next/src/actions/digital-assets.ts, packages/next/src/hooks/digital-assets.ts |
| 2    | Wire entry points and validate builds                         | 0b1a453 | packages/react/src/index.ts, packages/next/src/index.ts                                                                            |

## What Was Built

### Task 1: Hooks and Server Actions

**New file: `packages/react/src/hooks/digital-assets.ts`**

Three TanStack Query hooks calling Hasura directly from the browser via `getClientUrl()`:

- **`useDigitalAsset(params)`** — `useQuery` wrapping `fetchDigitalAsset`, disabled when address is falsy, returns `{ digitalAsset: data ?? null, ...rest }`
- **`useDigitalAssets(params?)`** — `useQuery` wrapping `fetchDigitalAssets`, returns `{ digitalAssets: data?.digitalAssets ?? [], totalCount: data?.totalCount ?? 0, ...rest }`
- **`useInfiniteDigitalAssets(params?)`** — `useInfiniteQuery` with offset pagination, flattened pages via `useMemo`, returns `{ digitalAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }`

**New file: `packages/next/src/actions/digital-assets.ts`**

Two Next.js server actions with `'use server'` directive:

- **`getDigitalAsset(address, include?)`** — runs `fetchDigitalAsset` server-side via `getServerUrl()`
- **`getDigitalAssets(params?)`** — runs `fetchDigitalAssets` server-side via `getServerUrl()`

**New file: `packages/next/src/hooks/digital-assets.ts`**

Three TanStack Query hooks identical in API to @lsp-indexer/react, but routing through server actions as queryFn:

- **`useDigitalAsset`**, **`useDigitalAssets`**, **`useInfiniteDigitalAssets`** — same return shapes, use `digitalAssetKeys` from `@lsp-indexer/node`, call `getDigitalAsset`/`getDigitalAssets` server actions

### Task 2: Entry Points + Build Validation

**Updated `packages/react/src/index.ts`:**

```typescript
export {
  useDigitalAsset,
  useDigitalAssets,
  useInfiniteDigitalAssets,
} from './hooks/digital-assets';
```

**Updated `packages/next/src/index.ts`:**

```typescript
export { getDigitalAsset, getDigitalAssets } from './actions/digital-assets';
export {
  useDigitalAsset,
  useDigitalAssets,
  useInfiniteDigitalAssets,
} from './hooks/digital-assets';
```

**`packages/node/src/index.ts`:** Already had all digital asset exports from plan 02 — no changes needed.

**All 4 packages built and typechecked clean:**

- `@lsp-indexer/types` ✅ build + typecheck
- `@lsp-indexer/node` ✅ build + typecheck
- `@lsp-indexer/react` ✅ build + typecheck
- `@lsp-indexer/next` ✅ build + typecheck

## Key Patterns Applied

### TS2783 Avoidance

Infinite query properties destructured before rest spread:

```typescript
const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
```

This prevents TypeScript error TS2783 ("property would overwrite") when the same property appears in both the result object and the spread.

### Separate Query Key Namespaces

`useDigitalAssets` uses `digitalAssetKeys.list(...)` → `['digital-assets', 'list', ...]`
`useInfiniteDigitalAssets` uses `digitalAssetKeys.infinite(...)` → `['digital-assets', 'infinite', ...]`

These are fundamentally different data structures in TanStack Query cache (single result vs. pages array). Separate namespaces prevent cache corruption at runtime.

### Dual-Package Hook Pattern

Same hook API exposed from two packages with different transport layers:

- `@lsp-indexer/react`: hooks call Hasura directly (getClientUrl) — for apps exposing the endpoint
- `@lsp-indexer/next`: hooks call server actions — for apps keeping endpoint hidden from browser

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

- **Phase 9.1 Plan 04 (playground UI):** All hooks importable from `@lsp-indexer/react` and `@lsp-indexer/next`. Digital asset API is complete.
- **Available from `@lsp-indexer/node`:** `fetchDigitalAsset`, `fetchDigitalAssets`, `digitalAssetKeys`, `parseDigitalAsset`, `parseDigitalAssets`, `FetchDigitalAssetsResult`, `GetDigitalAssetDocument`, `GetDigitalAssetsDocument`
- **Available from `@lsp-indexer/react`:** `useDigitalAsset`, `useDigitalAssets`, `useInfiniteDigitalAssets`
- **Available from `@lsp-indexer/next`:** `getDigitalAsset`, `getDigitalAssets`, `useDigitalAsset`, `useDigitalAssets`, `useInfiniteDigitalAssets`
- **Available from `@lsp-indexer/types`:** `DigitalAsset`, `DigitalAssetFilter`, `DigitalAssetSort`, `DigitalAssetInclude`, `TokenType`, `UseDigitalAssetParams`, `UseDigitalAssetsParams`, `UseInfiniteDigitalAssetsParams`

## Self-Check: PASSED
