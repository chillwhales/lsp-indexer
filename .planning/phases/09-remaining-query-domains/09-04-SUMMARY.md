---
phase: 09-remaining-query-domains
plan: 04
subsystem: owned-assets
tags: [owned-assets, owned-tokens, lsp7, lsp8, graphql, hooks, server-actions, playground]
depends_on:
  requires: ['09-01']
  provides: ['QUERY-04', 'PAGE-01-owned-assets']
  affects: ['10-subscriptions']
tech-stack:
  added: []
  patterns: ['vertical-slice', 'offset-pagination', 'infinite-scroll', 'dual-table-domain']
key-files:
  created:
    - packages/types/src/owned-assets.ts
    - packages/node/src/documents/owned-assets.ts
    - packages/node/src/parsers/owned-assets.ts
    - packages/node/src/services/owned-assets.ts
    - packages/node/src/keys/owned-assets.ts
    - packages/react/src/hooks/owned-assets.ts
    - packages/next/src/actions/owned-assets.ts
    - packages/next/src/hooks/owned-assets.ts
    - apps/test/src/app/owned-assets/page.tsx
  modified:
    - packages/types/src/index.ts
    - packages/node/src/index.ts
    - packages/react/src/index.ts
    - packages/next/src/index.ts
    - apps/test/src/components/nav.tsx
decisions:
  - id: OA-01
    description: 'Both owned_asset and owned_token types share one file set (owned-assets.ts) across all layers'
  - id: OA-02
    description: 'Token name/symbol fetched via digitalAsset.lsp4TokenName.value (not nft.digitalAsset path for owned_token)'
  - id: OA-03
    description: 'Balance stored as nullable string (Hasura numeric scalar, large numbers)'
  - id: OA-04
    description: 'Separate query key factories (ownedAssetKeys/ownedTokenKeys) with namespace isolation'
metrics:
  duration: '13 minutes'
  completed: '2026-02-19'
---

# Phase 9 Plan 04: Owned Assets Domain Summary

**One-liner:** Dual-table owned assets vertical slice covering LSP7 fungible (owned_asset) and LSP8 NFT (owned_token) Hasura tables with Zod types, GraphQL documents, parsers, services, query keys, React/Next.js hooks, server actions, and playground page at /owned-assets.

## Task Commits

| Task | Name                                | Commit  | Key Changes                                                                      |
| ---- | ----------------------------------- | ------- | -------------------------------------------------------------------------------- |
| 1    | Types + Node layer                  | 449bfc5 | OwnedAsset + OwnedToken Zod schemas, documents, parsers, services, keys, exports |
| 2    | React hooks + Next.js actions/hooks | e1c0eb7 | useOwnedAssets, useOwnedTokens + infinite variants in both packages              |
| 3    | Owned Assets playground page        | 05939fc | /owned-assets page with Assets/Tokens tabs, Client/Server toggle                 |

## What Was Built

### Types (`@lsp-indexer/types`)

- `OwnedAssetSchema` — Zod schema with ownerAddress, assetAddress, balance (nullable string), name, symbol
- `OwnedTokenSchema` — Zod schema with ownerAddress, assetAddress, tokenId, name, symbol
- `OwnedAssetFilterSchema` — ownerAddress (ilike), assetAddress (ilike)
- `OwnedTokenFilterSchema` — ownerAddress (ilike), assetAddress (ilike), tokenId (ilike)
- `OwnedAssetSortFieldSchema` — assetAddress, balance
- `OwnedTokenSortFieldSchema` — assetAddress, tokenId
- All hook param schemas and inferred TypeScript types exported

### Node Layer (`@lsp-indexer/node`)

- **Documents:** `GetOwnedAssetsDocument` and `GetOwnedTokensDocument` with Hasura aggregate counts
  - OwnedAsset fields: owner, address, balance, digitalAsset.lsp4TokenName.value, digitalAsset.lsp4TokenSymbol.value
  - OwnedToken fields: owner, address, token_id, digitalAsset.lsp4TokenName.value, digitalAsset.lsp4TokenSymbol.value
- **Parsers:** `parseOwnedAsset` / `parseOwnedAssets` and `parseOwnedToken` / `parseOwnedTokens` — maps Hasura snake_case to camelCase
- **Services:** `fetchOwnedAssets` / `fetchOwnedTokens` with `buildOwnedAssetWhere` and `buildOwnedTokenWhere`
  - All address/tokenId comparisons use `_ilike` (case-insensitive)
- **Keys:** Separate `ownedAssetKeys` and `ownedTokenKeys` factories with `.all`, `.assets()`/`.tokens()` namespace, `.list()`, `.infinite()`

### React Hooks (`@lsp-indexer/react`)

- `useOwnedAssets({ filter?, sort?, limit?, offset? })` — paginated LSP7 asset list
- `useInfiniteOwnedAssets({ filter?, sort?, pageSize? })` — infinite scroll for LSP7 assets
- `useOwnedTokens({ filter?, sort?, limit?, offset? })` — paginated LSP8 token list
- `useInfiniteOwnedTokens({ filter?, sort?, pageSize? })` — infinite scroll for LSP8 tokens
- All infinite hooks destructure properties before rest spread (TS2783 fix)

### Next.js Actions + Hooks (`@lsp-indexer/next`)

- `getOwnedAssets(params?)` / `getOwnedTokens(params?)` — server actions with `'use server'` directive
- `useOwnedAssets`, `useInfiniteOwnedAssets`, `useOwnedTokens`, `useInfiniteOwnedTokens` — identical API to react hooks, routed through server actions

### Playground Page

- `/owned-assets` — full playground with Client/Server mode toggle
- **Top-level tabs:** "Owned Assets (LSP7)" and "Owned Tokens (LSP8)"
- **Each tab:** Sub-tabs for List and Infinite Scroll views
- `OwnedAssetCard`: owner (truncated mono), asset address, balance, name+symbol badges
- `OwnedTokenCard`: owner (truncated mono), collection address, tokenId (mono, truncated), name+symbol badges
- `key={mode}` on outer Tabs forces full remount when switching Client/Server

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed missing `Rss` import in nav.tsx**

- **Found during:** Task 3 (build failed)
- **Issue:** `apps/test/src/components/nav.tsx` referenced `Rss` icon but didn't import it from lucide-react
- **Fix:** Added `Rss` to the lucide-react import list
- **Files modified:** `apps/test/src/components/nav.tsx`
- **Commit:** 05939fc

**2. [Rule 3 - Blocking] Updated nav route for owned assets**

- **Found during:** Task 3
- **Issue:** Nav had `/owned` but playground page is at `/owned-assets`; nav entry was marked `available: false`
- **Fix:** Changed href to `/owned-assets` and set `available: true`
- **Files modified:** `apps/test/src/components/nav.tsx`
- **Commit:** 05939fc

## Verification

1. ✅ `pnpm build` succeeds in all 4 packages (types, node, react, next)
2. ✅ `useOwnedAssets`, `useOwnedTokens`, `useInfiniteOwnedAssets`, `useInfiniteOwnedTokens` exported from `@lsp-indexer/react`
3. ✅ Same 4 hooks + `getOwnedAssets`, `getOwnedTokens` exported from `@lsp-indexer/next`
4. ✅ Playground page exists at `/owned-assets` with two data-type tabs (Assets and Tokens)
5. ✅ `apps/test` builds successfully with owned-assets route in the output

## Next Phase Readiness

- Owned assets domain fully operational — QUERY-04 delivered
- Two Hasura tables (owned_asset + owned_token) covered in a single domain file set
- Playground page functional for testing against live Hasura data
- Ready for Phase 10 (subscriptions) to add real-time ownership updates

## Self-Check: PASSED
